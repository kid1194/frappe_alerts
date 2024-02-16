# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import cint

from .settings import settings


## [Hooks]
def auto_check_for_update():
    doc = settings()
    if cint(doc.is_enabled) and cint(doc.auto_check_for_update):
        update_check(doc)


# [Alerts Settings Form]
@frappe.whitelist()
def check_for_update():
    doc = settings()
    if cint(doc.is_enabled):
        from frappe.utils import get_datetime
        
        if cint((get_datetime() - get_datetime(doc.latest_check)).minutes) < 5:
            return 0
        
        return update_check(doc)
    
    return 0


# [Internal]
def update_check(doc):
    from frappe.utils import get_request_session
    
    try:
        http = get_request_session()
        request = http.request(
            "GET",
            "https://api.github.com/repos/kid1194/frappe_alerts/releases/latest"
        )
        status_code = request.status_code
        data = request.json()
    except Exception as exc:
        from .common import log_error
        
        log_error(str(exc))
        return 0
    
    if status_code != 200 and status_code != 201:
        return 0
    
    from .common import parse_json
    
    data = parse_json(data)
    
    if (
        not data or
        not isinstance(data, dict) or
        not data.get("tag_name", "") or
        not data.get("body", "")
    ):
        return 0
    
    import re
    
    latest_version = re.findall(r"(\d+(?:\.\d+|)+)", str(data.get("tag_name")))
    if not latest_version:
        return 0
    
    from frappe.utils import now
    
    from alerts import __version__
    
    latest_version = latest_version.pop()
    has_update = compare_versions(latest_version, __version__) > 0
    doc.latest_check = now()
    if has_update:
        doc.latest_version = latest_version
        doc.has_update = 1
    
    doc.save(ignore_permissions=True)
    
    if (
        has_update and
        str(data.get("body")) and
        cint(doc.send_update_notification)
    ):
        from .background import is_job_running, enqueue_job
        
        job_name = f"alerts-send-notification-{latest_version}"
        if not is_job_running(job_name):
            enqueue_job(
                "alerts.utils.update.send_notification",
                job_name,
                version=latest_version,
                sender=doc.update_notification_sender,
                receivers=[v.user for v in doc.update_notification_receivers],
                message=str(data.get("body"))
            )
    
    return 1 if has_update else 0


## [Internal]
def compare_versions(verA, verB):
    verA = verA.split(".")
    lenA = len(verA)
    verB = verB.split(".")
    lenB = len(verB)
    
    if lenA > lenB:
        for i in range(lenB, lenA):
            verB.append(0)
    elif lenA < lenB:
        for i in range(lenA, lenB):
            verA.append(0)
    
    for a, b in zip(verA, verB):
        d = cint(a) - cint(b)
        if d == 0:
            continue
        return 1 if d > 0 else -1
    
    return 0


# [Internal]
def send_notification(version, sender, receivers, message):
    from frappe.utils import markdown
    
    message = markdown(message)
    if not message:
        return 0
    
    from .common import is_doc_exists
    
    if not is_doc_exists("User", {"name": sender, "enabled": 1}):
        return 0
    
    receivers = filter_receivers(receivers);
    if not receivers:
        return 0
    
    from frappe import _
    
    from alerts import __module__
    
    from .settings import settings_dt
    
    dt = settings_dt()
    doc = {
        "document_type": dt,
        "document_name": dt,
        "from_user": sender,
        "subject": "{0}: {1}".format(__module__, _("New Version Available")),
        "type": "Alert",
        "email_content": "<p><h2>{0} {1}</h2></p><p>{2}</p>".format(
            _("Version"), version, _(message)
        ),
    }
    for receiver in receivers:
        (frappe.new_doc("Notification Log")
            .update(doc)
            .update({"for_user": receiver})
            .insert(ignore_permissions=True, ignore_mandatory=True))


# [Internal]
def filter_receivers(names: list):
    dt = "User"
    names = list(set(names))
    names = frappe.get_all(
        dt,
        fields=["name"],
        filters=[
            [dt, "name", "in", names],
            [dt, "enabled", "=", 1]
        ],
        pluck="name",
        ignore_permissions=True,
        strict=False
    )
    if not names or not isinstance(names, list):
        return None
    
    dt = "Notification Settings"
    users = frappe.get_all(
        dt,
        fields=["name", "enabled"],
        filters=[[dt, "name", "in", names]],
        pluck="name",
        ignore_permissions=True,
        strict=False
    )
    if users and isinstance(users, list):
        for v in users:
            if v["name"] in names and not cint(v["enabled"]):
                names.pop(names.index(v["name"]))
    
    if not names:
        return None
    
    return names
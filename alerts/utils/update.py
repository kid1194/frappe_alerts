# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import cint


# [Hooks]
def auto_check_for_update():
    from .system import settings
    
    doc = settings()
    if doc._is_enabled and doc._auto_check_for_update:
        update_check(doc)


# [A Alerts Settings Form]
@frappe.whitelist()
def check_for_update():
    from .system import settings
    
    doc = settings()
    if not doc._is_enabled:
        return 0
    
    from frappe.utils import get_datetime
    
    dif = get_datetime(doc.latest_check)
    dif = float((get_datetime() - dif).total_seconds())
    dif = abs(cint(dif / 60))
    return update_check(doc) if dif >= 5 else 0


# [Internal]
def update_check(doc):
    from frappe.utils import get_request_session
    
    from alerts import __update_api__
    
    try:
        http = get_request_session()
        request = http.request("GET", __update_api__)
        status = cint(request.status_code)
        data = request.json()
    except Exception as exc:
        from .common import log_error
        
        log_error(str(exc))
        return 0
    
    if status != 200 and status != 201:
        return 0
    
    from .common import parse_json
    
    data = parse_json(data)
    if (
        not data or not isinstance(data, dict) or
        not data.get("tag_name", "") or
        not isinstance(data["tag_name"], str)
    ):
        return 0
    
    import re
    
    latest_version = re.findall(r"(\d+(?:\.\d+|)+)", data["tag_name"])
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
    
    if has_update and doc._send_update_notification:
        from .background import is_job_running
        
        job_id = f"alerts-send-notification-{latest_version}"
        if not is_job_running(job_id):
            from .background import enqueue_job
            
            receivers = [v.user for v in doc.update_notification_receivers]
            enqueue_job(
                "alerts.utils.update.send_notification",
                job_id,
                timeout=len(receivers) * 200,
                version=latest_version,
                sender=doc.update_notification_sender,
                receivers=receivers,
                message=data.get("body", "")
            )
    
    return 1 if has_update else 0


# [Internal]
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
        if d != 0:
            return 1 if d > 0 else -1
    
    return 0


# [Internal]
def send_notification(version, sender, receivers, message):
    from .common import is_doc_exists
    
    if not is_doc_exists("User", {"name": sender, "enabled": 1}):
        return 0
    
    receivers = filter_receivers(receivers)
    if not receivers:
        return 0
    
    from frappe import _
    from frappe.utils import markdown
    
    from alerts import __module__
    
    from .system import _SETTINGS_DT_
    
    if message:
        message = markdown(message)
    if message:
        message = _(message)
    else:
        message = _("New version is currently available.")
    
    doc = {
        "document_type": _SETTINGS_DT_,
        "document_name": _SETTINGS_DT_,
        "from_user": sender,
        "subject": _("{0}: New Version").format(_(__module__)),
        "type": "Alert",
        "email_content": _("<p><h4>Version {0}</h4></p>\n<p>{1}</p>").format(version, message)
    }
    for receiver in receivers:
        (frappe.new_doc("Notification Log")
            .update(doc)
            .update({"for_user": receiver})
            .insert(ignore_permissions=True, ignore_mandatory=True))
    
    return 1


# [Internal]
def filter_receivers(names: list):
    from .common import filter_docs
    
    names = filter_docs(
        "User", "name",
        {"name": names, "enabled": 1}
    )
    if not names:
        return 0
    
    users = filter_docs(
        "Notification Settings",
        ["name", "enabled"],
        {"name": names}
    )
    if not users:
        return 0
    
    names = [v["name"] for v in users if cint(v["enabled"])]
    return names if names else 0
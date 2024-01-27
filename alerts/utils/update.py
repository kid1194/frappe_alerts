# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe import _
from frappe.utils import cint

from alerts import __production__

from .settings import settings


## [Hooks]
def auto_check_for_update():
    if __production__:
        doc = settings()
        if cint(doc.is_enabled) and cint(doc.auto_check_for_update):
            update_check(doc)


# [Alerts Settings Form]
@frappe.whitelist()
def check_for_update():
    if __production__:
        doc = settings()
        if cint(doc.is_enabled):
            return update_check(doc)
    
    return 0


# [Internal]
def update_check(doc):
    import re
    
    from frappe.utils import (
        get_request_session,
        cstr,
        now,
        markdown
    )
    
    from alerts import __version__
    
    from .common import doc_count, parse_json
    
    try:
        http = get_request_session()
        request = http.request(
            "GET",
            "https://api.github.com/repos/kid1194/frappe_alerts/releases/latest"
        )
        status_code = request.status_code
        data = request.json()
    except Exception:
        return 0
    
    if status_code != 200 and status_code != 201:
        return 0
    
    data = parse_json(data)
    
    if (
        not data or not isinstance(data, dict) or
        not getattr(data, "tag_name", "") or
        not getattr(data, "body", "")
    ):
        return 0
    
    latest_version = re.findall(r"(\d+(?:\.\d+)+)", cstr(data.get("tag_name")))
    if not latest_version:
        return 0
    
    latest_version = latest_version.pop()
    has_update = compare_versions(latest_version, __version__) > 0
    
    doc.latest_check = now()
    
    if has_update:
        doc.latest_version = latest_version
        doc.has_update = 1
    
    doc.save(ignore_permissions=True)
    
    if (
        has_update and
        cint(doc.send_update_notification) and
        doc_count("User", {
            "name": doc.update_notification_sender,
            "enabled": 1
        }) == 1
    ):
        enqueue_send_notification(
            latest_version,
            doc.update_notification_sender,
            [v.user for v in doc.update_notification_receivers],
            markdown(response.get("body"))
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
def enqueue_send_notification(version, sender, receivers, message):
    from .background import is_job_running, enqueue_job
    
    job_name = f"alerts-send-notification-{version}"
    if not is_job_running(job_name):
        enqueue_job(
            "alerts.utils.update.send_notification",
            job_name,
            version=version,
            sender=sender,
            receivers=receivers,
            message=message
        )


# [Internal]
def send_notification(version, sender, receivers, message):
    from frappe.desk.doctype.notification_settings.notification_settings import (
        is_notifications_enabled
    )
    
    from alerts import __module__
    
    from .settings import settings_dt
    
    receivers = filter_receivers(receivers);
    if not receivers:
        return 0
    
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
        if is_notifications_enabled(receiver):
            (frappe.new_doc("Notification Log")
                .update(doc)
                .update({"for_user": receiver})
                .insert(ignore_permissions=True, ignore_mandatory=True))


# [Internal]
def filter_receivers(names: list):
    dt = "User"
    data = frappe.get_all(
        dt,
        fields=["name"],
        filters=[
            [dt, "name", "in", list(set(names))],
            [dt, "enabled", "=", 1]
        ],
        pluck="name",
        strict=False
    )
    
    if (
        not data or
        not isinstance(data, list)
    ):
        return None
    
    data = [v for v in data if v in names]
    return data
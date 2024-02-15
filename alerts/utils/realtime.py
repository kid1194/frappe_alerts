# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


# [Internal]
def emit_event(event: str, data, after_commit=True):
    import frappe
    
    frappe.publish_realtime(
        event=event,
        message=data,
        after_commit=after_commit
    )


# [Alerts Settings]
def emit_app_status_changed(data, after_commit=True):
    emit_event("alerts_app_status_changed", data, after_commit)


# [Alert]
def emit_show_alerts(data, after_commit=True):
    emit_event("alerts_show", data, after_commit)


# [Alert]
def emit_show_alert(data, after_commit=True):
    emit_event("alerts_show_alert", data, after_commit)


# [Alert]
def emit_alert_seen(data, after_commit=True):
    emit_event("alerts_alert_seen", data, after_commit)
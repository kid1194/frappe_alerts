# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Alerts JS]
@frappe.whitelist()
def use_realtime():
    emit_event("alerts_use_realtime", {"status": 1})


# [Internal]
def emit_event(event: str, data):
    frappe.publish_realtime(event=event, message=data)


# [Alerts Settings]
def emit_app_status_changed(data):
    emit_event("alerts_app_status_changed", data)


# [Alerts Type]
def emit_type_changed(data):
    emit_event("alerts_type_changed", data)


# [Alert]
def emit_show_alert(data):
    emit_event("alerts_show_alert", data)


# [Alert]
def emit_alert_seen(data):
    emit_event("alerts_alert_seen", data)
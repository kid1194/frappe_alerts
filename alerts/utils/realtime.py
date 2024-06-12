# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Internal]
_CACHE_KEY_ = "realtime-events"


# [Internal]
def emit_event(event: str, data):
    from .system import use_fallback_sync
    
    if not use_fallback_sync():
        frappe.publish_realtime(event=event, message=data)
    elif event != "alerts_status_changed":
        events = frappe.cache().get_value(_CACHE_KEY_)
        if not events:
            events = {}
        events[event] = data
        frappe.cache().set_value(_CACHE_KEY_, events)


# [Alert, Internal]
def get_events():
    data = frappe.cache().get_value(_CACHE_KEY_)
    return data if data and isinstance(data, dict) else 0


# [A Alerts Settings]
def emit_status_changed(data):
    emit_event("alerts_status_changed", data)


# [A Alerts Type]
def emit_type_changed(data):
    emit_event("alerts_type_changed", data)


# [Alert]
def emit_show_alert(data):
    emit_event("alerts_show_alert", data)


# [Alert]
def emit_alert_seen(data):
    emit_event("alerts_alert_seen", data)
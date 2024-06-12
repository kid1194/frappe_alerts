# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Install, Update, Internal]
_SETTINGS_DT_ = "Alerts Settings"


# [Install, Migrate, Update, Internal]
def settings():
    from .cache import get_cached_doc
    
    return get_cached_doc(_SETTINGS_DT_)


# [Alert, Realtime]
def use_fallback_sync():
    return settings()._use_fallback_sync


# [Alerts JS, Alert]
@frappe.whitelist()
def get_settings():
    doc = settings()
    return {
        "is_enabled": 1 if doc._is_enabled else 0,
        "use_fallback_sync": 1 if doc._use_fallback_sync else 0,
        "fallback_sync_delay": doc._fallback_sync_delay
    }


# [A Alert, A Alert Type]
def check_app_status():
    if not settings()._is_enabled:
        from frappe import _
        
        from alerts import __module__
        
        from .common import error
        
        error(_("{0} app is disabled.").format(_(__module__)))
# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Install, Update, Internal]
def settings_dt():
    return "Alerts Settings"


# [Install, Update, Internal]
def settings(for_update=False):
    from .cache import get_cached_doc
    
    return get_cached_doc(settings_dt(), None, for_update)


# [Alerts JS]
@frappe.whitelist()
def is_enabled():
    from frappe.utils import cint
    
    from .alert import enqueue_alerts
    
    enqueue_alerts()
    return cint(settings().is_enabled) == 1
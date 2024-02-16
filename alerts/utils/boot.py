# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


# [Hooks]
def extend(bootinfo):
    import frappe
    
    user = frappe.session.user
    try:
        from .alert import enqueue_alerts
        
        enqueue_alerts(user)
    except Exception as exc:
        from frappe import _
        
        from .common import log_error
        
        log_error(str(exc))
        log_error(_(
            "An error has occurred while getting "
            + "cached alerts on boot of user \"{0}\"."
        ).format(user))

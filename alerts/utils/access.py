# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


# [Hooks]
def on_login(login_manager):
    try:
        from .alert import enqueue_alerts
        
        enqueue_alerts(login_manager.user)
    except Exception:
        from frappe import _
        
        from .common import log_error
        
        log_error(_(
            "An error has occurred while caching alerts on the login of user \"{0}\"."
        ).format(login_manager.user))
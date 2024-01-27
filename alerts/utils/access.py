# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


# [Hooks]
def on_login(login_manager):
    from frappe import _
    
    from .alert import cache_alerts
    from .common import log_error
    
    try:
        cache_alerts(login_manager.user)
    except Exception:
        log_error(_(
            "An error has occurred while caching alerts on login."
        ))
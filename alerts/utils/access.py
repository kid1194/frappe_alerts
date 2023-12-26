# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _

from .alert import cache_alerts
from .common import error


# [Hooks]
def on_login(login_manager):
    try:
        cache_alerts(login_manager.user)
    except Exception:
        error(_(
            "An error has occurred while caching alerts on login."
        ), True, False)
# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from .common import error
from .alert import cache_alerts


def on_login(login_manager):
    try:
        cache_alerts(login_manager.user)
    except Exception:
        error(_("An error has occurred while caching alerts on login."), False)
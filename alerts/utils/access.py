# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from .alert import (
    cache_alerts,
    clear_alerts_cache
)


def on_login(login_manager):
    cache_alerts(login_manager.user)


def on_logout(login_manager):
    clear_alerts_cache(login_manager.user)
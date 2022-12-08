# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from .common import error
from .alert import get_alerts_cache


def extend(bootinfo):
    try:
        bootinfo.alerts = get_alerts_cache(frappe.session.user)
    except Exception:
        error(_("An error has occurred while getting the cached alerts on boot."), False)

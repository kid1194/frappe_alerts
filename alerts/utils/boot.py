# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe import _

from .alert import get_alerts_cache
from .common import error


# [Hooks]
def extend(bootinfo):
    try:
        bootinfo.alerts = get_alerts_cache(frappe.session.user)
    except Exception:
        error(_(
            "An error has occurred while getting cached alerts on boot."
        ), True, False)

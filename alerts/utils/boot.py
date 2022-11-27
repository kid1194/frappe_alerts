# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from .alert import get_alerts_cache


def extend(bootinfo):
    bootinfo.alerts = get_alerts_cache(frappe.session.user)
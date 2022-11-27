# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _


def get_data():
    return [
        {
            "module_name": "Alerts",
            "color": "blue",
            "icon": "octicon octicon-bell",
            "type": "module",
            "label": _("Alerts")
        }
    ]
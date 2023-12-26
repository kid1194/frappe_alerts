# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _

from alerts import __module__


def get_data():
    return [
        {
            "module_name": __module__,
            "color": "blue",
            "icon": "octicon octicon-bell",
            "type": "module",
            "label": _(__module__)
        }
    ]
# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import __version__ as frappe_version


__version__ = "1.0.0"

__frappe_version__ = int(frappe_version.split(".")[0])
__frappe_version_min_14__ = __frappe_version__ > 13
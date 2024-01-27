# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import __version__


__frappe_version__ = int(__version__.split(".")[0])


# [Background, Hooks]
def is_version_gt(num: int):
    return __frappe_version__ > num


# [Common]
def is_version_lt(num: int):
    return __frappe_version__ < num


def is_version(num: int):
    return __frappe_version__ == num
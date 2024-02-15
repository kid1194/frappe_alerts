# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import json

import frappe

from alerts import __module__


# [Access, Alert, Boot]
def log_error(msg):
    from alerts.version import is_version_lt
    
    if is_version_lt(14):
        frappe.log_error(msg, __module__)
    else:
        frappe.log_error(__module__, msg)


# [Boot]
def error(msg, throw=True):
    if not throw:
        log_error(msg)
    else:
        frappe.throw(msg, title=__module__)


# [Alert, Alerts Settings]
def is_doc_exists(dt, name=None):
    if name is None:
        name = dt
    return frappe.db.exists(dt, name) != None


# [Alert Type, Alerts Settings, Update]
def doc_count(dt, filters: dict):
    return frappe.db.count(dt, filters)


# [Alert, Files, Query, Update]
def parse_json(data, default=None):
    if not isinstance(data, str):
        return data
    try:
        return json.loads(data)
    except Exception:
        return default


# [Cache]
def to_json(data, default=None):
    if isinstance(data, str):
        return data
    try:
        return json.dumps(data)
    except Exception:
        return default
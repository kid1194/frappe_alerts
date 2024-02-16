# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import json

import frappe

from alerts import __module__


# [Alert, Boot, Update]
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


# [Alert, Alerts Settings, Update]
def is_doc_exists(dt, name=None):
    params = {"doctype": dt}
    if name is None:
        params["name"] = dt
    elif isinstance(name, str):
        params["name"] = name
    elif isinstance(name, dict):
        params.update(name)
    return frappe.db.exists(params) != None


# [Alert Type, Alerts Settings]
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
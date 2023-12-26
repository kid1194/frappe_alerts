# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import json

import frappe

from alerts import __module__


# [Access, Boot]
def error(msg, log=False, throw=True):
    if not throw:
        log = True
    
    if log:
        frappe.log_error(__module__, msg)
    
    if throw:
        frappe.throw(msg, title=__module__)


# [Alert]
def is_doc_exists(dt, name=None):
    if name is None:
        name = dt
    
    return frappe.db.exists(dt, name)


# [Alert Type]
def doc_count(dt, filters: dict):
    return frappe.db.count(dt, filters)


# [Files, Query]
def parse_json(data, default=None):
    if not data or not isinstance(data, str):
        return default
    
    try:
        return json.loads(data)
    except Exception:
        return default
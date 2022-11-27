# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import json

import frappe
from frappe import _


def error(msg, throw=True):
    module = "Alerts"
    frappe.log_error(module, msg)
    if throw:
        frappe.throw(msg, title=module)


def get_cache(dt, key):
    return frappe.cache().hget(dt, key)


def set_cache(dt, key, data):
    frappe.cache().hset(dt, key, data)


def del_cache(dt, key):
    frappe.cache().hdel(dt, key)


def clear_cache(dt):
    frappe.cache().delete_key(dt)


def clear_document_cache(dt, name=None):
    if name is None:
        name = dt
    
    frappe.clear_cache(doctype=dt)
    frappe.clear_document_cache(dt, name)
    clear_cache(dt)


def get_cached_doc(dt, name=None, for_update=False):
    if name is None:
        name = dt
    elif isinstance(name, bool):
        for_update = name
        name = dt
    
    if for_update:
        clear_document_cache(dt)
    
    return frappe.get_cached_doc(dt, name, for_update=for_update)


def get_cached_value(dt, filters, field, as_dict=False):
    _as_dict = as_dict
    
    if isinstance(filters, str):
        if as_dict and isinstance(field, str):
            as_dict = False
        
        val = frappe.get_cached_value(dt, filters, field, as_dict=as_dict)
        if val and isinstance(val, list) and not isinstance(field, list):
            val = val.pop()
    else:
        val = frappe.db.get_value(dt, filters, field, as_dict=as_dict)
    
    if not val:
        error(_("Unable to get get the value or values of {0} from {1}, filtered by {2}").format(
            to_json_if_valid(field),
            dt,
            to_json_if_valid(
                filters.keys() if isinstance(filters, dict) else filters
            )
        ))
    
    if _as_dict and not isinstance(val, dict):
        if isinstance(field, list) and isinstance(val, list):
            val = frappe._dict(zip(field, val))
        elif isinstance(field, str):
            val = frappe._dict(zip([field], [val]))
    
    return val


def is_doc_exist(dt, name=None):
    if name is None:
        name = dt
    
    return frappe.db.exists(dt, name)


def parse_json_if_valid(data, default=None):
    if not data:
        return data
    
    if default is None:
        default = data
    
    try:
        return json.loads(data)
    except Exception:
        return default


def to_json_if_valid(data, default=None):
    if not data:
        return data
    
    if default is None:
        default = data
    
    try:
        return json.dumps(data)
    except Exception:
        return default
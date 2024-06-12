# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import json

import frappe


# [Alert, Update]
def log_error(msg):
    from alerts import __module__
    
    from alerts.version import is_version_lt
    
    if is_version_lt(14):
        frappe.log_error(msg, __module__)
    else:
        frappe.log_error(__module__, msg)


# [A Alert, A Type, A Settings]
def error(text: str|list, title: str= None):
    as_list = True if isinstance(text, list) else False
    if not title:
        from frappe import _
        
        from alerts import __module__
        
        title = _(__module__)
    
    frappe.throw(text, title=title, as_list=as_list)


# [Update]
def is_doc_exists(dt, name=None):
    params = {"doctype": dt}
    if name is None:
        params["name"] = dt
    elif isinstance(name, str):
        params["name"] = name
    elif isinstance(name, dict):
        params.update(name)
    return not (frappe.db.exists(params) is None)


# [Alert]
def doc_count(dt, filters: dict):
    return frappe.db.count(dt, filters)


# [Update]
def filter_docs(dt, fields: (str | list)=None, filters: dict=None):
    if not fields:
        fields = ["name"]
    elif isinstance(fields, list):
        if len(fields) > 1:
            pluck = None
        else:
            pluck = fields[0]
    else:
        pluck = fields
    
    _filters = []
    if filters:
        for k in filters:
            if isinstance(filters[k], list):
                if len(filters[k]) > 1 and isinstance(filters[k][1], list):
                    _filters.append([dt, k, filters[k][0], filters[k][1]])
                else:
                    _filters.append([dt, k, "in", filters[k]])
            else:
                _filters.append([dt, k, "=", filters[k]])
    
    data = frappe.get_all(
        dt,
        fields=fields,
        filters=_filters,
        pluck=pluck,
        ignore_permissions=True,
        strict=False
    )
    
    if not isinstance(data, list):
        return None
    
    return data


# [Background]
def to_json(data, default=None):
    if (
        data and isinstance(data, str) and (
            (data.startswith("{") and data.endswith("}")) or
            (data.startswith("[") and data.endswith("]"))
        )
    ):
        return data
    try:
        return json.dumps(data)
    except Exception:
        return default


# [Alert, Query, Update]
def parse_json(data, default=None):
    if not isinstance(data, str):
        return data
    try:
        return json.loads(data)
    except Exception:
        return default
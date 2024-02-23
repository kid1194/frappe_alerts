# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Alert, Type]
def get_cache(dt, key, expires: bool=False):
    return frappe.cache().get_value(f"{dt}-{key}", expires=expires)


# [Alert, Type]
def set_cache(dt, key, data, expiry: int=0):
    if expiry < 1:
        frappe.cache().set_value(f"{dt}-{key}", data)
    else:
        frappe.cache().set_value(f"{dt}-{key}", data, expires_in_sec=expiry)


# [Internal]
def del_cache(dt, key=None):
    if key:
        frappe.cache().delete_key(f"{dt}-{key}")
    else:
        frappe.cache().delete_keys(dt)


# [Alerts Alert, Alert Type, Alert, Internal]
def clear_doc_cache(dt, name=None):
    del_cache(dt)
    frappe.clear_cache(doctype=dt)
    if name is None:
        name = dt
    frappe.clear_document_cache(dt, name)


# [Alert, Settings, Type]
def get_cached_doc(dt, name=None, for_update=False):
    if isinstance(name, bool):
        for_update = name
        name = None
    
    if name is None:
        name = dt
    
    if dt != name and not frappe.db.exists(dt, name):
        return None
    
    if for_update:
        clear_doc_cache(dt, name)
    
    return frappe.get_cached_doc(dt, name, for_update=for_update)
# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Alert, Type]
def get_cache(dt, key, expires: bool=False):
    return frappe.cache().get_value(f"{dt}-{key}", expires=expires)


# [Alert, Type]
def set_cache(dt, key, data, expiry: int=None):
    frappe.cache().set_value(f"{dt}-{key}", data, expires_in_sec=expiry)


# [Alert]
def del_cache(dt, key):
    frappe.cache().delete_key(f"{dt}-{key}")


# [A Alert, A Alerts Settings, A Type, Alert]
def clear_doc_cache(dt, name=None):
    frappe.cache().delete_keys(dt)
    frappe.clear_cache(doctype=dt)
    frappe.clear_document_cache(dt, name or dt)


# [Alert, Settings, Type]
def get_cached_doc(dt: str, name: str=None):
    if name is None:
        name = dt
    
    if dt != name and not frappe.db.exists(dt, name):
        return None
    
    return frappe.get_cached_doc(dt, name)
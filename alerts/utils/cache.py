# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Internal]
def clear_cache(dt):
    frappe.cache().delete_key(dt)


# [Alert Type, Internal]
def clear_doc_cache(dt, name=None):
    if name is None:
        name = dt
    
    frappe.clear_cache(doctype=dt)
    frappe.clear_document_cache(dt, name)
    clear_cache(dt)


# [Alert, Settings, Type]
def get_cached_doc(dt, name=None, for_update=False):
    if isinstance(name, bool):
        for_update = name
        name = None
    
    if name is None:
        name = dt
    
    if for_update:
        clear_doc_cache(dt, name)
    
    if dt != name and not frappe.db.exists(dt, name):
        return None
    
    return frappe.get_cached_doc(dt, name, for_update=for_update)


# [Alert]
def get_tmp_cache(key):
    return frappe.cache().get_value(key, expires=True)


# [Alert]
def set_tmp_cache(key, data, expiry):
    frappe.cache().set_value(key, data, expires_in_sec=expiry)
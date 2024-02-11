# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Alert]
def get_cache(dt, key):
    return frappe.cache().hget(dt, key)


# [Alert]
def set_cache(dt, key, data):
    frappe.cache().hset(dt, key, data)


# [Alert]
def del_cache(dt, key):
    frappe.cache().hdel(dt, key)
    clear_cache(f"{dt}-{key}")


# [Internal]
def clear_cache(dt):
    frappe.cache().delete_keys(dt)
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
    
    if dt != name and not frappe.db.exists(dt, name):
        return None
    
    if for_update:
        clear_doc_cache(dt, name)
    
    return frappe.get_cached_doc(dt, name, for_update=for_update)
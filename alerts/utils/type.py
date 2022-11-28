# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe

from .common import is_doc_exist, get_cached_doc


_DT_ = "Alert Type"


def get_type_title(name):
    if is_doc_exist(_DT_, name):
        return get_cached_doc(_DT_, name).title
    else:
        return ""


def get_types(types):
    doc = frappe.qb.DocType(_DT_)
    data = (
        frappe.qb.from_(doc)
        .select(
            doc.name,
            doc.display_timeout,
            doc.display_sound,
            doc.custom_display_sound,
            doc.background,
            doc.border_color,
            doc.title_color,
            doc.content_color
        )
        .where(doc.name.isin(types))
    ).run(as_dict=True)
    
    result = {}
    if data and isinstance(data, list):
        for v in data:
            result[v["name"]] = v
    
    return result


def add_type(data):
    try:
        (frappe.new_doc(_DT_)
            .update(data)
            .insert(ignore_permissions=True, ignore_if_duplicate=True))
    except Exception:
        pass
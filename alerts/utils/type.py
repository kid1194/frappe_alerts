# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe

from pypika.enums import Order

from .common import is_doc_exist, get_cached_doc


_DT_ = "Alert Type"


def get_type_title(name):
    if is_doc_exist(_DT_, name):
        return get_cached_doc(_DT_, name).title
    else:
        return ""


def join_type_to_query(qry, join_column):
    doc = frappe.qb.DocType(_DT_)
    qry = (
        qry.select(
            doc.display_priority,
            doc.display_timeout,
            doc.display_sound,
            doc.custom_display_sound,
            doc.background,
            doc.border_color,
            doc.title_color,
            doc.content_color
        )
        .inner_join(doc)
        .on(doc.name == join_column)
        .where(doc.disabled == 0)
        .orderby(doc.display_priority, order=Order.desc)
    )
    return qry


def get_type(name):
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
        .where(doc.name == type)
        .limit(1)
    ).run(as_dict=True)
    
    if not data or not isinstance(data, list):
        data = []
    
    if data:
        data = data[0]
    
    return data


def add_type(data):
    try:
        (frappe.new_doc(_DT_)
            .update(data)
            .insert(ignore_permissions=True, ignore_if_duplicate=True))
    except Exception:
        pass
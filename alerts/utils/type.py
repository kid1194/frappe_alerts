# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Internal]
_type_dt_ = "Alert Type"


# [Alert, Internal]
def get_type(name: str):
    from .common import get_cached_doc
    
    return get_cached_doc(_type_dt_, name)


# [Alert]
def type_join_query(qry, join_column):
    from pypika.enums import Order
    
    doc = frappe.qb.DocType(_type_dt_)
    return (
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


# [Install]
def add_type(data: dict):
    try:
        (frappe.new_doc(_type_dt_)
            .update(data)
            .insert(ignore_permissions=True, ignore_if_duplicate=True))
    except Exception:
        pass
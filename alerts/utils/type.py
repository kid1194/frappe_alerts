# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import cstr

from pypika.enums import Order

from .common import (
    is_doc_exist,
    get_cached_doc
)


# [Internal]
_TYPE_ = "Alert Type"


# [Alert, Internal]
def get_type(name):
   return get_cached_doc(_TYPE_, name)


# [Alert]
def type_join_query(qry, join_column):
    doc = frappe.qb.DocType(_TYPE_)
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


# [Install]
def add_type(data):
    try:
        (frappe.new_doc(_TYPE_)
            .update(data)
            .insert(ignore_permissions=True, ignore_if_duplicate=True))
    except Exception:
        pass
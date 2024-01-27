# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Query]
def filter_search(doc, qry, doctype, search, relevance, filter_column=None):
    from pypika.enums import Order
    from pypika.terms import Criterion
    
    from frappe.query_builder.functions import Locate
    
    meta = frappe.get_meta(doctype)
    if txt:
        qry = qry.select(Locate(search, relevance).as_("_relevance"))
        qry = qry.orderby("_relevance", doc.modified, doc.idx, order=Order.desc)
        
        translated_doctypes = get_translated_doctypes()
        filters = []
        fields = [filter_column] if filter_column else []
        
        if meta.title_field:
            fields.append(meta.title_field)
        if meta.search_fields:
            fields.extend(meta.get_search_fields())
        
        field_types = [
            "Data",
            "Text",
            "Small Text",
            "Long Text",
            "Link",
            "Select",
            "Read Only",
            "Text Editor"
        ]
        
        for f in fields:
            fmeta = meta.get_field(f.strip())
            if (
                doctype not in translated_doctypes and
                (
                    f == "name" or
                    (fmeta and fmeta.fieldtype in field_types)
                )
            ):
                filters.append(doc.field(f.strip()).like("%" + search + "%"))
        
        if len(filters) > 1:
            qry = qry.where(Criterion.any(filters))
        else:
            qry = qry.where(filters.pop(0))
    
    if meta.get("fields", {"fieldname": "enabled", "fieldtype": "Check"}):
        qry = qry.where(doc.enabled == 1)
    if meta.get("fields", {"fieldname": "disabled", "fieldtype": "Check"}):
        qry = qry.where(doc.disabled != 1)
    
    return qry


# [Query]
def prepare_data(data, dt, column, txt, as_dict):
    from frappe import _
    from frappe.utils import cstr
    
    if txt and dt in get_translated_doctypes():
        import re
        
        data = [
            v
            for v in data
            if re.search(
                re.escape(txt) + ".*",
                _(v.get(column) if as_dict else v[0]),
                re.IGNORECASE
            )
        ]
    
    args = [txt, as_dict]
    def relevance_sorter(key):
        value = _(key.name if args[1] else key[0])
        return (cstr(value).lower().startswith(args[0].lower()) is not True, value)
    
    data = sorted(data, key=relevance_sorter)
    
    if as_dict:
        for r in data:
            r.pop("_relevance")
    else:
        data = [r[:-1] for r in data]
    
    return data


# [Internal]
def get_translated_doctypes():
    return frappe.get_hooks("translated_search_doctypes")
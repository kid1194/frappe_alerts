# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe

from .common import parse_json_if_valid
from .search import filter_search, prepare_data


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def search_users(doctype, txt, searchfield, start, page_len, filters, as_dict=False):
    dt = "User"
    doc = frappe.qb.DocType(dt)
    rdoc = frappe.qb.DocType("Role")
    hdoc = frappe.qb.DocType("Has Role")
    
    rqry = (
        frappe.qb.from_(rdoc)
        .select(rdoc.name)
        .where(rdoc.desk_access == 1)
        .where(rdoc.disabled == 0)
    )
    
    hqry = (
        frappe.qb.from_(hdoc)
        .select(hdoc.parent)
        .distinct()
        .where(hdoc.parenttype == dt)
        .where(hdoc.parentfield == "roles")
        .where(hdoc.role.isin(rqry))
    )
    
    qry = (
        frappe.qb.from_(doc)
        .select(doc.name)
        .where(doc.name.isin(hqry))
        .where(doc.enabled == 1)
    )
    
    qry = filter_search(doc, qry, dt, txt, doc.name, "name")
    
    if (existing := filters.get("existing")):
        if isinstance(existing, str):
            existing = parse_json_if_valid(existing)
        if existing and isinstance(existing, list):
            qry = qry.where(doc.name.notin(existing))
    
    data = qry.run(as_dict=as_dict)
    
    data = prepare_data(data, dt, "name", txt, as_dict)
    
    return data
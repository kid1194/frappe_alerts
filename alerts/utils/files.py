# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe

from .common import parse_json


# [Alert Type]
def delete_files(doctype, name, files):
    if not files:
        return 0
    
    files = parse_json(files, files)
    
    if not files or not isinstance(files, list):
        return 0
    
    dt = "File"
    if (data := frappe.get_all(
        dt,
        fields=["name", "attached_to_name"],
        filters=[
            ["file_url", "in", files],
            ["attached_to_doctype", "=", doctype]
        ]
    )):
        if not isinstance(name, list):
            name = [name]
        
        for v in data:
            if not v["attached_to_name"] or v["attached_to_name"] in name:
                frappe.get_doc(dt, v["name"]).delete(ignore_permissions=True)
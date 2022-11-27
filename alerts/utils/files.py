# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe

from .common import parse_json_if_valid


def delete_files(doctype, name, files):
    if not files:
        return 0
    
    files = parse_json_if_valid(files)
    
    if not files or not isinstance(files, list):
        return 0
    
    dt = "File"
    if (file_names := frappe.get_all(
        dt,
        fields=["name"],
        filters=[
            ["file_url", "in", files],
            ["attached_to_doctype", "=", doctype],
            ["ifnull(`attached_to_name`,\"\")", "in", [name, ""]]
        ],
        pluck="name"
    )):
        for file in file_names:
            frappe.get_doc(dt, file).delete(ignore_permissions=True)
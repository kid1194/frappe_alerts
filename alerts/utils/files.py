# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Alert Type]
def delete_files(doctype, name, files):
    if not files:
        return 0
    
    if files and isinstance(files, str):
        from .common import parse_json
        
        files = parse_json(files)
    
    if not files or not isinstance(files, list):
        return 0
    
    from .background import enqueue_job
    
    enqueue_job(
        "alerts.utils.files.files_delete",
        f"{doctype}-files-delete-{name}",
        queue="long",
        doctype=doctype,
        name=name,
        files=files
    )


# [Internal]
def files_delete(doctype, name, files):
    dt = "File"
    data = frappe.get_all(
        dt,
        fields=["name", "attached_to_name"],
        filters=[
            [dt, "file_url", "in", files],
            [dt, "attached_to_doctype", "=", doctype]
        ]
    )
    if data and isinstance(data, list):
        if not isinstance(name, list):
            name = [name]
        
        for v in data:
            if (
                not v["attached_to_name"] or
                v["attached_to_name"] in name
            ):
                (frappe.get_doc(dt, v["name"])
                    .delete(ignore_permissions=True))
# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [A Alert Type]
def is_sound_file(data: str):
    import re
    
    return True if re.match("\.(mp3|wav|ogg)$", data, re.IGNORECASE) else False


# [A Alert Type]
def delete_files(doctype, name, files):
    from .background import uuid_key, is_job_running
    
    if isinstance(name, list):
        name = list(set(name))
    else:
        name = [name]
    
    if isinstance(files, list):
        files = list(set(files))
    else:
        files = [files]
    
    job_id = uuid_key([name, files])
    job_id = f"{doctype}-files-delete-{job_id}"
    if not is_job_running(job_id):
        from .background import enqueue_job
        
        enqueue_job(
            "alerts.utils.files.files_delete",
            job_id,
            timeout=len(files) * 200,
            doctype=doctype,
            names=name,
            files=files
        )


# [Internal]
def files_delete(doctype, names, files):
    dt = "File"
    data = frappe.get_all(
        dt,
        fields=["name", "attached_to_name"],
        filters=[
            [dt, "file_url", "in", files],
            [dt, "attached_to_doctype", "=", doctype]
        ],
        ignore_permissions=True,
        strict=False
    )
    if not data or not isinstance(data, list):
        return 0
    
    for v in data:
        if (
            not v["attached_to_name"] or
            v["attached_to_name"] in names
        ):
            frappe.get_doc(dt, v["name"]).delete(ignore_permissions=True)
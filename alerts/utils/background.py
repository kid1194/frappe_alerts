# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe

from alerts.version import is_version_gt


# [Update]
def is_job_running(name: str):
    if is_version_gt(14):
        from frappe.utils.background_jobs import is_job_enqueued
        
        return is_job_enqueued(name)
    
    else:
        from frappe.core.page.background_jobs.background_jobs import get_info
        
        jobs = [d.get("job_name") for d in get_info("Jobs", job_status="active")]
        return True if name in jobs else False


## [Alert, Files, Update]
def enqueue_job(method: str, job_name: str, **kwargs):
    if is_version_gt(14):
        frappe.enqueue(
            method,
            job_id=job_name,
            is_async=True,
            **kwargs
        )
    
    else:
        frappe.enqueue(
            method,
            job_name=job_name,
            is_async=True,
            **kwargs
        )
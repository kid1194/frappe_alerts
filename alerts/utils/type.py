# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Internal]
_TYPE_DT_ = "Alert Type"


# [Access]
def enqueue_types():
    from .background import is_job_running
    
    job_id = "alert-type-cache"
    if not is_job_running(job_id):
        from .background import enqueue_job
        
        enqueue_job(
            "alerts.utils.type.get_types",
            job_id
        )


# [Alert, Internal]
def get_types():
    from .cache import get_cache
    
    dt = "Alert Type"
    key = "enabled-types"
    data = get_cache(dt, key)
    if isinstance(data, dict):
        return data
    
    data = frappe.get_all(
        dt,
        fields=[
            "name",
            "display_priority",
            "display_timeout",
            "display_sound",
            "custom_display_sound",
            "background",
            "border_color",
            "title_color",
            "content_color",
            "dark_background",
            "dark_border_color",
            "dark_title_color",
            "dark_content_color"
        ],
        filters=[[dt, "disabled", "=", 0]],
        ignore_permissions=True,
        strict=False
    )
    if not isinstance(data, list):
        data = {}
    elif data:
        data = {v["name"]:v for v in data}
    
    from .cache import set_cache
    
    set_cache(dt, key, data)
    return data


# [Alert]
def is_enabled_type(name: str):
    data = get_types()
    return 1 if data and name in data else 0


# [Alert]
def type_join_query(qry, join_column):
    from pypika.enums import Order
    
    doc = frappe.qb.DocType(_TYPE_DT_)
    return (
        qry.inner_join(doc)
        .on(doc.name == join_column)
        .where(doc.disabled == 0)
        .orderby(doc.display_priority, order=Order.desc)
    )


# [Install]
def add_type(data: dict):
    try:
        (frappe.new_doc(_TYPE_DT_)
            .update(data)
            .insert(ignore_permissions=True, ignore_if_duplicate=True))
    except Exception:
        pass
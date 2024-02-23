# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Internal]
_type_dt_ = "Alert Type")


# [Access]
def enqueue_types():
    from .cache import get_cache
    
    cache = get_cache(_type_dt_, "all")
    if not cache or not isinstance(cache, list):
        from .background import is_job_running, enqueue_job
        
        job_name = "cache-all-types"
        if not is_job_running(job_name):
            enqueue_job(
                "alerts.utils.type.get_all_types",
                job_name
            )


# [Alert]
def get_types():
    from .cache import get_cache
    
    data = get_cache(_type_dt_, "all")
    if not data or not isinstance(data, list):
        data = get_all_types()
    
    if not data or not isinstance(data, list):
        data = []
    
    return data


# [Alert]
def add_type_data(name: str, data: dict):
    from .cache import get_cached_doc
    
    doc = get_cached_doc(_type_dt_, name)
    if doc:
        from frappe.utils import cint, cstr
        
        data.update({
            "display_priority": cint(doc.display_priority),
            "display_timeout": cint(doc.display_timeout),
            "display_sound": cstr(doc.display_sound),
            "custom_display_sound": cstr(doc.custom_display_sound),
            "background": cstr(doc.background),
            "border_color": cstr(doc.border_color),
            "title_color": cstr(doc.title_color),
            "content_color": cstr(doc.content_color),
            "dark_background": cstr(doc.dark_background),
            "dark_border_color": cstr(doc.dark_border_color),
            "dark_title_color": cstr(doc.dark_title_color),
            "dark_content_color": cstr(doc.dark_content_color)
        })


# [Alert]
def type_join_query(qry, join_column):
    from pypika.enums import Order
    
    doc = frappe.qb.DocType(_type_dt_)
    return (
        qry.select(
            doc.display_priority._as("priority"),
            doc.display_timeout,
            doc.display_sound,
            doc.custom_display_sound
        )
        .inner_join(doc)
        .on(doc.name == join_column)
        .where(doc.disabled == 0)
        .orderby(doc.display_priority, order=Order.desc)
    )


# [Internal]
def get_all_types():
    data = frappe.get_all(
        _type_dt_,
        fields=[
            "name",
            "background",
            "border_color",
            "title_color",
            "content_color",
            "dark_background",
            "dark_border_color",
            "dark_title_color",
            "dark_content_color"
        ],
        filters=[[_type_dt_, "disabled", "=", 0]],
        ignore_permissions=True,
        strict=False
    )
    if data and isinstance(data, list):
        from .cache import set_cache
        
        set_cache(_type_dt_, "all", data)
    
    return data


# [Install]
def add_type(data: dict):
    try:
        (frappe.new_doc(_type_dt_)
            .update(data)
            .insert(ignore_permissions=True, ignore_if_duplicate=True))
    except Exception:
        pass
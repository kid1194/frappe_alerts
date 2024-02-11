# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import cint, nowdate


# [Internal]
_alert_dt_ = "Alert"


# [Alert Type]
def type_alerts_exists(alert_type):
    from .common import is_doc_exists
    
    return is_doc_exists(_alert_dt_, {"alert_type": alert_type})


# [Hooks]
def update_alerts():
    today = nowdate()
    doc = frappe.qb.DocType(_alert_dt_)
    (
        frappe.qb.update(doc)
        .set(doc.status, "Finished")
        .where(doc.until_date.lt(today))
        .where(doc.status == "Active")
        .where(doc.docstatus == 1)
    ).run()
    (
        frappe.qb.update(doc)
        .set(doc.status, "Active")
        .where(doc.from_date.lte(today))
        .where(doc.until_date.gte(today))
        .where(doc.status == "Pending")
        .where(doc.docstatus == 1)
    ).run()


# [Alerts Js]
@frappe.whitelist()
def get_user_alerts_list():
    return get_user_alerts(frappe.session.user)


# [Internal]
def get_user_alerts(user: str):
    from pypika.functions import IfNull
    from pypika.terms import Criterion
    
    from frappe.query_builder.functions import Count
    
    from .type import type_join_query
    
    today = nowdate()
    doc = frappe.qb.DocType(_alert_dt_)
    udoc = frappe.qb.DocType("Alert For User")
    rdoc = frappe.qb.DocType("Alert For Role")
    sdoc = frappe.qb.DocType("Alert Seen By")
    
    uqry = (
        frappe.qb.from_(udoc)
        .select(udoc.parent)
        .distinct()
        .where(sdoc.parent == doc.name)
        .where(udoc.parenttype == _alert_dt_)
        .where(udoc.parentfield == "for_users")
        .where(udoc.user == user)
    )
    rqry = (
        frappe.qb.from_(rdoc)
        .select(rdoc.parent)
        .distinct()
        .where(rdoc.parent == doc.name)
        .where(rdoc.parenttype == _alert_dt_)
        .where(rdoc.parentfield == "for_roles")
        .where(rdoc.role.isin(frappe.get_roles(user)))
    )
    sqry = (
        frappe.qb.from_(sdoc)
        .select(sdoc.parent)
        .where(sdoc.parent == doc.name)
        .where(sdoc.parenttype == _alert_dt_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .where(sdoc.date == today)
    )
    cqry = (
        frappe.qb.from_(sdoc)
        .select(Count(sdoc.parent))
        .where(sdoc.parent == doc.name)
        .where(sdoc.parenttype == _alert_dt_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .limit(1)
    )
    qry = (
        frappe.qb.from_(doc)
        .select(
            doc.name,
            doc.title,
            doc.alert_type,
            doc.message,
            doc.is_repeatable
        )
        .where(doc.status == "Active")
        .where(doc.from_date.lte(today))
        .where(doc.until_date.gte(today))
        .where(doc.docstatus == 1)
        .where(Criterion.any([
            doc.name.isin(uqry),
            doc.name.isin(rqry)
        ]))
        .where(doc.name.notin(sqry))
        .where(Criterion.any([
            doc.is_repeatable == 0,
            doc.number_of_repeats.gt(IfNull(cqry, 0))
        ]))
    )
    qry = type_join_query(qry, doc.alert_type)
    data = qry.run(as_dict=True)
    return data if isinstance(data, list) else None


# [Access]
def cache_alerts(user: str):
    data = get_user_alerts(user)
    if not (data is None):
        set_cached_alerts(user, data)


# [Boot]
def get_alerts_cache(user):
    cache = get_cached_alerts(user)
    if not (cache is None):
        clear_cached_alerts(user)
    else:
        from .background import enqueue_job
        
        cache = []
        enqueue_job(
            "alerts.utils.alert.delayed_show_alerts",
            f"delayed-show-alerts-for-{user}",
            user=user
        )
    
    return cache


# [Internal]
def delayed_show_alerts(user: str):
    data = get_user_alerts(user)
    if data:
        frappe.publish_realtime(
            event="alerts_show",
            message=data,
            after_commit=True
        )


# [Alerts Alert]
def send_alert(doc):
    from .type import get_type
    
    user = frappe.session.user
    data = frappe._dict({
        "name": doc.name,
        "title": doc.title,
        "alert_type": doc.alert_type,
        "message": doc.message,
        "is_repeatable": cint(doc.is_repeatable)
    })
    
    if is_valid_user(doc, user):
        cache_alert(user, data)
    
    data.type = get_type(doc.alert_type)
    data.number_of_repeats = cint(doc.number_of_repeats)
    data.users = [v.user for v in doc.for_users]
    data.roles = [v.role for v in doc.for_roles]
    data.seen_by = {}
    data.seen_today = []
    
    if doc.seen_by:
        today = nowdate()
        for v in doc.seen_by:
            if v.user not in data.seen_by:
                data.seen_by[v.user] = 1
            else:
                data.seen_by[v.user] += 1
            if v.user not in data.seen_today and v.date == today:
                data.seen_today.append(v.user)
    
    frappe.publish_realtime(
        event="alerts_show",
        message=data,
        after_commit=True
    )


# [Alerts Js]
@frappe.whitelist(methods=["POST"])
def mark_seens(names):
    if not names or not isinstance(names, list):
        return {"error": "Invalid arguments"}
    
    user = frappe.session.user
    ret = {"success": 1}
    unseen = []
    for v in names:
        if v and isinstance(v, str):
            ret = mark_as_seen(v, user)
            if not st:
                unseen.append(v)
    
    if unseen:
        ret["unseen"] = unseen
    
    return ret


# [Internal]
def mark_as_seen(name: str, user: str):
    from .cache import get_cached_doc
    
    doc = get_cached_doc(_alert_dt_, name)
    if not doc or cint(doc.docstatus) != 1:
        return 0
    
    if not is_valid_user(doc, user):
        return 1
    
    from frappe.utils import nowtime
    
    doc.append("seen_by", {
        "user": user,
        "date": nowdate(),
        "time": nowtime()
    })
    seen = [v.user for v in doc.seen_by]
    doc.reached = len(list(set(seen)))
    doc.save(ignore_permissions=True)
    
    pop_cached_alert(user, name)
    
    frappe.publish_realtime(
        event="alerts_refresh_seen_by",
        message={"alert": doc.name},
        after_commit=True
    )
    
    return 1


# [Internal]
def get_cached_alerts(user: str):
    from .cache import get_cache
    
    cache = get_cache(_alert_dt_, user)
    return cache if isinstance(cache, list) else None


# [Internal]
def set_cached_alerts(user: str, data: list):
    from .cache import set_cache
    
    set_cache(_alert_dt_, user, data)


# [Internal]
def clear_cached_alerts(user: str):
    from .cache import del_cache
    
    del_cache(_alert_dt_, user)


# [Internal]
def cache_alert(user: str, data):
    cache = get_cached_alerts(user)
    if cache is None:
        cache = []
    if isinstance(data, list):
        cache.extend(data)
    else:
        cache.append(data)
    set_cached_alerts(user, cache)


# [Internal]
def pop_cached_alert(user: str, name: str):
    cache = get_cached_alerts(user)
    if cache:
        for i,v in enumerate(cache):
            if v["name"] == name:
                cache.pop(i)
                break
        set_cached_alerts(user, cache)


# [Internal]
def is_valid_user(doc, user):
    valid = 0
    if doc.for_users:
        for v in doc.for_users:
            if v.user == user:
                valid = 1
                break
    
    if not valid and doc.for_roles:
        from frappe.utils import has_common
        
        roles = [v.role for v in doc.for_roles]
        if has_common(roles, frappe.get_roles(user)):
            valid = 1
    
    if not valid:
        return False
    
    seen = 0
    if doc.seen_by:
        today = nowdate()
        for v in doc.seen_by:
            if v.user == user:
                seen += 1
                if v.date == today:
                    return False
    
    if not cint(doc.is_repeatable):
        return seen < 1
    
    return cint(doc.number_of_repeats) > seen
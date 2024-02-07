# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import cint, nowdate

from .common import is_doc_exists


# [Internal]
_alert_dt_ = "Alert"


# [Alert Type]
def type_alerts_exists(alert_type):
    return is_doc_exists(_alert_dt_, {"alert_type": alert_type})


# [Hooks]
def update_alerts():
    today = nowdate()
    doc = frappe.qb.DocType(_alert_dt_)
    (
        frappe.qb.update(doc)
        .set(doc.status, "Finished")
        .where(doc.from_date.lt(today))
        .where(doc.until_date.lte(today))
        .where(doc.status == "Active")
        .where(doc.docstatus == 1)
    ).run()
    (
        frappe.qb.update(doc)
        .set(doc.status, "Active")
        .where(doc.from_date.lte(today))
        .where(doc.until_date.gt(today))
        .where(doc.status == "Pending")
        .where(doc.docstatus == 1)
    ).run()


# [Access]
def cache_alerts(user: str):
    from pypika.functions import IfNull
    from pypika.terms import Criterion
    
    from frappe.query_builder.functions import Count
    
    from .cache import set_tmp_cache
    from .type import type_join_query
    
    doc = frappe.qb.DocType(_alert_dt_)
    udoc = frappe.qb.DocType("Alert For User")
    rdoc = frappe.qb.DocType("Alert For Role")
    sdoc = frappe.qb.DocType("Alert Seen By")
    
    uqry = (
        frappe.qb.from_(udoc)
        .select(udoc.parent)
        .distinct()
        .where(udoc.parenttype == _alert_dt_)
        .where(udoc.parentfield == "for_users")
        .where(udoc.user == user)
    )
    
    rqry = (
        frappe.qb.from_(rdoc)
        .select(rdoc.parent)
        .distinct()
        .where(rdoc.parenttype == _alert_dt_)
        .where(rdoc.parentfield == "for_roles")
        .where(rdoc.role.isin(frappe.get_roles(user)))
    )
    
    scqry = (
        frappe.qb.from_(sdoc)
        .select(Count(sdoc.parent))
        .where(sdoc.parent == doc.name)
        .where(sdoc.parenttype == _alert_dt_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .limit(1)
    )
    
    stqry = (
        frappe.qb.from_(sdoc)
        .select(sdoc.parent)
        .where(sdoc.parent == doc.name)
        .where(sdoc.parenttype == _alert_dt_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .where(sdoc.date == nowdate())
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
        .where(doc.docstatus == 1)
        .where(Criterion.any([
            Criterion.all([
                IfNull(uqry, "") != "",
                doc.name.isin(uqry)
            ]),
            Criterion.all([
                IfNull(rqry, "") != "",
                doc.name.isin(rqry)
            ])
        ]))
        .where(Criterion.any([
            IfNull(stqry, "") == "",
            doc.name.notin(stqry)
        ]))
        .where(Criterion.any([
            Criterion.all([
                doc.is_repeatable != 1,
                IfNull(scqry, 0) == 0
            ]),
            Criterion.all([
                doc.is_repeatable == 1,
                doc.number_of_repeats > 0,
                doc.number_of_repeats.gt(IfNull(scqry, 0))
            ])
        ]))
    )
    qry = type_join_query(qry, doc.alert_type)
    
    data = qry.run(as_dict=True)
    
    if data and isinstance(data, list):
        set_tmp_cache(f"alerts-for-{user}", data, 180)


# [Boot]
def get_alerts_cache(user):
    from .cache import get_tmp_cache
    
    cache = get_tmp_cache(f"alerts-for-{user}")
    if not cache or not isinstance(cache, list):
        cache = []
    
    return cache


# [Alerts Alert]
def send_alert(doc):
    from .type import get_type
    
    seen_by = {}
    seen_today = []
    
    if doc.seen_by:
        today = nowdate()
        for v in doc.seen_by:
            if v.user not in seen_by:
                seen_by[v.user] = 0
            
            seen_by[v.user] += 1
            
            if v.user not in seen_today and v.date == today:
                seen_today.append(v.user)
    
    frappe.publish_realtime(
        event="alerts_show",
        message={
            "name": doc.name,
            "alert_type": doc.alert_type,
            "type": get_type(doc.alert_type),
            "title": doc.title,
            "message": doc.message,
            "is_repeatable": cint(doc.is_repeatable),
            "number_of_repeats": cint(doc.number_of_repeats),
            "users": [v.user for v in doc.for_users],
            "roles": [v.role for v in doc.for_roles],
            "seen_by": seen_by,
            "seen_today": seen_today
        },
        after_commit=True
    )


# [Alerts Js]
@frappe.whitelist(methods=["POST"])
def mark_seens(names):
    if not names or not isinstance(names, list):
        return 0
    
    alerts = []
    for v in names:
        if v and isinstance(v, str):
            alerts.append(v)
    
    from .background import enqueue_job
    
    for alert in alerts:
        enqueue_job(
            "alerts.utils.alert.mark_as_seen",
            f"alert-mark-as-seen-{alert}",
            name=alert
        )
    
    return 1


# [Internal]
def mark_as_seen(name: str):
    if not is_doc_exists(_alert_dt_, name):
        return 0
    
    from .cache import get_cached_doc
    
    doc = get_cached_doc(_alert_dt_, name)
    if not doc or cint(doc.docstatus) != 1:
        return 0
    
    user = frappe.session.user
    if is_valid_user(doc, user):
        from frappe.utils import nowtime
        
        doc.append("seen_by", {
            "user": user,
            "date": nowdate(),
            "time": nowtime()
        })
        seen = [v.user for v in doc.seen_by]
        doc.reached = len(list(set(seen)))
        doc.save(ignore_permissions=True)
        
        frappe.publish_realtime(
            event="alerts_refresh_seen_by",
            message={"alert": doc.name},
            after_commit=True
        )
    
    return 1


# [Internal]
def is_valid_user(doc, user):
    score = 0
    if doc.for_users:
        users = [v.user for v in doc.for_users]
        if user in users:
            score = 1
    
    if score == 0 and doc.for_roles:
        from frappe.utils import has_common
        
        roles = [v.role for v in doc.for_roles]
        if has_common(roles, frappe.get_roles(user)):
            score = 1
    
    if score == 0:
        return False
    
    total_seen = 0
    if doc.seen_by:
        today = nowdate()
        for v in doc.seen_by:
            if v.user == user:
                total_seen += 1
                if v.date == today:
                    return False
    
    if not cint(doc.is_repeatable) and total_seen:
        return False
    
    max_repeats = cint(doc.number_of_repeats)
    if max_repeats > 0 and total_seen >= max_repeats:
        return False
    
    return True
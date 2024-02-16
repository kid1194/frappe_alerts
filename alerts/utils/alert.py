# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import cint, nowdate

from .cache import (
    get_cache,
    set_cache,
    del_cache
)


# [Internal]
_alert_dt_ = "Alert"


# [Hooks]
def update_alerts():
    from pypika.terms import Criterion
    
    today = nowdate()
    doc = frappe.qb.DocType(_alert_dt_)
    data = (
        frappe.qb.from_(doc)
        .select(doc.name)
        .where(doc.docstatus == 1)
        .where(Criterion.any([
            Criterion.all([
                doc.until_date.lt(today),
                doc.status == "Active"
            ]),
            Criterion.all([
                doc.from_date.lte(today),
                doc.until_date.gte(today),
                doc.status == "Pending"
            ])
        ]))
    ).run(as_dict=True)
    if data and isinstance(data, list):
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
        
        from .cache import clear_doc_cache
        
        for v in data:
            clear_doc_cache(_alert_dt_, v["name"])
        
        clear_alert_cache()


# [Alerts Alert, Internal]
def clear_alert_cache():
    del_cache(f"{_alert_dt_} For User")
    del_cache(f"{_alert_dt_} For Role")
    del_cache(f"{_alert_dt_} Seen By")


# [Alert Type]
def type_alerts_exists(alert_type):
    from .common import is_doc_exists
    
    return is_doc_exists(_alert_dt_, {"alert_type": alert_type})


# [Internal]
def get_user_alerts(user: str):
    today = nowdate()
    expiry = seconds_left_for_day()
    alerts = get_daily_alerts(today, expiry)
    if not alerts:
        return None
    
    parents = []
    get_alerts_for_user(user, alerts, parents, expiry)
    get_alerts_for_roles(user, alerts, parents, expiry)
    if not parents:
        return None
    
    doc = frappe.qb.DocType(_alert_dt_)
    qry = (
        frappe.qb.from_(doc)
        .select(
            doc.name,
            doc.title,
            doc.alert_type,
            doc.message,
            doc.is_repeatable,
            doc.number_of_repeats
        )
        .where(doc.name.isin(parents))
    )
    
    from .type import type_join_query
    
    qry = type_join_query(qry, doc.alert_type)
    
    data = qry.run(as_dict=True)
    if not data or not isinstance(data, list):
        return None
    
    data = filter_seen_alerts(data, user, parents, today, expiry)
    if not data:
        return None
    
    return data


# [Internal]
def get_daily_alerts(date: str, expiry: int):
    data = get_cache(_alert_dt_, date, True)
    if isinstance(data, list):
        return data
    
    data = frappe.get_all(
        _alert_dt_,
        fields=["name"],
        filters=[
            [_alert_dt_, "from_date", "<=", date],
            [_alert_dt_, "until_date", ">=", date],
            [_alert_dt_, "status", "=", "Active"],
            [_alert_dt_, "docstatus", "=", 1]
        ],
        pluck="name",
        ignore_permissions=True,
        strict=False
    )
    if not isinstance(data, list):
        return None
    
    set_cache(_alert_dt_, date, data, expiry)
    return data


# [Internal]
def get_alerts_for_user(user: str, alerts: list, parents: list, expiry: int):
    dt = f"{_alert_dt_} For User"
    data = get_cache(dt, user, True)
    if isinstance(data, list):
        if data:
            parents.extend(data)
    
    else:
        doc = frappe.qb.DocType(dt)
        data = (
            frappe.qb.from_(doc)
            .select(doc.parent)
            .where(doc.parenttype == _alert_dt_)
            .where(doc.parentfield == "for_users")
            .where(doc.parent.isin(alerts))
            .where(doc.user == user)
        ).run(as_dict=True)
        if isinstance(data, list):
            if data:
                data = list(set([
                    v["parent"] for v in data
                    if v["parent"] not in parents
                ]))
                parents.extend(data)
            
            set_cache(dt, user, data, expiry)


# [Internal]
def get_alerts_for_roles(user: str, alerts: list, parents: list, expiry: int):
    dt = f"{_alert_dt_} For Role"
    data = get_cache(dt, user, True)
    if isinstance(data, list):
        if data:
            parents.extend(data)
    
    else:
        doc = frappe.qb.DocType(dt)
        data = (
            frappe.qb.from_(doc)
            .select(doc.parent)
            .where(doc.parenttype == _alert_dt_)
            .where(doc.parentfield == "for_roles")
            .where(doc.parent.isin(alerts))
            .where(doc.role.isin(frappe.get_roles(user)))
        ).run(as_dict=True)
        if isinstance(data, list):
            if data:
                data = list(set([
                    v["parent"] for v in data
                    if v["parent"] not in parents
                ]))
                parents.extend(data)
            
            set_cache(dt, user, data, expiry)


# [Internal]
def get_alerts_seen_by(user: str, alerts: list, expiry: int):
    from .cache import uuid_key
    
    dt = f"{_alert_dt_} Seen By"
    key = uuid_key([user, alerts])
    data = get_cache(dt, key, True)
    if isinstance(data, list):
        return data
    
    doc = frappe.qb.DocType(dt)
    data = (
        frappe.qb.from_(doc)
        .select(doc.parent, doc.date)
        .where(doc.parenttype == _alert_dt_)
        .where(doc.parentfield == "seen_by")
        .where(doc.parent.isin(alerts))
        .where(doc.user == user)
    ).run(as_dict=True)
    if not isinstance(data, list):
        return None
    
    set_cache(dt, key, data, expiry)
    return data


# [Internal]
def filter_seen_alerts(data: list, user: str, alerts: list, today: str, expiry: int):
    seen_by = get_alerts_seen_by(user, alerts, expiry)
    if not seen_by:
        return data
    
    data = {v["name"]:v for v in data}
    totals = {}
    for v in seen_by:
        if v["date"] == today:
            data.pop(v["parent"], None)
        else:
            if v["parent"] not in totals:
                totals[v["parent"]] = 0
            totals[v["parent"]] += 1
            d = data.get(v["parent"], None)
            if (
                d and (
                    not cint(d["is_repeatable"]) or
                    cint(d["number_of_repeats"]) <= totals[v["parent"]]
                )
            ):
                data.pop(v["parent"], None)
    
    return list(data.values())


# [Access]
def cache_alerts(user: str):
    from .common import log_error
    
    set_cache(_alert_dt_, f"{user}-access", 1, 120)
    data = get_user_alerts(user)
    log_error("Access alerts list: " + str(data))
    if not data:
        data = []
    expiry = seconds_left_for_day()
    set_cache(_alert_dt_, user, data, expiry)


# [Boot]
def get_alerts_cache(user: str):
    from .common import log_error
    
    access = get_cache(_alert_dt_, f"{user}-access", True)
    log_error("Boot alerts access check: " + str(access))
    if access:
        del_cache(_alert_dt_, f"{user}-access")
        cache = get_cache(_alert_dt_, user, True)
        if not (cache is None):
            del_cache(_alert_dt_, user)
        if isinstance(cache, list):
            return cache if cache else None
        
        from .background import enqueue_job
        
        log_error("Boot alerts enqueued")
        enqueue_job(
            "alerts.utils.alert.show_user_alerts",
            f"show-user-alerts-for-{user}",
            user=user
        )
    
    return None


# [Internal]
def show_user_alerts(user: str):
    data = get_cache(_alert_dt_, user, True)
    if not (data is None):
        del_cache(_alert_dt_, user)
    if not data or not isinstance(data, list):
        data = get_user_alerts(user)
    from .common import log_error
    log_error("Alerts enqueued: " + str(data))
    if data:
        from .realtime import emit_show_alerts
        
        emit_show_alerts({"alerts": data}, False)


# [Alerts Alert]
def send_alert(doc):
    from .realtime import emit_show_alert
    from .type import add_type_data
    
    user = frappe.session.user
    data = frappe._dict({
        "delay": 1,
        "name": doc.name,
        "title": doc.title,
        "alert_type": doc.alert_type,
        "message": doc.message,
        "is_repeatable": cint(doc.is_repeatable)
    })
    add_type_data(doc.alert_type, data)
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
    
    emit_show_alert(data)


# [Alerts Js]
@frappe.whitelist(methods=["POST"])
def mark_seens(names):
    if names and isinstance(names, str):
        from .common import parse_json
        
        names = parse_json(names)
    
    if not names or not isinstance(names, list):
        return {
            "error": 1,
            "message": "Invalid arguments"
        }
    
    user = frappe.session.user
    for v in names:
        if v and isinstance(v, str):
            mark_as_seen(v, user)
    
    return {"success": 1}


# [Internal]
def mark_as_seen(name: str, user: str):
    from .cache import get_cached_doc
    
    doc = get_cached_doc(_alert_dt_, name)
    if (
        not doc or cint(doc.docstatus) != 1 or
        doc.status != "Active"
    ):
        from frappe import _
        
        from .common import log_error
        
        log_error(_(
            "The seen alert lert \"{0}\" "
            + "doesn't exist, is draft, "
            + "is cancelled or isn't active."
        ).format(name))
        return 0
    
    today = nowdate()
    if is_valid_user(doc, user, today):
        from frappe.utils import nowtime
        
        from .realtime import emit_alert_seen
        
        doc.append("seen_by", {
            "user": user,
            "date": today,
            "time": nowtime()
        })
        seen = list(set([v.user for v in doc.seen_by]))
        doc.reached = len(seen)
        doc.save(ignore_permissions=True)
        emit_alert_seen({
            "alert": doc.name,
            "delay": 1
        })
    
    return 1


# [Internal]
def is_valid_user(doc, user, today):
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
        for v in doc.seen_by:
            if v.user == user:
                if v.date == today:
                    return False
                
                seen += 1
    
    if not cint(doc.is_repeatable):
        return seen < 1
    
    return cint(doc.number_of_repeats) > seen


# [Internal]
def seconds_left_for_day():
    from frappe.utils import now_datetime
    
    dt = now_datetime()
    sec = (24 - dt.hour - 1) * 60 * 60
    sec = sec + ((60 - dt.minute - 1) * 60)
    sec = sec + (60 - dt.second)
    return sec
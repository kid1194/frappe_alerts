# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe import _
from frappe.utils import cint


# [A Alert, Internal]
AlertStatus = frappe._dict({
    "d": "Draft",
    "p": "Pending",
    "a": "Active",
    "f": "Finished",
    "c": "Cancelled"
})


# [Internal]
_ALERT_DT_ = "Alert"


# [Hooks]
def update_alerts():
    from pypika.terms import Criterion
    
    from frappe.utils import nowdate
    
    today = nowdate()
    doc = frappe.qb.DocType(_ALERT_DT_)
    data = (
        frappe.qb.from_(doc)
        .select(doc.name, doc.status)
        .where(doc.docstatus == 1)
        .where(Criterion.any([
            Criterion.all([
                doc.until_date.lt(today),
                doc.status == AlertStatus.a
            ]),
            Criterion.all([
                doc.from_date.lte(today),
                doc.until_date.gte(today),
                doc.status == AlertStatus.p
            ])
        ]))
    ).run(as_dict=True)
    if data and isinstance(data, list):
        from .cache import clear_doc_cache
        
        names = [
            [[], AlertStatus.f],
            [[], AlertStatus.a]
        ]
        for i in range(len(data)):
            v = data.pop(0)
            clear_doc_cache(_ALERT_DT_, v["name"])
            x = 1 if v["status"] == AlertStatus.p else 0
            names[x][0].append(v["name"])
        
        for i in range(len(names)):
            v = names.pop(0)
            if v[0]:
                (
                    frappe.qb.update(doc)
                    .set(doc.status, v[1])
                    .where(doc.name.isin(v[0]))
                ).run()
                if v[1] == AlertStatus.a:
                    from .system import use_fallback_sync
                    
                    if use_fallback_sync():
                        continue
                    
                    from .background import uuid_key, is_job_running
                    
                    job_id = uuid_key(v[0])
                    job_id = f"send-alerts-{job_id}"
                    if not is_job_running(job_id):
                        from .background import enqueue_job
                        
                        enqueue_job(
                            "alerts.utils.alert.send_alerts",
                            job_id,
                            names=v[0]
                        )


# [A Alert Type]
def type_alerts_exist(alert_type):
    from .common import doc_count
    
    return doc_count(_ALERT_DT_, {"alert_type": alert_type}) > 0


# [Access]
def enqueue_alerts(user: str):
    from .cache import get_cache
    
    cache = get_cache(user, "alerts", True)
    if not cache:
        from .background import is_job_running
        
        job_id = f"alerts-cache-for-{user}"
        if not is_job_running(job_id):
            from .background import enqueue_job
            
            enqueue_job(
                "alerts.utils.alert.cache_user_alerts",
                job_id,
                user=user
            )


# [Alerts Js]
@frappe.whitelist()
def sync_alerts(init=None):
    from .system import get_settings
    
    doc = get_settings()
    data = {}
    if doc["use_fallback_sync"]:
        data["system"] = doc
    
    if not doc["is_enabled"]:
        return data
    
    if doc["use_fallback_sync"] or init:
        user = frappe.session.user
        if init:
            from .cache import get_cache
            
            key = f"alerts-{user}"
            cache = get_cache(_ALERT_DT_, key, True)
            if isinstance(cache, list):
                from .cache import del_cache
                
                del_cache(_ALERT_DT_, key)
                data["alerts"] = cache
        
        if "alerts" not in data:
            data["alerts"] = get_user_alerts(user)
    
    if init:
        from .type import get_types
        
        data["types"] = get_types()
    
    if doc["use_fallback_sync"]:
        from .realtime import get_events
        
        data["events"] = get_events()
    
    return data


# [A Alert]
def send_alert(data: dict):
    from .type import is_enabled_type
    
    if is_enabled_type(data["alert_type"]):
        from .realtime import emit_show_alert
        
        emit_show_alert(data)


# [Alerts Js]
@frappe.whitelist(methods=["POST"])
def sync_seen(names):
    if names and isinstance(names, str):
        from .common import parse_json
        
        names = parse_json(names, names)
    
    if not names or not isinstance(names, list):
        return {"error": _("Arguments required to sync seen alerts are invalid.")}
    
    names = list(set(names))
    tmp = names.copy()
    for i in range(len(tmp)):
        v = tmp.pop(0)
        if not v or not isinstance(v, str):
            names.remove(v)
    
    if not names:
        return {"error": _("Arguments required to sync seen alerts are invalid.")}
    
    from .background import uuid_key, is_job_running
    
    user = frappe.session.user
    job_id = uuid_key(names)
    job_id = f"alerts-sync-seen-{user}-{job_id}"
    if not is_job_running(job_id):
        from frappe.utils import nowdate, nowtime
        
        from .background import enqueue_job
        
        enqueue_job(
            "alerts.utils.alert.mark_as_seen",
            job_id,
            timeout=len(names) * 200,
            user=user,
            names=names,
            date=nowdate(),
            time=nowtime()
        )
    
    return 1


# [Internal]
def cache_user_alerts(user: str):
    from .cache import set_cache
    
    expiry = seconds_left_for_day()
    data = get_user_alerts(user)
    set_cache(user, "alerts", True, expiry)
    set_cache(_ALERT_DT_, f"alerts-{user}", data, expiry)


# [Internal]
def get_user_alerts(user: str):
    from frappe.utils import nowdate
    
    today = nowdate()
    alerts = get_daily_alerts(today)
    tmp = []
    if not alerts:
        return tmp
    
    parents = []
    get_alerts_for_user(user, alerts, parents)
    get_alerts_for_roles(user, alerts, parents)
    if not parents:
        return tmp
    
    from .type import type_join_query
    
    parents = list(set(parents))
    doc = frappe.qb.DocType(_ALERT_DT_)
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
    qry = type_join_query(qry, doc.alert_type)
    data = qry.run(as_dict=True)
    if not data or not isinstance(data, list):
        return tmp
    
    data = filter_seen_alerts(data, user, parents, today)
    if not data:
        data = tmp
    
    return data


# [Internal]
def get_daily_alerts(date: str):
    return frappe.get_all(
        _ALERT_DT_,
        fields=["name"],
        filters=[
            [_ALERT_DT_, "from_date", "<=", date],
            [_ALERT_DT_, "until_date", ">=", date],
            [_ALERT_DT_, "status", "=", AlertStatus.a],
            [_ALERT_DT_, "docstatus", "=", 1]
        ],
        pluck="name",
        ignore_permissions=True,
        strict=False
    )


# [Internal]
def get_alerts_for_user(user: str, alerts: list, parents: list):
    dt = f"{_ALERT_DT_} For User"
    doc = frappe.qb.DocType(dt)
    data = (
        frappe.qb.from_(doc)
        .select(doc.parent)
        .distinct()
        .where(doc.parenttype == _ALERT_DT_)
        .where(doc.parentfield == "for_users")
        .where(doc.parent.isin(alerts))
        .where(doc.user == user)
    ).run(as_dict=True)
    if data and isinstance(data, list):
        parents.extend([v["parent"] for v in data])


# [Internal]
def get_alerts_for_roles(user: str, alerts: list, parents: list):
    dt = f"{_ALERT_DT_} For Role"
    doc = frappe.qb.DocType(dt)
    data = (
        frappe.qb.from_(doc)
        .select(doc.parent)
        .distinct()
        .where(doc.parenttype == _ALERT_DT_)
        .where(doc.parentfield == "for_roles")
        .where(doc.parent.isin(alerts))
        .where(doc.role.isin(frappe.get_roles(user)))
    ).run(as_dict=True)
    if data and isinstance(data, list):
        parents.extend([v["parent"] for v in data])


# [Internal]
def get_alerts_seen_by(alerts: list, user: str=None):
    dt = f"{_ALERT_DT_} Seen By"
    doc = frappe.qb.DocType(dt)
    qry = (
        frappe.qb.from_(doc)
        .select(doc.parent, doc.user, doc.date)
        .where(doc.parenttype == _ALERT_DT_)
        .where(doc.parentfield == "seen_by")
        .where(doc.parent.isin(alerts))
    )
    if user:
        qry = qry.where(doc.user == user)
    
    data = qry.run(as_dict=True)
    if not isinstance(data, list):
        return None
    
    return data


# [Internal]
def filter_seen_alerts(data: list, user: str, alerts: list, today: str):
    seen_by = get_alerts_seen_by(user, alerts)
    if not seen_by:
        return data
    
    dates = {}
    seen = {}
    for i in range(len(seen_by)):
        v = seen_by.pop(0)
        k = v["parent"]
        seen[k] = seen.get(k, 0) + 1
        if k not in dates:
            dates[k] = [v["date"]]
        else:
            dates[k].append(v["date"])
    
    for v in data:
        k = v["name"]
        if (
            (k in dates and today in dates[k]) or
            (not cint(v["is_repeatable"]) and seen.get(k, 0) > 0) or
            cint(v["number_of_repeats"]) <= seen.get(k, 0)
        ):
            data.remove(v)
    
    return data


# [Internal]
def mark_as_seen(user: str, names: list, date: str, time: str):
    from frappe import _
    
    from .cache import get_cached_doc
    from .common import log_error
    
    updates = []
    user_roles = frappe.get_roles(user)
    for i in range(len(names)):
        name = names.pop(0)
        doc = get_cached_doc(_ALERT_DT_, name)
        if not doc or not doc._is_submitted or not doc._is_active:
            log_error(_("Seen alert \"{0}\" isn't active or doesn't exist.").format(name))
            continue
        
        if not is_valid_user(doc, user, user_roles, date):
            continue
        
        doc.append("seen_by", {
            "user": user,
            "date": date,
            "time": time
        })
        seen = len(list(set([v.user for v in doc.seen_by])))
        doc.reached = seen
        doc.save(ignore_permissions=True)
        updates.append(doc.name)
    
    if updates:
        from .realtime import emit_alert_seen
        
        emit_alert_seen({
            "alerts": updates,
            "delay": 1
        })


# [Internal]
def is_valid_user(doc, user, user_roles, today):
    valid = 0
    if doc.for_users:
        for v in doc.for_users:
            if v.user == user:
                valid = 1
                break
    
    if not valid and doc.for_roles:
        from frappe.utils import has_common
        
        roles = [v.role for v in doc.for_roles]
        if has_common(roles, user_roles):
            valid = 1
    
    if not valid:
        return False
    
    seen = 0
    if doc.seen_by:
        for v in doc.seen_by:
            if v.user == user:
                seen += 1
                if v.date == today:
                    return False
    
    if not doc._is_repeatable:
        return seen < 1
    
    return doc._number_of_repeats > seen


# [Internal]
def seconds_left_for_day():
    from frappe.utils import now_datetime
    
    dt = now_datetime()
    sec = (24 - dt.hour - 1) * 60 * 60
    sec = sec + ((60 - dt.minute - 1) * 60)
    sec = sec + (60 - dt.second)
    return sec


# [Internal]
def send_alerts(names: list):
    from .type import type_join_query
    
    doc = frappe.qb.DocType(_ALERT_DT_)
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
        .where(doc.name.isin(names))
    )
    qry = type_join_query(qry, doc.alert_type)
    data = qry.run(as_dict=True)
    if not data or not isinstance(data, list):
        return 0
    
    dt = f"{_ALERT_DT_} For User"
    doc = frappe.qb.DocType(dt)
    for_users = (
        frappe.qb.from_(doc)
        .select(doc.parent, doc.user)
        .where(doc.parenttype == _ALERT_DT_)
        .where(doc.parentfield == "for_users")
        .where(doc.parent.isin(names))
    ).run(as_dict=True)
    if not for_users or not isinstance(for_users, list):
        for_users = {}
    else:
        tmp = for_users
        for_users = {}
        for i in range(len(tmp)):
            v = tmp.pop(0)
            k = v["parent"]
            if k not in for_users:
                for_users[k] = [v["user"]]
            else:
                for_users[k].append(v["user"])
    
    dt = f"{_ALERT_DT_} For Role"
    doc = frappe.qb.DocType(dt)
    for_roles = (
        frappe.qb.from_(doc)
        .select(doc.parent, doc.role)
        .where(doc.parenttype == _ALERT_DT_)
        .where(doc.parentfield == "for_roles")
        .where(doc.parent.isin(names))
    ).run(as_dict=True)
    if not for_roles or not isinstance(for_roles, list):
        for_roles = {}
    else:
        tmp = for_roles
        for_roles = {}
        for i in range(len(tmp)):
            v = tmp.pop(0)
            k = v["parent"]
            if k not in for_roles:
                for_roles[k] = [v["role"]]
            else:
                for_roles[k].append(v["role"])
    
    seen_by = get_alerts_seen_by(names)
    if not seen_by:
        seen_by = {}
    else:
        tmp = seen_by
        seen_by = {}
        for i in range(len(tmp)):
            v = tmp.pop(0)
            k = v["parent"]
            if k not in seen_by:
                seen_by[k] = [v]
            else:
                seen_by[k].append(v)
    
    from frappe.utils import nowdate
    
    from .realtime import emit_show_alert
                
    today = nowdate()
    for i in range(len(data)):
        v = data.pop(0)
        k = v["name"]
        v["is_repeatable"] = 1 if cint(v["is_repeatable"]) > 0 else 0
        v["number_of_repeats"] = cint(v["number_of_repeats"])
        v["users"] = for_users.pop(k, [])
        v["roles"] = for_roles.pop(k, [])
        v["seen_by"] = {}
        v["seen_today"] = []
        if k in seen_by:
            for y in seen_by.pop(k):
                x = y["user"]
                if x not in v["seen_by"]:
                    v["seen_by"][x] = 1
                else:
                    v["seen_by"][x] += 1
                if x not in v["seen_today"] and y["date"] == today:
                    v["seen_today"].append(x)
        
        emit_show_alert(v)
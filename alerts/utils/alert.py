# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from pypika.terms import Criterion
from pypika.functions import IfNull

import frappe
from frappe.utils import (
    cint,
    nowdate,
    getdate,
    has_common,
    now,
    unique
)
from frappe.query_builder.functions import Count

from .cache import (
    get_cached_doc,
    set_tmp_cache,
    get_tmp_cache
)
from .common import is_doc_exists
from .type import (
    type_join_query,
    get_type
)


# [Internal]
_ALERT_ = "Alert"


# [Internal]
_ALERT_USER_ = "Alert For User"


# [Internal]
_ALERT_ROLE_ = "Alert For Role"


# [Internal]
_ALERT_SEEN_ = "Alert Seen By"


# [Alert Type]
def type_alerts_exists(alert_type):
    return is_doc_exists(_ALERT_, {"alert_type": alert_type})


# [Hooks]
def update_alerts():
    today = getdate()
    doc = frappe.qb.DocType(_ALERT_)
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
def cache_alerts(user):
    doc = frappe.qb.DocType(_ALERT_)
    udoc = frappe.qb.DocType(_ALERT_USER_)
    rdoc = frappe.qb.DocType(_ALERT_ROLE_)
    sdoc = frappe.qb.DocType(_ALERT_SEEN_)
    
    uqry = (
        frappe.qb.from_(udoc)
        .select(udoc.parent)
        .distinct()
        .where(udoc.parenttype == _ALERT_)
        .where(udoc.parentfield == "for_users")
        .where(udoc.user == user)
    )
    
    rqry = (
        frappe.qb.from_(rdoc)
        .select(rdoc.parent)
        .distinct()
        .where(rdoc.parenttype == _ALERT_)
        .where(rdoc.parentfield == "for_roles")
        .where(rdoc.role.isin(frappe.get_roles(user)))
    )
    
    scqry = (
        frappe.qb.from_(sdoc)
        .select(Count(sdoc.parent))
        .where(sdoc.parent == doc.name)
        .where(sdoc.parenttype == _ALERT_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .limit(1)
    )
    
    stqry = (
        frappe.qb.from_(sdoc)
        .select(sdoc.parent)
        .where(sdoc.parent == doc.name)
        .where(sdoc.parenttype == _ALERT_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .where(sdoc.date_time.gte(nowdate()))
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
        ])
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
    cache = get_tmp_cache(f"alerts-for-{user}")
    if not cache or not isinstance(cache, list):
        cache = []
    
    return cache


# [Alerts Alert]
def send_alert(doc):
    seen_by = {}
    seen_today = []
    
    if doc.seen_by:
        today = getdate()
        for v in doc.seen_by:
            if v.user not in seen_by:
                seen_by[v.user] = 0
            
            seen_by[v.user] += 1
            
            if (
                v.user not in seen_today and
                getdate(v.date_time) == today
            ):
                seen_today.append(v.user)
    
    frappe.publish_realtime(
        event="show_alert",
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
def mark_as_seen(name):
    if (
        not name or not isinstance(name, str) or
        not is_doc_exists(_ALERT_, name)
    ):
        return 0
    
    doc = get_cached_doc(_ALERT_, name)
    if not doc or cint(doc.docstatus) != 1:
        return 0
    
    user = frappe.session.user
    if is_valid_user(doc, user):
        doc.append("seen_by", {"user": user, "date_time": now()})
        doc.reached = len(unique([v.user for v in doc.seen_by]))
        doc.save(ignore_permissions=True)
        
        frappe.publish_realtime(
            event="refresh_alert_seen_by",
            message={"alert": doc.name},
            after_commit=True
        )
    
    return 1


# [Internal]
def is_valid_user(doc, user):
    score = 0
    if (
        doc.for_users and
        user in [v.user for v in doc.for_users]
    ):
        score = 1
    
    elif (
        doc.for_roles and
        has_common(
            [v.role for v in doc.for_roles],
            frappe.get_roles(user)
        )
    ):
        score = 1
    
    if score == 0:
        return False
    
    total_seen = 0
    if doc.seen_by:
        today = getdate()
        for v in doc.seen_by:
            if v.user == user:
                total_seen += 1
                if getdate(v.date_time) == today:
                    return False
    
    if not cint(doc.is_repeatable) and total_seen:
        return False
    
    max_repeats = cint(doc.number_of_repeats)
    if max_repeats > 0 and total_seen >= max_repeats:
        return False
    
    return True
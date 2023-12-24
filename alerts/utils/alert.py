# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from datetime import datetime

import frappe
from frappe.utils import (
    cint,
    nowdate,
    has_common,
    now,
    unique
)
from frappe.query_builder.functions import Count

from pypika.terms import Criterion
from pypika.functions import IfNull
from pypika.enums import Order

from .common import (
    set_cache,
    pop_cache,
    is_doc_exist,
    get_cached_doc
)
from .type import join_type_to_query, get_type


_DT_ = "Alert"

    
def is_alerts_for_type_exists(alert_type):
    return is_doc_exist(_DT_, {"alert_type": alert_type})


def update_alerts():
    now = nowdate()
    doc = frappe.qb.DocType(_DT_)
    (
        frappe.qb.update(doc)
        .set(doc.status, "Finished")
        .where(doc.from_date.lt(now))
        .where(doc.until_date.lte(now))
        .where(doc.status == "Active")
        .where(doc.docstatus == 1)
    ).run()
    (
        frappe.qb.update(doc)
        .set(doc.status, "Active")
        .where(doc.from_date.lte(now))
        .where(doc.until_date.gt(now))
        .where(doc.status == "Pending")
        .where(doc.docstatus == 1)
    ).run()


def cache_alerts(user):
    doc = frappe.qb.DocType(_DT_)
    udoc = frappe.qb.DocType(_DT_ + " For User")
    rdoc = frappe.qb.DocType(_DT_ + " For Role")
    sdoc = frappe.qb.DocType(_DT_ + " Seen By")
    
    uQry = (
        frappe.qb.from_(udoc)
        .select(udoc.parent)
        .distinct()
        .where(udoc.parenttype == _DT_)
        .where(udoc.parentfield == "for_users")
        .where(udoc.user == user)
    )
    
    rQry = (
        frappe.qb.from_(rdoc)
        .select(rdoc.parent)
        .distinct()
        .where(udoc.parenttype == _DT_)
        .where(udoc.parentfield == "for_roles")
        .where(rdoc.role.isin(frappe.get_roles(user)))
    )
    
    sQry = (
        frappe.qb.from_(sdoc)
        .select(sdoc.parent)
        .distinct()
        .where(sdoc.parenttype == _DT_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
    )
    
    scQry = (
        frappe.qb.from_(sdoc)
        .select(Count(sdoc.parent))
        .where(sdoc.parenttype == _DT_)
        .where(sdoc.parentfield == "seen_by")
        .where(sdoc.user == user)
        .limit(1)
    )
    
    qry = (
        frappe.qb.from_(doc)
        .select(
            doc.name,
            doc.alert_type,
            doc.title,
            doc.message,
            doc.is_repeatable
        )
        .where(Criterion.any([
            Criterion.all([
                IfNull(uQry, "") != "",
                doc.name.isin(uQry)
            ]),
            Criterion.all([
                IfNull(rQry, "") != "",
                doc.name.isin(rQry)
            ])
        ]))
        .where(Criterion.any([
            Criterion.all([
                doc.is_repeatable == 1,
                doc.number_of_repeats.gt(IfNull(scQry, 0))
            ]),
            IfNull(sQry, "") == "",
            doc.name.notin(sQry)
        ]))
        .where(doc.status == "Active")
        .where(doc.docstatus == 1)
    )
    qry = join_type_to_query(qry, doc.alert_type)
    
    data = qry.run(as_dict=True)
    
    if not data or not isinstance(data, list):
        data = []
    
    set_cache(_DT_, user, data)


def send_alert(name):
    if (
        not name or not isinstance(name, str) or
        not is_doc_exist(_DT_, name)
    ):
        return 0
    
    doc = get_cached_doc(_DT_, name)
    
    if cint(doc.docstatus) != 1 or doc.status != "Active":
        return 0
    
    user = frappe.session.user
    if is_valid_user(doc, user):
        frappe.publish_realtime(
            event="show_alert",
            message={
                "name": doc.name,
                "alert_type": doc.alert_type,
                "title": doc.title,
                "message": doc.message,
                "type": get_type(doc.alert_type),
            },
            after_commit=True
        )


@frappe.whitelist(methods=["POST"])
def mark_as_seen(name):
    if (
        not name or not isinstance(name, str) or
        not is_doc_exist(_DT_, name)
    ):
        return 0
    
    user = frappe.session.user
    doc = get_cached_doc(_DT_, name, for_update=True)
    
    if is_valid_user(doc, user):
        doc.append("seen_by", {"user": user, "date_time": now()})
        doc.reached = len(unique([v.user for v in doc.seen_by]))
        doc.save(ignore_permissions=True)
        
        frappe.publish_realtime(
            event="refresh_alert_seen_by",
            after_commit=True
        )
    
    return 1


def is_valid_user(doc, user):
    score = 0
    if (
        doc.for_users and
        user in [v.user for v in doc.for_users]
    ):
        score = 1
    
    if (
        score == 0 and
        doc.for_roles and
        has_common(
            [v.role for v in doc.for_roles],
            frappe.get_roles(user)
        )
    ):
        score = 1
    
    if score == 0:
        return False
    
    total_seen = (
        len([v.user for v in doc.seen_by if v.user == user])
        if doc.seen_by else 0
    )
    if (
        total_seen == 0 or
        (
            cint(doc.is_repeatable) and
            cint(doc.number_of_repeats) > total_seen
        )
    ):
        return True
    else:
        return False


def get_alerts_cache(user):
    cache = pop_cache(_DT_, user)
    return cache if cache and isinstance(cache, list) else []
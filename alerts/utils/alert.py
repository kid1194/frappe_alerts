# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from datetime import datetime

import frappe
from frappe.utils import (
    cint,
    nowdate,
    get_datetime,
    has_common
)

from pypika.terms import Criterion
from pypika.functions import IfNull
from pypika.enums import Order

from .common import (
    set_cache,
    get_cache,
    del_cache,
    is_doc_exist,
    get_cached_doc
)
from .type import get_types


_DT_ = "Alert"

    
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
    
    data = (
        frappe.qb.from_(doc)
        .select(
            doc.name,
            doc.alert_type,
            doc.title,
            doc.content,
            doc.is_repeatable
        )
        .where(Criterion.any(
            Criterion.all(
                IfNull(uQry, "") != "",
                doc.name.isin(uQry)
            ),
            Criterion.all(
                IfNull(rQry, "") != "",
                doc.name.isin(rQry)
            )
        ))
        .where(Criterion.any(
            doc.is_repeatable == 1,
            IfNull(sQry, "") == "",
            doc.name.notin(sQry)
        ))
        .where(doc.status == "Active")
        .where(doc.docstatus == 1)
        .orderby(doc.from_date, order=Order.asc)
    ).run(as_dict=True)
    
    if not data or not isinstance(data, list):
        data = []
    
    if data:
        types = get_types([v["alert_type"] for v in data])
        for i in range(len(data)):
            data[i]["type"] = types[data[i]["alert_type"]]
        
    set_cache(_DT_, user, data)


def send_alert(data):
    if not data or not isinstance(data, dict):
        return 0
    
    if cint(data.docstatus) != 1 or data.status != "Active":
        return 0
    
    user = frappe.session.user 
    if (
        (
            data.for_users and
            user not in [v.user for v in data.for_users]
        ) or (
            data.for_roles and
            has_common(
                [v.role for v in data.for_roles],
                frappe.get_roles(user)
            )
        )
    ):
        frappe.publish_realtime(
            event="show_alert",
            message={
                "name": data.name,
                "alert_type": data.alert_type,
                "title": data.title,
                "content": data.content,
                "type": get_types([data.alert_type])[data.alert_type]
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
    
    if user not in [v.user for v in doc.seen_by]:
        doc.append("seen_by", {"user": user})
        doc.reached = len(doc.seen_by)
        doc.save(ignore_permissions=True)
        frappe.publish_realtime(
            event="alert_seen",
            message={"user": user},
            after_commit=True
        )
    
    return 1


def clear_alerts_cache(user):
    del_cache(_DT_, user)


def get_alerts_cache(user):
    cache = get_cache(_DT_, user)
    if not isinstance(cache, list):
        cache = []
    
    if cache:
        rep = len([v for v in cache if cint(v.is_repeatable)])
        if len(cache) != rep:
            clear_alerts_cache(user)
    
    return cache

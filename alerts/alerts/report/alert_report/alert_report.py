# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe import _, throw
from frappe.utils import cint


def execute(filters=None):
    if not filters:
        return [], []
    
    validate_filters(filters)
    columns = get_columns()
    data = get_result(filters)
    totals = get_totals(data)
    chart = get_chart_data(totals)
    summary = get_report_summary(totals)
    return columns, data, None, chart, summary


def validate_filters(filters):
    if (
        filters.get("from_date", "") and
        filters.get("until_date", "") and
        filters.from_date > filters.until_date
    ):
        throw(_("From Date must be before Until Date."))


def get_columns():
    dt = "Alert"
    return [
        {
            "label": _(dt),
            "fieldname": "alert",
            "fieldtype": "Link",
            "options": dt,
        },
        {
            "label": _("Title"),
            "fieldname": "title",
        },
        {
            "label": _("Alert Type"),
            "fieldname": "alert_type",
            "fieldtype": "Link",
            "options": "Alert Type"
        },
        {
            "label": _("From Date"),
            "fieldname": "from_date",
            "fieldtype": "Date"
        },
        {
            "label": _("Until Date"),
            "fieldname": "until_date",
            "fieldtype": "Date"
        },
        {
            "label": _("is_repeatable"),
            "fieldname": "Repeatable"
        },
        {
            "label": _("Reached"),
            "fieldname": "Reached",
            "fieldtype": "Int"
        },
        {
            "label": _("Status"),
            "fieldname": "status"
        },
    ]


def get_result(filters):
    from pypika.enums import Order
    
    doc = frappe.qb.DocType("Alert")
    qry = (
        frappe.qb.from_(doc)
        .select(
            doc.name.as_("alert"),
            doc.title,
            doc.alert_type,
            doc.from_date,
            doc.until_date,
            doc.is_repeatable,
            doc.reached,
            doc.status
        )
        .orderby(doc.from_date, order=Order.asc)
    )
    
    if filters.get("alert_type", ""):
        qry = qry.where(doc.alert_type == filters.alert_type)
    if filters.get("from_date", ""):
        qry = qry.where(doc.from_date.gte(filters.from_date))
    if filters.get("until_date", ""):
        qry = qry.where(doc.until_date.lte(filters.until_date))
    if cint(filters.get("is_repeatable", 0)):
        qry = qry.where(doc.is_repeatable == 1)
    if filters.get("status", ""):
        qry = qry.where(doc.status == filters.status)
    
    data = qry.run(as_dict=True)
    for i in range(len(data)):
        data[i]["is_repeatable"] = "Yes" if cint(data[i]["is_repeatable"]) else "No"
    
    return data


def get_totals(data):
    totals = {"*": len(data)}
    for v in get_types():
        totals[v] = 0
    for v in data:
        if v["alert_type"] in totals:
            totals[v["alert_type"]] += 1
    
    return totals


def get_chart_data(totals):
    labels = []
    datasets = []
    for k, v in totals.items():
        if k != "*":
            labels.append(k)
            datasets.append({
                "name": k,
                "values": [v],
            })
    
    return {
        "data": {
            "labels": labels,
            "datasets": datasets
        },
        "type": "bar",
        "fieldtype": "Int"
    }


def get_report_summary(totals):
    summary = []
    for k, v in totals.items():
        label = "Total"
        if k != "*":
            label += f" ({k})"
        summary.append({
            "value": v,
            "label": _(label),
            "datatype": "Int"
        })
    
    return summary


def get_types():
    return frappe.get_all(
        "Alert Type",
        fields=["name"],
        pluck="name",
        ignore_permissions=True,
        strict=False
    )
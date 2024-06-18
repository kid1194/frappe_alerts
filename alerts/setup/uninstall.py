# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe


# [Hooks]
def after_uninstall():
    from frappe.model.delete_doc import delete_doc
    
    docs = [
        ["Report", ["Alert Report"]],
        ["DocType", [
            "Alert Seen By",
            "Alert For Role",
            "Alert For User",
            "Alerts Update Receiver",
            "Alert",
            "Alert Type",
            "Alerts Settings"
        ]],
        ["Module Def", ["Alerts"]]
    ]
    
    try:
        doc = frappe.qb.DocType("Notification Log")
        (
            frappe.qb.from_(doc)
            .delete()
            .where(doc.document_type.isin(docs[1][1]))
        ).run()
    except Exception:
        pass
    
    for doc in docs:
        for name in doc[1]:
            try:
                delete_doc(
                    doc[0], name,
                    ignore_permissions=True,
                    ignore_missing=True,
                    ignore_on_trash=True,
                    delete_permanently=True
                )
            except Exception:
                pass
    
    frappe.clear_cache()
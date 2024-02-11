# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _, throw
from frappe.utils import cint, getdate
from frappe.model.document import Document

from alerts.utils import clear_doc_cache


class Alert(Document):
    def before_insert(self):
        self.status = "Draft"
        self._set_defaults()
    
    
    def before_validate(self):
        self._set_defaults()
    
    
    def validate(self):
        if self.docstatus.is_draft():
            if not self.title:
                throw(_("A valid alert title is required."))
            if not self.alert_type:
                throw(_("A valid alert type is required."))
            if not self.from_date:
                throw(_("A valid alert from date is required."))
            if not self.until_date:
                throw(_("A valid alert until date is required."))
            if getdate(self.from_date) > getdate(self.until_date):
                throw(_("The alert until date must be equal to or after the from date."))
            if not self.message:
                throw(_("A valid alert message is required."))
            if not self.for_roles and not self.for_users:
                throw(_("At least one recipient role or user is required."))
    
    
    def before_save(self):
        clear_doc_cache(self.doctype, self.name)
        self._check_status()
    
    
    def before_submit(self):
        clear_doc_cache(self.doctype, self.name)
        self.status = "Active"
    
    
    def after_submit(self):
        from alerts.utils import send_alert
        
        send_alert(self)
    
    
    def before_update_after_submit(self):
        clear_doc_cache(self.doctype, self.name)
        self._check_status()
    
    
    def before_cancel(self):
        clear_doc_cache(self.doctype, self.name)
        self.status = "Cancelled"
    
    
    def _set_defaults(self):
        if not self.from_date:
            from frappe.utils nowdate
            
            self.from_date = nowdate()
        if not self.until_date:
            self.until_date = self.from_date
        if (
            not cint(self.is_repeatable) or
            cint(self.number_of_repeats) < 1
        ):
            self.number_of_repeats = 1
    
    
    def _check_status(self):
        if self.docstatus.is_draft() and self.status != "Draft":
            self.status = "Draft"
        elif self.docstatus.is_cancelled() and self.status != "Cancelled":
            self.status = "Cancelled"
        elif (
            self.docstatus.is_submitted() and
            self.status not in ("Pending", "Active", "Finished")
        ):
            today = getdate()
            if getdate(self.from_date) > today:
                self.status = "Pending"
            elif getdate(self.until_date) < today:
                self.status = "Finished"
            else:
                self.status = "Active"
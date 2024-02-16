# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _, throw
from frappe.utils import (
    cint,
    getdate
)
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
        self.status = "Draft"
    
    
    def before_submit(self):
        clear_doc_cache(self.doctype, self.name)
        if getdate(self.from_date) > getdate():
            self.status = "Pending"
        else:
            self.status = "Active"
            self.flags.send_alert = True
    
    
    def on_update(self):
        self._send_alert()
    
    
    def before_update_after_submit(self):
        clear_doc_cache(self.doctype, self.name)
        if (
            self.has_value_changed("status") and
            self.status == "Active"
        ):
            self.flags.send_alert = True
    
    
    def on_update_after_submit(self):
        self._send_alert()
    
    
    def before_cancel(self):
        clear_doc_cache(self.doctype, self.name)
        self.status = "Cancelled"
    
    
    def _set_defaults(self):
        if not self.from_date:
            from frappe.utils import nowdate
            
            self.from_date = nowdate()
        if not self.until_date:
            self.until_date = self.from_date
        if (
            not cint(self.is_repeatable) or
            cint(self.number_of_repeats) < 1
        ):
            self.number_of_repeats = 1
    
    
    def _send_alert(self):
        if self.flags.get("send_alert", False):
            from alerts.utils import send_alert
            
            self.flags.pop("send_alert")
            send_alert(self)
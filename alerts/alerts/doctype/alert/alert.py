# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _, throw
from frappe.utils import (
    nowdate,
    add_to_date,
    get_datetime
)
from frappe.model.document import Document

from alerts.utils import (
    clear_doc_cache,
    send_alert
)


class Alert(Document):
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
            
            from_dt = get_datetime(self.from_date)
            until_dt = get_datetime(self.until_date) if self.until_date else None
            now = get_datetime(nowdate())
            
            if from_dt < now:
                throw(_("The alert from date must not be a past date."))
            if until_dt and until_dt <= now:
                throw(_("The alert until date must be of a future date."))
            if until_dt and from_dt >= until_dt:
                throw(_("The alert until date must be after the from date."))
            if not self.message:
                throw(_("A valid alert message is required."))
            if not self.for_roles and not self.for_users:
                throw(_("At least one recipient role or user is required."))
    
    
    def before_save(self):
        clear_doc_cache(self.doctype, self.name)
        self._set_defaults()
    
    
    def before_submit(self):
        self._set_status()
    
    
    def after_submit(self):
        if self.status == "Active":
            send_alert(self)
    
    
    def before_cancel(self):
        self.status = "Finished"
    
    
    def _set_defaults(self):
        if not self.is_new() or not self.from_date:
            return 0
        
        now = nowdate()
        
        if self.from_date and not self.until_date:
            self.until_date = add_to_date(now, months=1, as_string=True)
        
        self._set_status()
    
    
    def _set_status(self):
        if not self.from_date:
            return 0
        
        now = get_datetime()
        from_date = get_datetime(self.from_date)
        if from_date > now:
            self.status = "Pending"
        
        elif (
            from_date <= now and
            get_datetime(self.until_date) > now
        ):
            self.status = "Active"
        
        else:
            self.status = "Finished"
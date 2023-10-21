# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from datetime import datetime

from frappe import _
from frappe.utils import nowdate, add_to_date, get_datetime
from frappe.model.document import Document

from alerts.utils import (
    error,
    clear_document_cache,
    get_type_title,
    send_alert
)


class Alert(Document):
    def before_validate(self):
        self.set_defaults()
    
    
    def validate(self):
        if not self.alert_type:
            error(_("Please provide an alert type"))
        if not self.title:
            error(_("Please provide a title"))
        if not self.from_date:
            error(_("Please provide a from date"))
        if (
            self.is_new() and self.from_date and
            get_datetime(self.from_date) < get_datetime(nowdate())
        ):
            error(_("From date should be of today or a later date"))
        if (
            self.is_new() and self.until_date and
            get_datetime(self.until_date) <= get_datetime(nowdate())
        ):
            error(_("Until date should be later than from date"))
        if (
            self.from_date and self.until_date and
            get_datetime(self.from_date) >= get_datetime(self.until_date)
        ):
            error(_("Until should be later than from date"))
        if not self.message:
            error(_("Please provide a message"))
        if not self.for_roles and not self.for_users:
            error(_("Please provide at least one recipient role or user"))
    
    
    def before_save(self):
        if not self._defaults_set:
            self.set_defaults()
        else:
            self._defaults_set = None
        
        if not self.is_new() and not self.get_doc_before_save():
            self.load_doc_before_save()
        
        name = self.name
        if self.get_doc_before_save():
            name = self.get_doc_before_save().name
        
        clear_document_cache(self.doctype, name)
    
    
    def after_submit(self):
        send_alert(self.as_dict())
    
    
    def set_defaults(self):
        self._defaults_set = 1
        if self.alert_type and not self.title:
            self.title = get_type_title(self.alert_type)
        
        if not self.from_date:
            self.from_date = nowdate()
        
        if self.from_date and not self.until_date:
            self.until_date = add_to_date(self.from_date, months=1, as_string=True)
        
        now = get_datetime(nowdate())
        from_date = get_datetime(self.from_date)
        until_date = get_datetime(self.until_date)
        if from_date > now and until_date > now:
            self.status = "Pending"
        elif from_date <= now and until_date > now:
            self.status = "Active"
        elif from_date < now and until_date < now:
            self.status = "Finished"
        else:
            self.status = "Finished"
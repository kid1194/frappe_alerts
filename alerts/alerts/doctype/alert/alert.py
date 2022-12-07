# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from datetime import datetime

from frappe import _
from frappe.utils import add_to_date, get_datetime
from frappe.model.document import Document

from alerts.utils.common import error, clear_document_cache
from alerts.utils.type import get_type_title
from alerts.utils.alert import send_alert


class Alert(Document):
    def before_validate(self):
        self.set_defaults()
    
    
    def validate(self):
        if not self.alert_type:
            error(_("Alert type is mandatory"))
        if not self.from_date:
            error(_("From date is mandatory"))
        if (
            self.from_date and self.until_date and
            get_datetime(self.from_date) >= get_datetime(self.until_date)
        ):
            error(_("Until date must be of a later date"))
        if not self.content:
            error(_("Content is mandatory"))
    
    
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
        
        if self.from_date and not self.until_date:
            self.until_date = add_to_date(self.from_date, years=1, as_string=True)
        
        now = datetime.utcnow()
        if get_datetime(self.from_date) > now:
            self.status = "Pending"
        elif get_datetime(self.until_date) <= now:
            self.status = "Finished"
        else:
            self.status = "Active"

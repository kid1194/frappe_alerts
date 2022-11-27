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


class Alert(Document):
    def before_validate(self):
        self.set_defaults()
    
    
    def validate(self):
        if not self.alert_type:
            error(_("Alert type is mandatory"))
        if not self.from_date:
            error(_("From date is mandatory"))
        if not self.content:
            error(_("Content is mandatory"))
    
    
    def before_save(self):
        if not self.title or not self.until_date or not self.status:
            self.set_defaults()
        
        if not self.is_new() and not self.get_doc_before_save():
            self.load_doc_before_save()
        
        name = self.name
        if self.get_doc_before_save():
            name = self.get_doc_before_save().name
        
        clear_document_cache(self.doctype, name)
    
    
    def set_defaults(self):
        if self.alert_type and not self.title:
            self.title = get_type_title(self.alert_type)
        if self.from_date and not self.until_date:
            self.until_date = add_to_date(self.from_date, years=1, as_string=True)
        if self.is_new():
            self.status = "Pending" if get_datetime(self.from_date) > datetime.utcnow() else "Started"
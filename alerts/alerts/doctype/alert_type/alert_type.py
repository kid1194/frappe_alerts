# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _
from frappe.utils import cint
from frappe.model.document import Document

from alerts.utils.common import (
    error,
    clear_document_cache,
    is_doc_exist
)
from alerts.utils.files import delete_files


class AlertType(Document):
    def before_validate(self):
        if cint(self.alert_timeout) < 0:
            self.alert_timeout = 0
        
        if self.alert_sound != "Custom" and self.custom_alert_sound:
            if not self.is_new() and not self.get_doc_before_save():
                self.load_doc_before_save()
            
            name = self.name
            if self.get_doc_before_save():
                name = self.get_doc_before_save().name
            
            delete_files(self.doctype, name, [self.custom_alert_sound])
            self.custom_alert_sound = ""
        
        if cint(self.border_size) < 0:
            self.border_size = 0
    
    
    def validate(self):
        if not self.title:
            error(_("Title is mandatory"))
        if is_doc_exist(self.doctype, self.name):
            error(_("{0} already exist").format(self.name))
    
    
    def before_save(self):
        if not self.is_new() and not self.get_doc_before_save():
            self.load_doc_before_save()
        
        name = self.name
        if self.get_doc_before_save():
            name = self.get_doc_before_save().name
        
        clear_document_cache(self.doctype, name)
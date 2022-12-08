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
from alerts.utils.alert import is_alerts_for_type_exists


class AlertType(Document):
    def before_validate(self):
        if cint(self.display_priority) < 0:
            self.display_priority = 0
        
        if cint(self.display_timeout) < 0:
            self.display_timeout = 0
        
        if self.display_sound != "Custom":
            self.custom_display_sound = ""
    
    
    def validate(self):
        if not self.title:
            error(_("Please provide a valid title"))
        if is_doc_exist(self.doctype, self.name):
            error(_("{0} \"{1}\" already exist").format(self.doctype, self.name))
        if self.display_sound == "Custom" and not self.custom_display_sound:
            error(_("Please provide a valid custom display sound"))
    
    
    def before_save(self):
        if not self.is_new() and not self.get_doc_before_save():
            self.load_doc_before_save()
        
        name = self.name
        custom_display_sound = None
        if self.get_doc_before_save():
            name = self.get_doc_before_save().name
            custom_display_sound = self.get_doc_before_save().custom_display_sound
        
        if custom_display_sound and custom_display_sound != self.custom_display_sound:
            delete_files(self.doctype, name, [custom_display_sound])
        
        clear_document_cache(self.doctype, name)
    
    
    def on_trash(self):
        if is_alerts_for_type_exists(self.name):
            error(_("Cannot remove the alert type before removing the alerts that belongs to it."))
        elif self.custom_display_sound:
            delete_files(self.doctype, self.name, [self.custom_display_sound])
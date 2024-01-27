# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _, throw
from frappe.utils import cint
from frappe.model.document import Document

from alerts.utils import (
    clear_doc_cache,
    doc_count,
    delete_files,
    type_alerts_exists
)


class AlertType(Document):
    def before_validate(self):
        if cint(self.display_priority) < 0:
            self.display_priority = 0
        
        if cint(self.display_timeout) < 0:
            self.display_timeout = 0
        
        if self.display_sound != "Custom":
            self.custom_display_sound = None
    
    
    def validate(self):
        if not self.name:
            throw(_("A valid alert type name is required."))
        limit = 0 if self.is_new() else 1
        if doc_count(self.doctype, {"name": self.name}) != limit:
            throw(_("The alert type \"{0}\" already exists.").format(self.name))
        if self.display_sound == "Custom" and not self.custom_display_sound:
            throw(_("A valid alert type custom display sound is required."))
    
    
    def before_save(self):
        clear_doc_cache(self.doctype, self.name)
        
        if (old := self._get_old_doc()):
            old_name = self._get_old_name(old)
            if old_name:
                clear_doc_cache(self.doctype, old_name)
            
            if (
                old.custom_display_sound and
                old.custom_display_sound != self.custom_display_sound
            ):
                names = [self.name]
                if old_name:
                    names.append(old_name)
                
                delete_files(self.doctype, names, [old.custom_display_sound])
    
    
    def on_trash(self):
        if type_alerts_exists(self.name):
            throw(_("An alert type with existing linked alerts cannot be removed."))
        
        if self.custom_display_sound:
            delete_files(self.doctype, self.name, [self.custom_display_sound])
    
    
    def _get_old_doc(self):
        if self.is_new():
            return None
        
        doc = self.get_doc_before_save()
        if not doc:
            self.load_doc_before_save()
            doc = self.get_doc_before_save()
        
        return doc
    
    
    def _get_old_name(self, doc=None):
        if not doc:
            doc = self._get_old_doc()
        
        if doc and doc.name and doc.name != self.name:
            return doc.name
        
        return None
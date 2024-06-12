# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _
from frappe.utils import cint
from frappe.model.document import Document

from alerts.utils import clear_doc_cache


class AlertType(Document):
    _ignore_fields = ["display_priority"]
    _type_filter = {"fieldtype": ["in", ["Check", "Int", "Select", "Attach", "Color"]]}
    _int_types = ["Check", "Int"]
    
    
    def before_validate(self):
        self._check_app_status()
        self._set_defaults()
    
    
    def validate(self):
        if self.display_sound == "Custom":
            if not self.custom_display_sound:
                self._error(_("A valid custom display sound is required."))
            else:
                from alerts.utils import is_sound_file
                
                if not is_sound_file(self.custom_display_sound):
                    self._error(_("Custom display sound must be of a supported format (MP3, WAV, OGG)."))
    
    
    def before_rename(self, olddn, newdn, merge=False):
        self._check_app_status()
        clear_doc_cache(self.doctype, olddn)
        self._clean_flags()
    
    
    def before_save(self):
        clear_doc_cache(self.doctype, self.name)
        
        for f in self.meta.get("fields"):
            if (
                f.fieldname not in self._ignore_fields and
                self.has_value_changed(f.fieldname)
            ):
                self.flags.emit_change = 1
                self.flags.emit_action = "add" if self.is_new() else "change"
                break
        
        old = self._get_old_doc()
        if (
            old and old.custom_display_sound and
            old.custom_display_sound != self.custom_display_sound
        ):
            self._delete_files([self.name, old.name], old.custom_display_sound)
    
    
    def on_update(self):
        if self.flags.get("emit_change", 0):
            self._emit_change()
        
        self._clean_flags()
    
    
    def on_trash(self):
        from alerts.utils import type_alerts_exist
        
        if type_alerts_exist(self.name):
            self._error(_("Alert type with linked alerts can't be removed."))
        
        if self.custom_display_sound:
            self._delete_files()
        
        self.flags.emit_change = 1
        self.flags.emit_action = "trash"
    
    
    def after_delete(self):
        clear_doc_cache(self.doctype, self.name)
        if self.flags.get("emit_change", 0):
            self._emit_change()
        
        self._clean_flags()
    
    
    @property
    def _is_disabled(self):
        return cint(self.disabled) > 0
    
    
    @property
    def _display_priority(self):
        return cint(self.display_priority)
    
    
    @property
    def _display_timeout(self):
        return cint(self.display_timeout)
    
    
    def _set_defaults(self):
        if self._display_priority < 0:
            self.display_priority = 0
        if self._display_timeout < 0:
            self.display_timeout = 0
        if self.display_sound != "Custom":
            self.custom_display_sound = None
    
    
    def _emit_change(self):
        from alerts.utils import emit_type_changed
        
        data = {
            "name": self.name,
            "action": self.flags.get("emit_action", "change")
        }
        if data["action"] != "trash":
            for f in self.meta.get("fields", self._type_filter):
                if f.fieldname not in self._ignore_fields:
                    data[f.fieldname] = self.get(f.fieldname)
        
        emit_type_changed(data)
    
    
    def _get_old_doc(self):
        if self.is_new():
            return None
        doc = self.get_doc_before_save()
        if not doc:
            self.load_doc_before_save()
            doc = self.get_doc_before_save()
        return doc
    
    
    def _delete_files(self, name=None, files=None):
        from alerts.utils import delete_files
        
        delete_files(self.doctype, name or self.name, files or self.custom_display_sound)
    
    
    def _check_app_status(self):
        if not self.flags.get("status_checked", 0):
            from alerts.utils import check_app_status
            
            check_app_status()
            self.flags.status_checked = 1
    
    
    def _clean_flags(self):
        keys = [
            "emit_change",
            "emit_action",
            "status_checked"
        ]
        for i in range(len(keys)):
            self.flags.pop(keys.pop(0), 0)
    
    
    def _error(self, msg):
        from alerts.utils import error
        
        self._clean_flags()
        error(msg, _(self.doctype))
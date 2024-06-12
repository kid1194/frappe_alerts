# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _
from frappe.utils import cint
from frappe.model.document import Document


class AlertsSettings(Document):
    def before_validate(self):
        if self.update_notification_receivers:
            exist = []
            remove = []
            for v in self.update_notification_receivers:
                if v.user in exist:
                    remove.append(v)
                else:
                    exist.append(v.user)
            
            exist.clear()
            if remove:
                for i in range(len(remove)):
                    self.update_notification_receivers.remove(remove.pop(0))
    
    
    def validate(self):
        if self._use_fallback_sync and self._fallback_sync_delay < 1:
            self._add_error(_("Fallback sync delay must be greater than or equals to 1 minute."))
        if self._send_update_notification:
            if not self.update_notification_sender:
                self._add_error(_("A valid update notification sender is required."))
            if not self.update_notification_receivers:
                self._add_error(_("At least one valid update notification receiver is required."))
        
        self._throw_errors()
    
    
    def before_save(self):
        from alerts.utils import clear_doc_cache
        
        clear_doc_cache(self.doctype)
        if self.has_value_changed("is_enabled"):
            self.flags.emit_change = 1
    
    
    def after_save(self):
        if self.flags.get("emit_change", 0):
            from alerts.utils import emit_status_changed
            
            emit_status_changed({
                "is_enabled": 1 if self._is_enabled else 0,
                "use_fallback_sync": 1 if self._use_fallback_sync else 0,
                "fallback_sync_delay": self._fallback_sync_delay
            })
        
        self._clean_flags()
    
    
    @property
    def _is_enabled(self):
        return cint(self.is_enabled) > 0
    
    
    @property
    def _use_fallback_sync(self):
        return cint(self.use_fallback_sync) > 0
    
    
    @property
    def _fallback_sync_delay(self):
        return cint(self.fallback_sync_delay)
    
    
    @property
    def _auto_check_for_update(self):
        return cint(self.auto_check_for_update) > 0
    
    
    @property
    def _send_update_notification(self):
        return cint(self.send_update_notification) > 0
    
    
    def _clean_flags(self):
        keys = [
            "error_list",
            "emit_change"
        ]
        for i in range(len(keys)):
            self.flags.pop(keys.pop(0), 0)
    
    
    def _add_error(self, msg):
        if not self.flags.get("error_list", 0):
            self.flags.error_list = []
        self.flags.error_list.append(msg)
    
    
    def _throw_errors(self):
        if self.flags.get("error_list", 0):
            from alerts.utils import error
            
            msg = self.flags.error_list
            if len(msg) == 1:
                msg = msg.pop(0)
            else:
                msg = msg.copy()
            
            self._clean_flags()
            error(msg, _(self.doctype))
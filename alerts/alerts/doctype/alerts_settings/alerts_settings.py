# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _
from frappe.utils import cint
from frappe.model.document import Document

from alerts.utils import error


class AlertsSettings(Document):
    def before_validate(self):
        if self.update_notification_receivers:
            existing = []
            for v in self.update_notification_receivers:
                if v.user in existing:
                    self.update_notification_receivers.remove(v)
                else:
                    existing.append(v.user)
    
    
    def validate(self):
        if cint(self.send_update_notification):
            self._check_sender()
            self._check_receivers()
    
    
    def before_save(self):
        from alerts.utils import clear_doc_cache
        
        clear_doc_cache(self.doctype)
    
    
    def after_save(self):
        if self.has_value_changed("is_enabled"):
            from alerts.utils import emit_app_status_changed
            
            emit_app_status_changed({"is_enabled": cint(self.is_enabled)})
    
    
    def _check_sender(self):
        if not self.update_notification_sender:
            error(_("A valid update notification sender is required."))
        
        from alerts.utils import is_doc_exists
        
        if not is_doc_exists("User", self.update_notification_sender):
            error(_("The update notification sender selected does not exist."))
    
    
    def _check_receivers(self):
        if not self.update_notification_receivers:
            error(_("At least one enabled update notification receiver is required."))
        
        from alerts.utils import doc_count
        
        users = [v.user for v in self.update_notification_receivers]
        total = len(users)
        if doc_count("User", {"name": ["in", users]}) != total:
            if total > 1:
                error(_("Some of the selected update notification receivers does not exist."))
            else:
                error(_("The selected update notification receiver does not exist."))
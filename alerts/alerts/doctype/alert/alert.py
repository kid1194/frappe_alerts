# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe import _
from frappe.utils import cint
from frappe.model.document import Document

from alerts.utils import (
    AlertStatus,
    clear_doc_cache
)


class Alert(Document):
    def before_validate(self):
        self._check_app_status()
        if self._is_draft:
            self._set_defaults()
    
    
    def validate(self):
        if self._is_draft:
            if not self.title:
                self._add_error(_("A valid title is required."))
            if not self.alert_type:
                self._add_error(_("A valid alert type is required."))
            self._validate_date()
            if not self.message:
                self._add_error(_("A valid message is required."))
            if not self.for_roles and not self.for_users:
                self._add_error(_("At least one recipient role or user is required."))
            
            self._throw_errors()
    
    
    def before_save(self):
        clear_doc_cache(self.doctype, self.name)
    
    
    def before_submit(self):
        from frappe.utils import getdate
        
        today = getdate()
        if today > getdate(self.until_date):
            self._error(_("Alert display from and until dates has already passed."))
        
        clear_doc_cache(self.doctype, self.name)
        if self.status == AlertStatus.d:
            self.status = AlertStatus.p
        
        if self.status == AlertStatus.p and getdate(self.from_date) <= today:
            self.status = AlertStatus.a
            self.flags.send_alert = 1
    
    
    def on_update(self):
        self._send_alert()
        self._clean_flags()
    
    
    def before_update_after_submit(self):
        clear_doc_cache(self.doctype, self.name)
        if self.has_value_changed("status") and self._is_active:
            self.flags.send_alert = 1
    
    
    def on_update_after_submit(self):
        self._send_alert()
        self._clean_flags()
    
    
    def before_cancel(self):
        clear_doc_cache(self.doctype, self.name)
        self.status = AlertStatus.c
    
    
    def on_cancel(self):
        self._clean_flags()
    
    
    @property
    def _is_draft(self):
        return cint(self.docstatus) == 0
    
    
    @property
    def _is_submitted(self):
        return cint(self.docstatus) == 1
    
    
    @property
    def _is_pending(self):
        return self.status == AlertStatus.p
    
    
    @property
    def _is_active(self):
        return self.status == AlertStatus.a
    
    
    @property
    def _is_repeatable(self):
        return cint(self.is_repeatable) > 0
    
    
    @property
    def _number_of_repeats(self):
        return cint(self.number_of_repeats)
    
    
    def _set_defaults(self):
        if not self.from_date:
            from frappe.utils import nowdate
            
            self.from_date = nowdate()
        if not self.until_date:
            self.until_date = self.from_date
        if not self._is_repeatable or self._number_of_repeats < 1:
            self.number_of_repeats = 1
        if not self.status or self.status != AlertStatus.d:
            self.status = AlertStatus.d
    
    
    def _validate_date(self):
        if not self.from_date:
            self._add_error(_("A valid from date is required."))
        if not self.until_date:
            self._add_error(_("A valid until date is required."))
        if (
            self.from_date and self.until_date and (
                self.is_new() or
                self.has_value_changed("from_date") or
                self.has_value_changed("until_date")
            )
        ):
            from frappe.utils import getdate
            
            if getdate(self.from_date) > getdate(self.until_date):
                self._add_error(_("Until date must be later than or equals to \"From Date\"."))
    
    
    def _send_alert(self):
        if self.flags.get("send_alert", 0):
            from alerts.utils import send_alert
            
            data = {
                "name": self.name,
                "title": self.title,
                "alert_type": self.alert_type,
                "message": self.message,
                "is_repeatable": 1 if self._is_repeatable else 0,
                "number_of_repeats": self._number_of_repeats,
                "users": [v.user for v in self.for_users],
                "roles": [v.role for v in self.for_roles],
                "seen_by": {},
                "seen_today": []
            }
            
            if self.seen_by:
                from frappe.utils import nowdate
                
                today = nowdate()
                for v in self.seen_by:
                    if v.user not in data["seen_by"]:
                        data["seen_by"][v.user] = 1
                    else:
                        data["seen_by"][v.user] += 1
                    if v.user not in data["seen_today"] and v.date == today:
                        data["seen_today"].append(v.user)
            
            send_alert(data)
    
    
    def _check_app_status(self):
        if not self.flags.get("status_checked", 0):
            from alerts.utils import check_app_status
            
            check_app_status()
            self.flags.status_checked = 1
    
    
    def _clean_flags(self):
        keys = [
            "error_list",
            "send_alert",
            "status_checked"
        ]
        for i in range(len(keys)):
            self.flags.pop(keys.pop(0), 0)
    
    
    def _add_error(self, msg):
        if not self.flags.get("error_list", 0):
            self.flags.error_list = []
        self.flags.error_list.append(msg)
    
    
    def _throw_errors(self):
        if self.flags.get("error_list", 0):
            msg = self.flags.error_list
            if len(msg) == 1:
                msg = msg.pop(0)
            else:
                msg = msg.copy()
            
            self._error(msg)
    
    
    def _error(self, msg):
        from alerts.utils import error
        
        self._clean_flags()
        error(msg, _(self.doctype))
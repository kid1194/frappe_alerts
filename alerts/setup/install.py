# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


import frappe
from frappe.utils import now
from frappe.utils.user import get_system_managers

from alerts import __version__


# [Hooks]
def after_sync():
    frappe.clear_cache()
    
    from alerts.utils.settings import settings
    from alerts.utils.type import add_type
    
    types = [
        {
            "name": "Urgent",
            "display_priority": 10,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#DC3545",
            "border_color": "#A71D2A",
            "title_color": "#FFFFFF",
            "content_color": "#FFFFFF"
        },
        {
            "name": "Warning",
            "display_priority": 5,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#FFC107",
            "border_color": "#BA8B00",
            "title_color": "#000000",
            "content_color": "#000000"
        },
        {
            "name": "Notice",
            "display_priority": 0,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#17A2B8",
            "border_color": "#0F6674",
            "title_color": "#FFFFFF",
            "content_color": "#FFFFFF"
        }
    ]
    for data in types:
        add_type(data)
    
    doc = settings()
    managers = get_system_managers(only_name=True)
    if managers:
        idx = 0
        if "Administrator" in managers:
            idx = managers.index("Administrator")
        
        doc.update_notification_sender = managers[idx]
        
        if doc.update_notification_receivers:
            doc.update_notification_receivers.clear()
        
        for manager in managers:
            doc.append(
                "update_notification_receivers",
                {"user": manager}
            )
        
        if not doc.update_notification_receivers:
            doc.send_update_notification = 0
        else:
            doc.send_update_notification = 1
            
    else:
        doc.send_update_notification = 0
    
    doc.current_version = __version__
    doc.latest_version = __version__
    doc.latest_check = now()
    doc.has_update = 0
        
    doc.save(ignore_permissions=True)
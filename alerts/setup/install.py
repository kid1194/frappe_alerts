# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from frappe.utils import now
from frappe.utils.user import get_system_managers

from alerts import __version__

from alerts.utils.type import add_type


# [Hooks]
def after_install():
    types = [
        {
            "name": "Urgent",
            "display_priority": 10,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#DC3545",
            "border_color": "#A71D2A",
            "title_color": "#FFF",
            "content_color": "#FFF"
        },
        {
            "name": "Warning",
            "display_priority": 5,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#FFC107",
            "border_color": "#BA8B00",
            "title_color": "#000",
            "content_color": "#000"
        },
        {
            "name": "Notice",
            "display_priority": 0,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#17A2B8",
            "border_color": "#0F6674",
            "title_color": "#FFF",
            "content_color": "#FFF"
        }
    ]
    for data in types:
        add_type(data)
    
    doc = settings()
    
    if (managers := get_system_managers(only_name=True)):
        doc.auto_check_for_update = 1
        doc.send_update_notification = 1
        
        if "Administrator" in managers:
            sender = "Administrator"
        else:
            sender = managers[0]
        
        doc.update_notification_sender = sender
        
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
        doc.auto_check_for_update = 0
        doc.send_update_notification = 0
    
    doc.current_version = __version__
    doc.latest_version = __version__
    doc.latest_check = now()
    doc.has_update = 0
        
    doc.save(ignore_permissions=True)
# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from .version import is_version_gt


app_name = "alerts"
app_title = "Alerts"
app_publisher = "Ameen Ahmed (Level Up)"
app_description = "Frappe app that displays custom alerts to specific recipients."
app_icon = "octicon octicon-bell"
app_color = "blue"
app_email = "kid1194@gmail.com"
app_license = "MIT"


app_include_js = [
    'alerts.bundle.js'
] if is_version_gt(13) else [
    '/assets/alerts/js/alerts.js'
]


after_sync = "alerts.setup.install.after_sync"
after_migrate = "alerts.setup.migrate.after_migrate"


extend_bootinfo = "alerts.utils.boot.extend"


scheduler_events = {
    "daily": [
        "alerts.utils.alert.update_alerts",
        "alerts.utils.update.auto_check_for_update"
    ]
}
# Alerts © 2022
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from alerts.utils.type import add_type


def after_install():
    types = [
        {
            "title": "Urgent",
            "display_priority": 10,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#DC3545",
            "border_color": "#A71D2A",
            "title_color": "#FFF",
            "content_color": "#FFF"
        },
        {
            "title": "Warning",
            "display_priority": 5,
            "display_timeout": 5,
            "display_sound": "Alert",
            "background": "#FFC107",
            "border_color": "#BA8B00",
            "title_color": "#000",
            "content_color": "#000"
        },
        {
            "title": "Notice",
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
# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


# [Hooks]
def on_login(login_manager):
    from .alert import enqueue_alerts
    from .type import enqueue_types
    
    enqueue_types()
    enqueue_alerts(login_manager.user)
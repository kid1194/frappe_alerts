/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.listview_settings');


frappe.listview_settings['Alert Type'] = {
    onload: function(list) {
        frappe.alerts.on('ready change', function() { this.setup_list(list); });
    },
    get_indicator: function(doc) {
        return cint(doc.disabled) > 0
            ? ['Disabled', 'red', 'disabled,=,1|docstatus,=,0']
            : ['Enabled', 'green', 'disabled,=,0|docstatus,=,0'];
    },
};
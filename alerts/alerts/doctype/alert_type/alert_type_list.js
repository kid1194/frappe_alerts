/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.listview_settings');


frappe.listview_settings['Alert Type'] = {
    onload: function(list) {
        frappe.alerts.on('ready change', function() {
            this.setup_list();
        });
        
        try {
            list.orig_get_args = list.get_args;
            list.get_args = function() {
                var args = this.orig_get_args(),
                dt = this.doctype;
                if (dt === 'Alert Type') {
                    dt = frappe.model.get_full_column_name('disabled', dt);
                    if (args.fields.indexOf(dt) < 0) args.fields.push(dt);
                }
                return args;
            };
            list.setup_columns();
            list.refresh(true);
        } catch(e) {
            frappe.alerts._error('Alert Type List: Onload error', e.message, e.stack);
        }
    },
    get_indicator: function(doc) {
        return cint(doc.disabled) > 0
            ? ['Disabled', 'red', 'disabled,=,1|docstatus,=,0']
            : ['Enabled', 'green', 'disabled,=,0|docstatus,=,0'];
    },
};
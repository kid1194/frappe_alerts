/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.listview_settings');


frappe.listview_settings['Alert Type'] = {
    onload: function(list) {
        frappe.alerts
            .on('ready', function() {
                frappe.dom.unfreeze();
                if (!this.is_enabled)
                    frappe.dom.freeze(
                        '<strong class="text-danger">'
                        + __('Alerts app has been disabled.')
                        + '</strong>'
                    );
            })
            .on('change', function() {
                frappe.dom.unfreeze();
                if (!this.is_enabled)
                    frappe.dom.freeze(
                        '<strong class="text-danger">'
                        + __('Alerts app has been disabled.')
                        + '</strong>'
                    );
            });
        
        try {
            list.orig_get_args = list.get_args;
            list.get_args = function() {
                var args = this.orig_get_args();
                if (this.doctype === 'Alert Type') {
                    var field = frappe.model.get_full_column_name('disabled', this.doctype);
                    if (args.fields.indexOf(field) < 0) args.fields.push(field);
                }
                return args;
            };
            list.setup_columns();
            list.refresh(true);
        } catch(e) {
            console.error('[Alerts][Alert Type List]: Onload error', e.message, e.stack);
        }
    },
    get_indicator: function(doc) {
        return cint(doc.disabled)
            ? ['Disabled', 'red', 'disabled,=,1']
            : ['Enabled', 'green', 'disabled,=,0'];
    },
};
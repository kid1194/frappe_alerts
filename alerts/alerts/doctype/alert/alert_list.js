/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.listview_settings');


frappe.listview_settings['Alert'] = {
    hide_name_column: true,
    onload: function(list) {
        try {
            list.orig_get_args = list.get_args;
            list.get_args = function() {
                var args = this.orig_get_args(),
                dt = this.doctype;
                if (!args.fields) args.fields = [];
                if (dt === 'Alert') {
                    $.each(['reached', 'status'], function(i, k) {
                        let field = frappe.model.get_full_column_name(k, dt);
                        if (args.fields.indexOf(field) < 0) args.fields.push(field);
                    });
                }
                return args;
            };
            list.setup_columns();
            list.refresh(true);
        } catch(e) {
            console.error('[Alerts][Alert List]: Onload error', e.message, e.stack);
        }
    },
    get_indicator: function(doc) {
        var docstatus = cint(doc.docstatus);
        if (docstatus === 2)
            return ['Cancelled', 'red', 'docstatus,=,2'];
        
        var status = cstr(doc.status);
        return [
            status,
            {
                'pending': 'gray',
                'active': 'green',
                'finished': 'blue',
            }[status.toLowerCase()],
            'status,=,\'' + status + '\'|docstatus,=,' + docstatus
        ];
    },
    formatters: {
        is_repeatable: function(v) {
            return __(cint(v) ? 'Yes' : 'No');
        },
        reached: function(v, df, doc) {
            return cint(doc.docstatus) > 0 ? cint(v) || 0 : 0;
        },
    },
};
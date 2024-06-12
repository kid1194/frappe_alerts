/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.listview_settings');


frappe.listview_settings['Alert'] = {
    hide_name_column: true,
    add_fields: ['status'],
    onload: function(list) {
        frappe.alerts.on('ready change', function() { this.setup_list(list); });
    },
    get_indicator: function(doc) {
        var status = cstr(doc.status),
        docstatus = cint(doc.docstatus);
        return [
            __(status),
            {
                'draft': 'gray',
                'pending': 'orange',
                'active': 'green',
                'finished': 'blue',
                'cancelled': 'red',
            }[status.toLowerCase()],
            'status,=,\'' + status + '\'|docstatus,=,' + docstatus
        ];
    },
    formatters: {
        is_repeatable: function(v) {
            return cint(v) > 0 ? __('Yes') : __('No');
        },
        reached: function(v, df, doc) {
            return cint(doc.reached);
        },
    },
};
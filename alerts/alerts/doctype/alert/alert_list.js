/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.listview_settings');


frappe.listview_settings['Alert'] = {
    add_fields: ['reached'],
    hide_name_column: true,
    get_indicator: function(doc) {
        if (cint(doc.docstatus) === 2) {
            return ['Cancelled', 'red', 'docstatus,=,2'];
        }
        var docstatus = cint(doc.docstatus) === 0 ? 0 : 1,
        status = docstatus === 0 ? 'Pending' : doc.status;
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
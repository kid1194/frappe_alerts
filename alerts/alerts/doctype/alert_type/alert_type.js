/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    refresh: function(frm) {
        frm.trigger('load_toolbar');
    },
    load_toolbar: function(frm) {
        let btn = __('Preview');
        if (frm.custom_buttons[btn]) return;
        frm.add_custom_button(btn, function() {
            frappe.alerts.mock().build(frm.doc);
        });
        frm.change_custom_button_type(btn, null, 'info');
    },
});
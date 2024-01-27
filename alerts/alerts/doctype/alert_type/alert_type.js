/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    setup: function(frm) {
        frappe.alerts.on('ready change', function() {
            this.setup_form(frm);
        });
    },
    refresh: function(frm) {
        frm.trigger('load_toolbar');
    },
    validate: function(frm) {
        if (
            cstr(frm.doc.display_sound) === 'Custom'
            && !cstr(frm.doc.custom_display_sound).length
        ) {
            frappe.alerts.error('A valid alert type custom display sound is required.');
            return false;
        }
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
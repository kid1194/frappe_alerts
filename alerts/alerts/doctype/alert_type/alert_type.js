/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    setup: function(frm) {
        frappe.alerts
            .init_form(frm)
            .on('ready change', function() {
                this.setup_form(frm);
            });
    },
    refresh: function(frm) {
        frm.events.setup_toolbar(frm);
    },
    disabled: function(frm) {
        frm.events.setup_toolbar(frm);
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
    setup_toolbar: function(frm) {
        var label = __('Preview');
        if (!!cint(frm.doc.disabled)) {
            if (frm.custom_buttons[label]) {
                frm.custom_buttons[label].remove();
                delete frm.custom_buttons[label];
            }
            return;
        }
        if (frm.custom_buttons[label]) return;
        frm.add_custom_button(label, function() {
            frappe.alerts.mock().build(frm.doc);
        });
        frm.change_custom_button_type(label, null, 'info');
    },
});
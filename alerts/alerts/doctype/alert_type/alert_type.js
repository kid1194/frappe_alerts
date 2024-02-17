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
        frm._type = {
            ready: 0
        };
    },
    refresh: function(frm) {
        if (!frm._type.ready) frm.trigger('load_toolbar');
    },
    disabled: function(frm) {
        frm.trigger('load_toolbar');
    },
    validate: function(frm) {
        if (
            !cint(frm.doc.disabled)
            && cstr(frm.doc.display_sound) === 'Custom'
            && !cstr(frm.doc.custom_display_sound).length
        ) {
            frappe.alerts.error('A valid alert type custom display sound is required.');
            return false;
        }
    },
    load_toolbar: function(frm) {
        frm._type.ready = 1;
        let label = __('Preview');
        if (frm.custom_buttons[label]) {
            if (cint(frm.doc.disabled)) {
                frm.custom_buttons[label].remove();
                delete frm.custom_buttons[label];
            }
            return;
        }
        if (cint(frm.doc.disabled)) return;
        frm.add_custom_button(label, function() {
            frappe.alerts.mock().build(frm.doc);
        });
        frm.change_custom_button_type(label, null, 'info');
    },
});
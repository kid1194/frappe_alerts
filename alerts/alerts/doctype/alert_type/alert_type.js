/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    refresh: function(frm) {
        frm.trigger('load_toolbar');
    },
    load_toolbar: function(frm) {
        let preview_btn = __('Preview');
        if (!frm.custom_buttons[preview_btn]) {
            frm.add_custom_button(preview_btn, function() {
                if (!frm._mock) frm._mock = frappe.Alerts.mock();
                frm._mock.build(frm.doc);
            });
            frm.change_custom_button_type(preview_btn, null, 'info');
        }
    },
});
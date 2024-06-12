/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert Type', {
    setup: function(frm) {
        frappe.alerts
            .on('ready change', function() { this.setup_form(frm); })
            .on('on_alert', function(d, t) {
                frm._type.errs.includes(t) && (d.title = __(frm.doctype));
            });
        frm._type = {
            errs: ['fatal', 'error'],
        };
    },
    refresh: function(frm) {
        if (!frm._type.toolbar) {
            frm.events.toggle_toolbar(frm);
            frm._type.toolbar = 1;
        }
    },
    disabled: function(frm) {
        frm.events.toggle_toolbar(frm);
    },
    validate: function(frm) {
        if (cstr(frm.doc.display_sound) === 'Custom') {
            if (!frappe.alerts.$isStrVal(frm.doc.custom_display_sound)) {
                frappe.alerts.fatal(__('A valid custom display sound is required.'));
                return false;
            }
            if (!(/\.(mp3|wav|ogg)$/i).test(frm.doc.custom_display_sound)) {
                frappe.alerts.fatal(__('Custom display sound must be of a supported format (MP3, WAV, OGG).'));
                return false;
            }
        }
    },
    after_save: function(frm) {
        frm.events.toggle_toolbar(frm);
    },
    toggle_toolbar: function(frm) {
        var label = __('Preview'),
        del = frm.is_new() || cint(frm.doc.disabled) > 0;
        if (frm.custom_buttons[label]) {
            if (!del) return;
            frm.custom_buttons[label].remove();
            delete frm.custom_buttons[label];
        }
        if (del || frm.custom_buttons[label]) return;
        frm.add_custom_button(label, function() {
            frappe.alerts.mock().build(frm.doc);
        });
        frm.change_custom_button_type(label, null, 'info');
    },
});
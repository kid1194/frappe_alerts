/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alerts Settings', {
    setup: function(frm) {
        frm._settings = {ready: false};
    },
    refresh: function(frm) {
        if (!frm._settings.ready) frm.trigger('setup_update_note');
    },
    check_for_update: function(frm) {
        if (cint(frm.doc.is_enabled))
            frappe.alerts.request(
                'check_for_update',
                null,
                function(ret) {
                    if (ret) {
                        frm._settings.ready = false;
                        frm.reload_doc();
                    }
                }
            );
    },
    validate: function(frm) {
        if (
            cint(frm.doc.is_enabled)
            && cint(frm.doc.send_update_notification)
        ) {
            if (!cstr(frm.doc.update_notification_sender).length) {
                frappe.throw(__('A valid update notification sender is required.'));
                return false;
            }
            if (!(frm.doc.update_notification_receivers || []).length) {
                frappe.throw(__('At least one valid update notification receiver is required.'));
                return false;
            }
        }
    },
    setup_update_note: function(frm) {
        frm._settings.ready = true;
        let has_update = cint(frm.doc.has_update) > 0,
        list = [
            '<li><strong>' + __('Status') + ':</strong> '
                + (has_update
                    ? '<strong class="text-danger">'
                        + __('A new version is available')
                    + '</strong>'
                    : __('App is up to date')
                )
            + '</li>',
            '<li><strong>' + __('Current Version') + ':</strong> '
                + cstr(frm.doc.current_version)
            + '</li>'
        ];
        if (has_update)
            list.push(
                '<li><strong>' + __('Latest Version') + ':</strong> '
                    + cstr(frm.doc.latest_version)
                + '</li>'
            );
        list.push(
            '<li><strong>' + __('Latest Check') + ':</strong> '
                + frappe.datetime.user_to_str(frm.doc.latest_check)
            + '</li>'
        );
        
        frm.get_field('update_note').$wrapper
            .empty().append($('<ul>').append(list));
    },
});
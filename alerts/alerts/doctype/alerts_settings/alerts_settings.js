/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alerts Settings', {
    onload: function(frm) {
        frappe.alerts.on('on_alert', function(d, t) {
            frm._sets.errs.includes(t) && (d.title = __(frm.doctype));
        });
        frm._sets = {
            errs: ['fatal', 'error'],
            update: 0,
        };
    },
    refresh: function(frm) {
        !frm._sets.update && frm.events.setup_update_note(frm);
    },
    check_for_update: function(frm) {
        frappe.alerts.request('check_for_update', null, function(ret) {
            if (!ret) return;
            frm._sets.update = 0;
            frm.reload_doc();
        });
    },
    validate: function(frm) {
        let err = [];
        if (cint(frm.doc.use_fallback_sync)) {
            if (cint(frm.doc.fallback_sync_delay) < 1)
                err.push(__('Fallback sync delay must be greater than or equals to 1 minute.'));
        }
        if (cint(frm.doc.send_update_notification)) {
            if (!frappe.alerts.$isStrVal(frm.doc.update_notification_sender))
                err.push(__('A valid update notification sender is required.'));
            if (!frappe.alerts.$isArrVal(frm.doc.update_notification_receivers))
                err.push(__('At least one valid update notification receiver is required.'));
        }
        if (err.length) {
            frappe.alerts.fatal(err);
            return false;
        }
    },
    setup_update_note: function(frm) {
        frm._sets.update = 1;
        frm.get_field('update_note').$wrapper.empty().append('\
<ul class="list-unstyled">\
    ' + (cint(frm.doc.has_update) > 0
        ? '\
    <li>\
        <strong>' + __('Status') + ':</strong> \
        <span class="text-danger">' + __('New version available') + '</span>\
    </li>\
    <li>\
        <strong>' + __('Latest Version') + ':</strong> \
        <span class="text-danger">' + frm.doc.latest_version + '</span>\
    </li>\
            '
        : '\
    <li>\
        <strong>' + __('Status') + ':</strong> \
        ' + __('App is up to date') + '\
    </li>\
    ') + '\
    <li>\
        <strong>' + __('Current Version') + ':</strong> \
        ' + frm.doc.current_version + '\
    </li>\
    <li>\
        <strong>' + __('Latest Check') + ':</strong> \
        ' + frappe.datetime.user_to_str(frm.doc.latest_check) + '\
    </li>\
</ul>\
        ');
    },
});
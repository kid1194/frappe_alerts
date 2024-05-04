/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alerts Settings', {
    refresh: function(frm) {
        frm.trigger('setup_update_note');
    },
    update_notification_receivers: function(frm) {
        var key = 'update_notification_receivers',
        field = frm.get_field(key);
        if (!field || !frappe.alerts.$isArrVal(field._rows_list)) return;
        var rows = field._rows_list.slice(),
        exist = [],
        keep = [],
        i = 0,
        l = rows.length;
        for (; i < l; i++) {
            if (!exist.includes(rows[i])) {
                exist.push(rows[i]);
                keep.push(field.rows[i]);
            }
        }
        if (!keep.length || keep.length === field.rows.length)
            frappe.alerts.valid_field(frm, key);
        else {
            frm.set_value(key, keep);
            frappe.alerts.invalid_field(
                frm, key,
                __('The update notification receiver has already been selected.')
            );
        }
    },
    check_for_update: function(frm) {
        frappe.alerts.request(
            'check_for_update',
            null,
            function(ret) {
                if (ret) frm.reload_doc();
            }
        );
    },
    validate: function(frm) {
        if (!!cint(frm.doc.send_update_notification)) {
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
        var status;
        if (cint(frm.doc.has_update) > 0)
            status = '<dd class="col-9 col-sm-7 text-danger">\
                ' + __('A new version is available') + '\
            </dd>\
            <dt class="col-3 col-sm-5">' + __('Latest Version') + ':</dt>\
            <dd class="col-9 col-sm-7 text-danger">' + cstr(frm.doc.latest_version) + '</dd>';
        else
            status = '<dd class="col-9 col-sm-7">\
                ' + __('App is up to date') + '\
            </dd>';
        
        frm.get_field('update_note').$wrapper.empty().append('\
        <dl class="row">\
            <dt class="col-3 col-sm-5">' + __('Status') + ':</dt>\
            ' + status + '\
            <dt class="col-3 col-sm-5">' + __('Current Version') + ':</dt>\
            <dd class="col-9 col-sm-7">' + cstr(frm.doc.current_version) + '</dd>\
            <dt class="col-3 col-sm-5">' + __('Latest Check') + ':</dt>\
            <dd class="col-9 col-sm-7">\
                ' + frappe.datetime.convert_to_system_tz(frm.doc.latest_check) + '\
            </dd>\
        </dl>\
        ');
    },
});
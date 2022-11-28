/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert', {
    setup: function(frm) {
        frm.A = {
            is_draft: cint(frm.doc.docstatus) == 0,
            is_submitted: cint(frm.doc.docstatus) == 1,
            is_cancelled: cint(frm.doc.docstatus) == 2,
        };
    },
    onload: function(frm) {
        if (!frm.A.is_draft) {
            frm.disable_form();
            frm.set_intro(
                __(
                    '{0} has been {1}',
                    [
                        frm.doctype,
                        frm.A.is_submitted ? 'submitted' : 'cancelled'
                    ]
                ),
                frm.A.is_submitted ? 'green' : 'red'
            );
            
            let $wrapper = frm.get_field('seen_by_html').$wrapper;
            $.each(frm.doc.seen_by, function(i, v) {
                $wrapper.append('<div class="btn btn-info m-1">' + v.user + '</div>');
            });
            frappe.socketio.init();
            frappe.realtime.on('alert_seen', function(ret) {
                if ($.isPlainObject(ret)) ret = ret.message || ret;
                if ($.isPlainObject(ret) && ret.user) {
                    frm.get_field('seen_by_html').$wrapper
                    .append('<div class="btn btn-info m-1">' + ret.user + '</div>');
                }
            });
            return;
        }
        
        frm.set_query('alert_type', {filters: {is_group: 0}});
        
        frm.add_fetch('alert_type', 'title', 'title', frm.doctype);
        
        let today = frappe.datetime.moment_to_date_obj(moment());
        frm.set_df_property('from_date', 'options', {
            startDate: today,
            minDate: today
        });
    },
    from_date: function(frm) {
        if (!frm.doc.from_date || !frm.doc.until_date) return;
        if (
            moment(
                frm.doc.until_date,
                frappe.defaultDateFormat
            ).diff(
                moment(
                    frm.doc.from_date,
                    frappe.defaultDateFormat
                ),
                'days'
            ) < 1
        ) {
            Alerts.error('From date must be of an earlier date');
            frm.set_value('from_date', '');
        }
    },
    until_date: function(frm) {
        if (!frm.doc.from_date || !frm.doc.until_date) return;
        if (
            moment(
                frm.doc.until_date,
                frappe.defaultDateFormat
            ).diff(
                moment(
                    frm.doc.from_date,
                    frappe.defaultDateFormat
                ),
                'days'
            ) < 1
        ) {
            Alerts.error('Until date must be of a later date');
            frm.set_value('until_date', '');
        }
    },
});
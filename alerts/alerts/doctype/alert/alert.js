/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert', {
    setup: function(frm) {
        frappe.alerts
            .init_form(frm)
            .on('ready change', function() {
                this.setup_form(frm);
            });
        frm._alert = {
            is_draft: false,
            is_submitted: false,
            is_cancelled: false,
            in_validate: 0,
            mindate: moment(),
            to_date: function(v) {
                return moment(cstr(v), frappe.defaultDateFormat);
            },
            from_datetime: function(v) {
                v = moment(cstr(v), frappe.defaultDatetimeFormat);
                v = v.format(frappe.defaultDateFormat);
                return frm._alert.to_date(v);
            },
            mindate_obj: function() {
                return frappe.datetime.moment_to_date_obj(frm._alert.mindate);
            }
        };
    },
    onload: function(frm) {
        frm.events.on_load(frm);
        
        if (frm._alerts.app_disabled || !frm._alert.is_draft) return;
        frm.set_query('role', 'for_roles', function(doc, cdt, cdn) {
            var qry = {filters: {disabled: 0, desk_access: 1}};
            if ((doc.for_roles || '').length) {
                qry.filters.name = ['notin', []];
                for (var i = 0, l = doc.for_roles.length; i < l; i++)
                    qry.filters.name[1][i] = doc.for_roles[i].role;
            }
            return qry;
        });
        frm.set_query('user', 'for_users', function(doc, cdt, cdn) {
            var qry = {query: frappe.alerts.path('search_users')};
            if ((doc.for_users || '').length) {
                qry.filters = {existing: []};
                for (var i = 0, l = doc.for_users.length; i < l; i++)
                    qry.filters.existing[i] = doc.for_users[i].user;
            }
            return qry;
        });
        
        if (!!frm.is_new()) {
            frm._alert.mindate = moment();
        } else {
            if (cstr(frm.doc.creation).length)
                frm._alert.mindate = frm._alert.from_datetime(frm.doc.creation);
            else if (cstr(frm.doc.from_date).length)
                frm._alert.mindate = frm._alert.to_date(frm.doc.from_date);
        }
        var mindate = frm._alert.mindate_obj(),
        opts = {startDate: mindate, minDate: mindate};
        frm.set_df_property('from_date', 'options', opts);
        frm.set_df_property('until_date', 'options', opts);
        
        if (!!frm.is_new()) frm.trigger('validate_date');
    },
    refresh: function(frm) {
        frm.events.setup_toolbar(frm);
    },
    from_date: function(frm) {
        if (!frm._alert.in_validate)
            frm.events.validate_date(frm);
        frm._alert.in_validate = 0;
    },
    until_date: function(frm) {
        if (!frm._alert.in_validate)
            frm.events.validate_date(frm);
        frm._alert.in_validate = 0;
    },
    validate: function(frm) {
        if (!cstr(frm.doc.title)) {
            frappe.throw(__('A valid alert title is required.'));
            return false;
        }
        if (!cstr(frm.doc.alert_type)) {
            frappe.throw(__('A valid alert type is required.'));
            return false;
        }
        if (
            !(frm.doc.for_roles || '').length
            && !(frm.doc.for_users || '').length
        ) {
            frappe.throw(__('At least one recipient role or user is required.'));
            return false;
        }
        frm.events.validate_date(frm);
    },
    on_submit: function(frm) {
        frm.events.on_load(frm);
        frm.events.setup_toolbar(frm);
    },
    on_load: function(frm) {
        var docstatus = !!frm.is_new() ? 0 : cint(frm.doc.docstatus);
        frm._alert.is_draft = docstatus === 0;
        frm._alert.is_submitted = docstatus === 1;
        frm._alert.is_cancelled = docstatus === 2;
        
        if (frm._alert.is_draft || frm._alerts.form_disabled) return;
        
        frappe.alerts.disable_form(frm, '{0} has been {1}.', [
            cstr(frm.doc.doctype || frm.doctype),
            frm._alert.is_submitted ? 'submitted' : 'cancelled'
        ], 0, frm._alert.is_submitted ? 'green' : 'red');
        
        frm.set_df_property('seen_by_section', 'hidden', 0);
        
        frappe.alerts.on('alerts_alert_seen', function(ret) {
            if (ret && cstr(ret.alert) === cstr(frm.docname))
                frm.reload_doc();
        });
    },
    setup_toolbar: function(frm) {
        var label = __('Preview');
        if (!!frm.is_new() || !frm._alert.is_draft) {
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
    validate_date: function(frm) {
        var from = cstr(frm.doc.from_date),
        until = cstr(frm.doc.until_date);
        if (!from.length) from = null;
        else from = frm._alert.to_date(from);
        if (!from || cint(frm._alert.mindate.diff(from, 'days')) > 0) {
            from = frm._alert.mindate;
            frm._alert.in_validate = 1;
            frm.set_value('from_date', from.format());
        }
        if (!until.length) until = null;
        else until = frm._alert.to_date(until);
        if (!until || cint(from.diff(until, 'days') > 0)) {
            frm._alert.in_validate = 1;
            frm.set_value('until_date', from.format());
        }
    },
});
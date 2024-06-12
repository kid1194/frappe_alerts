/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert', {
    onload: function(frm) {
        frappe.alerts
            .on('ready change', function() { this.setup_form(frm); })
            .on('on_alert', function(d, t) {
                frm._alert.errs.includes(t) && (d.title = __(frm.doctype));
            });
        frm._alert = {
            errs: ['fatal', 'error'],
            ignore: 0,
            is_draft: false,
            is_submitted: false,
            is_cancelled: false,
            toolbar: 0,
            mindate: moment(),
            to_date: function(v) {
                return moment(cstr(v), frappe.defaultDateFormat);
            },
            from_datetime: function(v) {
                v = moment(cstr(v), frappe.defaultDatetimeFormat);
                v = v.format(frappe.defaultDateFormat);
                return this.to_date(v);
            },
            mindate_obj: function() {
                return frappe.datetime.moment_to_date_obj(this.mindate);
            },
        };
        frm.events.setup_doc(frm);
        if (!frm._alert.is_draft) return;
        frm.set_query('role', 'for_roles', function(doc, cdt, cdn) {
            var qry = {filters: {disabled: 0, desk_access: 1}};
            if (frappe.alerts.$isArrVal(doc.for_roles))
                qry.filters.name = ['notin', frappe.alerts.$map(doc.for_roles, function(v) { return v.role; })];
            return qry;
        });
        frm.set_query('user', 'for_users', function(doc, cdt, cdn) {
            var qry = {query: frappe.alerts.get_method('search_users')};
            if (frappe.alerts.$isArrVal(doc.for_users))
                qry.filters = {existing: frappe.alerts.$map(doc.for_users, function(v) { return v.user; })};
            return qry;
        });
        if (!frm.is_new()) {
            if (frappe.alerts.$isStrVal(frm.doc.creation))
                frm._alert.mindate = frm._alert.from_datetime(frm.doc.creation);
            else if (frappe.alerts.$isStrVal(frm.doc.from_date))
                frm._alert.mindate = frm._alert.to_date(frm.doc.from_date);
        }
        var mindate = frm._alert.mindate_obj(),
        fields = ['from_date', 'until_date'];
        for (var i = 0, f; i < 2; i++) {
            f = frm.get_field(fields[i]);
            f.df.min_date = mindate;
            f.datepicker && f.datepicker.update('minDate', mindate);
        }
    },
    refresh: function(frm) {
        if (!frm._type.toolbar) {
            frm.events.toggle_toolbar(frm);
            frm._type.toolbar = 1;
        }
    },
    from_date: function(frm) {
        if (frm._alert.ignore) return;
        var key = 'from_date',
        val = cstr(frm.doc[key]);
        if (!val.length || cint(frm._alert.mindate.diff(val, 'days')) > 0) {
            frm._alert.ignore++;
            frm.set_value(key, frm._alert.mindate.format());
            frm._alert.ignore--;
        }
        frm.events.until_date(frm);
    },
    until_date: function(frm) {
        if (frm._alert.ignore) return;
        var from = cstr(frm.doc.from_date);
        if (!from.length) return frm.events.from_date(frm);
        var key = 'until_date',
        val = cstr(frm.doc[key]);
        if (val === from) return;
        if (!val.length || cint(frm._alert.to_date(from).diff(val, 'days')) > 0) {
            frm._alert.ignore++;
            frm.set_value(key, from);
            frm._alert.ignore--;
        }
    },
    validate: function(frm) {
        var errs = [];
        if (!frappe.alerts.$isStrVal(frm.doc.title))
            errs.push(__('A valid title is required.'));
        if (!frappe.alerts.$isStrVal(frm.doc.alert_type))
            errs.push(__('A valid alert type is required.'));
        if (!frappe.alerts.$isStrVal(frm.doc.from_date))
            errs.push(__('A valid from date is required.'));
        if (cint(frm._alert.mindate.diff(frm.doc.from_date, 'days')) > 0)
            errs.push(__('From date must be later than or equals to "{0}".', [frm._alert.mindate.format()]));
        if (!frappe.alerts.$isStrVal(frm.doc.until_date))
            frm.events.until_date(frm);
        else if (cint(frm._alert.to_date(frm.doc.from_date).diff(frm.doc.until_date, 'days')) > 0)
            errs.push(__('Until date must be later than or equals to "From Date".'));
        if (!frappe.alerts.$isStrVal(frm.doc.message))
            errs.push(__('A valid message is required.'));
        if (
            !frappe.alerts.$isArrVal(frm.doc.for_roles)
            && !frappe.alerts.$isArrVal(frm.doc.for_users)
        ) errs.push(__('At least one recipient role or user is required.'));
        if (errs.length) {
            frappe.alerts.fatal(errs);
            return false;
        }
    },
    after_save: function(frm) {
        frm.events.setup_doc(frm);
        frm.events.toggle_toolbar(frm);
    },
    on_submit: function(frm) {
        frm.events.setup_doc(frm);
        frm.events.toggle_toolbar(frm);
    },
    after_cancel: function(frm) {
        frm.events.setup_doc(frm);
        frm.events.toggle_toolbar(frm);
    },
    setup_doc: function(frm) {
        var docstatus = !frm.is_new() ? cint(frm.doc.docstatus) : 0;
        frm._alert.is_draft = docstatus === 0;
        frm._alert.is_submitted = docstatus === 1;
        frm._alert.is_cancelled = docstatus === 2;
        if (frm._alert.is_draft) return;
        frappe.alerts.disable_form(frm, __('{0} has been {1}.', [
            cstr(frm.doctype), frm._alert.is_submitted ? __('submitted') : __('cancelled')
        ]), frm._alert.is_submitted ? 'green' : 'red');
        frm.set_df_property('seen_by_section', 'hidden', 0);
        frappe.alerts.real('alert_seen', function(ret) {
            if (
                ret && this.$isArrVal(ret.alerts)
                && ret.alerts.includes(cstr(frm.docname))
            ) frm.reload_doc();
        });
    },
    toggle_toolbar: function(frm) {
        var label = __('Preview'),
        del = frm.is_new() || !frm._alert.is_draft;
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
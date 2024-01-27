/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.ui.form.on('Alert', {
    setup: function(frm) {
        frappe.alerts
            .on('ready', function() {
                this.setup_form(frm);
            })
            .on('change', function() {
                this.setup_form(frm);
            });
        
        frm._alert = {
            is_draft: false,
            is_submitted: false,
            is_cancelled: false,
            today: moment(),
            tomorrow: moment().add(1, 'days'),
        };
    },
    onload: function(frm) {
        frm._alert.is_draft = !!frm.is_new() || cint(frm.doc.docstatus) == 0;
        frm._alert.is_submitted = !frm.is_new() && cint(frm.doc.docstatus) == 1;
        frm._alert.is_cancelled = !frm.is_new() && cint(frm.doc.docstatus) == 2;
        
        if (frm._alert.is_submitted || frm._alert.is_cancelled) {
            frm.disable_form();
            frm.set_intro(
                __(
                    '{0} has been {1}',
                    [
                        frm.doctype,
                        frm._alert.is_submitted ? 'submitted' : 'cancelled'
                    ]
                ),
                frm._alert.is_submitted ? 'green' : 'red'
            );
            
            frm.set_df_property('seen_by', 'cannot_add_rows', 1);
            frm.set_df_property('seen_by', 'cannot_delete_rows', 1);
            frm.set_df_property('seen_by', 'in_place_edit', 1);
            
            var seen_by_grid = frm.get_field('seen_by').grid;
            if (seen_by_grid.meta) seen_by_grid.meta.editable_grid = true;
            seen_by_grid.static_rows = 1;
            seen_by_grid.only_sortable();
            if (
                seen_by_grid.header_row
                && seen_by_grid.header_row.configure_columns_button
            ) seen_by_grid.header_row.configure_columns_button.remove();
            
            frappe.realtime.on('refresh_alert_seen_by', function(ret) {
                if (ret) ret = ret.message || ret;
                if (ret && cstr(ret.alert) === cstr(frm.doc.name))
                    frm.reload_doc();
            });
            return;
        }
        
        frm.set_query('alert_type', {filters: {disabled: 0}});
        
        frm.set_query('role', 'for_roles', function(doc, cdt, cdn) {
            var qry = {
                filters: {disabled: 0, desk_access: 1}
            };
            if (frm.doc.for_roles.length) {
                qry.filters.name = ['notin', []];
                $.each(frm.doc.for_roles, function(i, v) {
                    qry.filters.name[1].push(v.role);
                });
            }
            return qry;
        });
        frm.set_query('user', 'for_users', function(doc, cdt, cdn) {
            var qry = {
                query: 'alerts.utils.search_users'
            };
            if (frm.doc.for_users.length) {
                qry.filters = {existing: []};
                $.each(frm.doc.for_users, function(i, v) {
                    qry.filters.existing.push(v.user);
                });
            }
            return qry;
        });
        
        var today = frappe.datetime.moment_to_date_obj(frm._alert.today),
        tomorrow = frappe.datetime.moment_to_date_obj(frm._alert.tomorrow);
        frm.set_df_property('from_date', 'options', {
            startDate: today,
            minDate: today
        });
        frm.set_df_property('until_date', 'options', {
            startDate: tomorrow,
            minDate: tomorrow
        });
    },
    from_date: function(frm) {
        frm.trigger('validate_from_date');
    },
    until_date: function(frm) {
        frm.trigger('validate_until_date');
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
        frm.trigger('validate_from_date');
        frm.trigger('validate_until_date');
        if (
            !(frm.doc.for_roles || []).length
            && !(frm.doc.for_users || []).length
        ) {
            frappe.throw(__('At least one recipient role or user is required.'));
            return false;
        }
    },
    validate_from_date: function(frm) {
        var from = cstr(frm.doc.from_date);
        if (!from.length) return;
        from = moment(from, frappe.defaultDateFormat);
        if (frm._alert.today.diff(from, 'days') > 0) {
            frm.set_value('from_date', frm._alert.today.format());
            return;
        }
        var until = cstr(frm.doc.until_date);
        if (!until.length) return;
        until = moment(until, frappe.defaultDateFormat);
        if (from.diff(until, 'days') >= 0)
            frm.set_value('from_date', until.add(-1, 'days').format());
    },
    validate_until_date: function(frm) {
        var until = cstr(frm.doc.until_date);
        if (!until.length) return;
        until = moment(until, frappe.defaultDateFormat);
        if (frm._alert.tomorrow.diff(until, 'days') > 0) {
            frm.set_value('until_date', frm._alert.tomorrow.format());
            return;
        }
        var from = cstr(frm.doc.from_date);
        if (!from.length) return;
        from = moment(from, frappe.defaultDateFormat);
        if (from.diff(until, 'days') >= 0)
            frm.set_value('until_date', from.add(1, 'days').format());
    },
});
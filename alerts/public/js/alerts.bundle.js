/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.alerts');


class AlertsBase {
    $type(v) {
        if (v == null) return v === void 0 ? 'Undefined' : 'Null';
        var t = Object.prototype.toString.call(v).slice(8, -1);
        return t === 'Number' && isNaN(v) ? 'NaN' : t;
    }
    $isStr(v) { return this.$type(v) === 'String'; }
    $isFunc(v) { return typeof v === 'function' || /(Function|^Proxy)$/.test(this.$type(v)); }
    $isArr(v) { return v && $.isArray(v); }
    $isObjLike(v) { return v != null && typeof v === 'object'; }
    $isDataObj(v) { return v && $.isPlainObject(v); }
    $isEmptyObj(v) { return !v || $.isEmptyObject(v); }
    $isArgs(v) { return this.$type(v) === 'Arguments'; }
    $toArr(v, s, e) { return Array.prototype.slice.call(v, s, e); }
    $fn(fn, obj) { return $.proxy(fn, obj || this); }
    
    destroy() {
        let hasProp = Object.prototype.hasOwnProperty;
        for (let k in this) {
            if (hasProp.call(this, k)) delete this[k];
        }
    }
}


class Alerts extends AlertsBase {
    constructor() {
        super();
        this.name = 'Alerts';
        this.is_ready = false;
        this.is_enabled = false;
        
        this._id = frappe.utils.get_random(5);
        this._prefix = '[' + this.name + ']';
        this._events = {
            list: {},
            real: {},
        };
        
        this._dialog = null;
        this._list = [];
        this._seen = [];
        this._mock = null;
        
        this._on_deatroy = this.$fn(this.destroy);
        window.addEventListener('beforeunload', this._on_deatroy);
        $(window).on('hashchange', this._on_deatroy);
        window.addEventListener('popstate', this._on_deatroy);
        
        this.request(
            'is_enabled',
            null,
            function(ret) {
                this.is_ready = true;
                this.is_enabled = !!ret;
                this._setup();
                this.emit('ready');
            }
        );
    }
    mock() {
        this._mock = this._mock || new AlertsMock();
        return this._mock;
    }
    show(data) {
        if (this.$isDataObj(data) && !this.$isEmptyObj(data)) data = [data];
        if (!this.$isArr(data) || !data.length) return this;
        this._list.push.apply(this._list, data);
        return this._build();
    }
    path(method) {
        return 'alerts.utils.' + method;
    }
    
    request(method, args, callback, error, _freeze) {
        if (!this.$isStr(method) || !method.length) return this;
        if (!this.$isFunc(callback)) callback = null;
        if (!this.$isFunc(error)) error = null;
        if (method.indexOf('.') < 0) method = this.path(method);
        var opts = {
            method: method,
            freeze: !!_freeze,
            callback: this.$fn(function(ret) {
                if (ret) ret = ret.message || ret;
                if (ret && !ret.error) {
                    if (callback) callback.call(this, ret);
                    return;
                }
                var message = ret.message || 'The request sent raised an error.';
                if (!error) this.error(message, args);
                else error.call(this, {message: __(message, args)});
            }),
            error: this.$fn(function(ret, txt) {
                var message = '';
                if (this.$isStr(ret)) message = ret;
                else if (this.$isStr(txt)) message = txt;
                else message = 'The request sent have failed.';
                if (!error) this.error(message, args);
                else error.call(this, {message: __(message, args)});
            })
        };
        if (this.$isDataObj(args)) {
            opts.type = 'POST';
            opts.args = args;
        }
        try {
            frappe.call(opts);
        } catch(e) {
            if (error) error.call(this, e);
            else this._error('Error: ' + e.message, e.stack);
            if (this.has_error) throw e;
        } finally {
            this.has_error = false;
        }
        return this;
    }
    
    _setup() {
        this.on('alerts_app_status_changed', function(ret) {
            if (!ret || ret.is_enabled == null) return;
            var old = this.is_enabled;
            this.is_enabled = !!ret.is_enabled;
            if (this.is_enabled !== old) this.emit('change');
        })
        .on('alerts_show', function(ret) {
            if (this.is_enabled && this._is_valid(ret))
                this.show(ret);
        });
    }
    _is_valid(data) {
        if (!data || !this.$isDataObj(data) || this.$isEmptyObj(data)) return false;
        if (this._seen.indexOf(data.name) >= 0) return false;
        var user = frappe.session.user,
        score = 0;
        if (this.$isArr(data.users) && data.users.indexOf(user) >= 0) score++;
        else if (
            this.$isArr(data.roles) && data.roles.length
            && frappe.user.has_role(data.roles)
        ) score++;
        if (!score) return false;
        if (this.$isArr(data.seen_today) && data.seen_today.indexOf(user) >= 0) return false;
        var seen_by = this.$isDataObj(data.seen_by) ? data.seen_by : {};
        if (
            cint(data.is_repeatable) < 1
            && seen_by[user] != null
            && cint(seen_by[user]) > 0
        ) return false;
        var max_repeats = cint(data.number_of_repeats);
        if (
            max_repeats > 0
            && seen_by[user] != null
            && cint(seen_by[user]) >= max_repeats
        ) return false;
        return true;
    }
    _build() {
        if (!this._list.length) {
            if (this._seen.length) {
                var seen = this._seen.splice(0, this._seen.length);
                this.request(
                    'mark_seens',
                    {names: seen},
                    function(ret) {
                        if (!ret) {
                            this._seen.push.apply(this._seen, seen);
                            this.error('Marking alerts as seen has failed.');
                        }
                    },
                    function(e) {
                        this._seen.push.apply(this._seen, seen);
                        this.error('Marking alerts as seen has failed.');
                        this._error('Marking alerts as seen has failed with error.', e && e.message);
                    }
                );
            }
            return this;
        }
        
        var data = this._list.shift();
        this._dialog = this._dialog || new AlertsDialog(this._id, 'alerts-dialog-' + this._id);
        this._dialog
            .setName(data.name)
            .setTitle(data.title)
            .setMessage(data.message)
            .setType(data.type)
            .onShow(this.$fn(function() {
                this._seen.push(this._dialog.name);
            }))
            .onHide(this.$fn(this._build), 200)
            .render()
            .show();
        return this;
    }
    destroy() {
        frappe.alerts = null;
        window.removeEventListener('beforeunload', this._on_deatroy);
        $(window).off('hashchange', this._on_deatroy);
        window.removeEventListener('popstate', this._on_deatroy);
        for (var e in this._events.list) this._clear_event(e, 1);
        if (this._dialog) try { this._dialog.destroy(); } catch(_) {}
        if (this._mock) try { this._mock.destroy(); } catch(_) {}
        super.destroy();
    }
    
    _alert(title, msg, args, def_title, indicator, fatal) {
        if (this.$isArr(msg)) {
            args = msg;
            msg = null;
        }
        if (!msg) {
            msg = title;
            title = null;
        }
        if (msg && !this.$isStr(msg)) {
            if (this.$isArr(msg))
                try { msg = JSON.stringify(msg); } catch(_) { msg = null; }
            else if (typeof msg === 'object')
                try { msg = msg.message; } catch(_) { msg = null; }
            else
                try { msg = String(msg); } catch(_) { msg = null; }
        }
        if (!msg || !this.$isStr(msg)) msg = __('Invalid message');
        else if (args) msg = __(msg, args);
        else msg = __(msg);
        if (!title || !this.$isStr(title)) title = def_title;
        var data = {
            title: this._prefix + ': ' + __(title),
            indicator: indicator,
            message: msg,
        };
        if (!fatal) frappe.msgprint(data);
        else {
            this.has_error = true;
            frappe.throw(data);
        }
        return this;
    }
    error(title, msg, args) {
        return this._alert(title, msg, args, 'Error', 'red');
    }
    info(title, msg, args) {
        return this._alert(title, msg, args, 'Info', 'blue');
    }
    fatal(title, msg, args) {
        return this._alert(title, msg, args, 'Error', 'red', true);
    }
    
    _console(fn, args) {
        if (this.$isArgs(args)) args = this.$toArr(args);
        if (!this.$isArr(args) || !args.length) return this;
        if (!this.$isStr(args[0])) args.unshift(this._prefix);
        else args[0] = this._prefix + ' ' + args[0];
        console[fn].apply(null, args);
        return this;
    }
    _log() {
        return this._console('log', arguments);
    }
    _error() {
        return this._console('error', arguments);
    }
    
    on(event, fn, _once) {
        if (!this.$isStr(event) || !event.length || !this.$isFunc(fn)) return this;
        event = event.split(' ');
        for (var i = 0, l = event.length, e; i < l; i++) {
            e = event[i];
            if (e === 'ready' && this.is_ready) {
                fn.call(this);
                return this;
            }
            if (!this._events.list[e]) {
                this._events.list[e] = [];
                if (e.indexOf('alerts_') === 0) {
                    this._events.real[e] = this._make_event_realtime_fn(e);
                    frappe.realtime.on(e, this._events.real[e]);
                }
            }
            this._events.list[e].push({f: fn, o: _once});
        }
        return this;
    }
    once(event, fn) {
        return this.on(event, fn, 1);
    }
    off(event, fn) {
        if (!this.$isStr(event) || !event.length) return this;
        if (!this.$isFunc(fn)) fn = null;
        event.split(' ').forEach(this.$fn(function(e) {
            if (this._events.list[e]) this._remove_event(e, fn);
        }));
        return this;
    }
    emit(event) {
        if (!this.$isStr(event) || !event.length) return this;
        var args = arguments;
        if (args.length < 2) args = null;
        else args = this.$toArr(args, 1);
        event.split(' ').forEach(this.$fn(function(e) {
            if (!this._events.list[e]) return;
            this._emit_event(e, args);
            this._clear_event(e);
        }));
        return this;
    }
    _make_event_realtime_fn(event) {
        return this.$fn(function(ret) {
            if (ret && this.$isDataObj(ret)) ret = ret.message || ret;
            this.emit(event, [ret]);
        });
    }
    _remove_event(event, fn) {
        if (fn) this._events.list[event].slice().forEach(this.$fn(function(e, i) {
            if (e.f === fn) this._events.list[event].splice(i, 1);
        }));
        this._clear_event(event, !fn);
    }
    _clear_event(event, all) {
        if (!all && this._events.list[event].length) return;
        if (this._events.real[event])
            frappe.realtime.off(event, this._events.real[event]);
        delete this._events.list[event];
        delete this._events.real[event];
    }
    _emit_event(e, args) {
        this._events.list[e].slice().forEach(this.$fn(function(ev, i) {
            if (!args) ev.f.call(this);
            else ev.f.apply(this, args);
            if (ev.o) this._events.list[e].splice(i, 1);
        }));
    }
    
    init_form(frm) {
        if (!frm._alerts) frm._alerts = {};
        if (frm._alerts.is_ready != null) return this;
        if (frm._alerts.app_disabled == null)
            frm._alerts.app_disabled = false;
        if (frm._alerts.form_disabled == null)
            frm._alerts.form_disabled = false;
        if (frm._alerts.fields_disabled == null)
            frm._alerts.fields_disabled = [];
        if (frm._alerts.tables_disabled == null)
            frm._alerts.tables_disabled = {};
        if (frm._alerts.is_ready == null) {
            frm._alerts.is_ready = false;
            this.once('ready', function() {
                if (frm) frm._alerts.is_ready = true;
            });
        }
        return this;
    }
    setup_form(frm, workflow) {
        this.init_form(frm);
        if (this.is_enabled) {
            frm._alerts.app_disabled = false;
            if (!frm._alerts.form_disabled) this.emit('form_enabled');
            else this.enable_form(frm, workflow);
        } else {
            frm._alerts.app_disabled = true;
            if (frm._alerts.form_disabled) this.emit('form_disabled');
            else this.disable_form(frm, this._name + ' app is disabled.', null, workflow);
        }
        return this;
    }
    enable_form(frm, workflow) {
        this.init_form(frm);
        if (!frm._alerts.form_disabled)
            return this.emit('form_enabled');
        try {
            let fields = frm._alerts.fields_disabled;
            if (fields.length) {
                for (let i = 0, l = frm.fields.length, f; i < l; i++) {
                    f = frm.fields[i];
                    if (fields.indexOf(f.df.fieldname) < 0) continue;
                    frm.set_df_property(f.df.fieldname, 'read_only', 0);
                    if (f.df.fieldtype === 'Table')
                        this.enable_table(frm, f.df.fieldname);
                }
            }
            if (this._no_workflow(frm, workflow)) frm.enable_save();
            else frm.page.show_actions_menu();
            if (frm._alerts.has_intro) {
                frm._alerts.has_intro = false;
                frm.set_intro();
            }
        } catch(e) {
            this._error('Enable form', e.message, e.stack);
        } finally {
            frm._alerts.form_disabled = false;
            frm._alerts.fields_disabled = [];
            frm._alerts.tables_disabled = {};
            this._has_error = false;
            this.emit('form_enabled');
        }
        return this;
    }
    disable_form(frm, msg, args, workflow, color) {
        this.init_form(frm);
        if (frm._alerts.form_disabled)
            return this.emit('form_disabled');
        if (color == null && this.$isStr(workflow)) {
            if (workflow.length) color = workflow;
            workflow = null;
        }
        if (args != null) {
            if (!this.$isArr(args)) {
                workflow = !!args;
                args = null;
            } else if (!args.length) args = null;
        }
        if (!this.$isStr(msg) || !msg.length) msg = null;
        try {
            for (let i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i];
                if (cint(f.df.read_only) || cint(field.df.hidden)) continue;
                frm._alerts.fields_disabled.push(f.df.fieldname);
                frm.set_df_property(f.df.fieldname, 'read_only', 1);
                if (f.df.fieldtype === 'Table')
                    this.disable_table(frm, f.df.fieldname);
            }
            if (this._no_workflow(frm, workflow)) frm.disable_save();
            else frm.page.hide_actions_menu();
            if (msg) {
                frm._alerts.has_intro = true;
                frm.set_intro(args ? __(msg, args) : __(msg), color || 'red');
            }
        } catch(e) {
            this._error('Disable form', e.message, e.stack);
        } finally {
            frm._alerts.form_disabled = true;
            this._has_error = false;
            this.emit('form_disabled');
        }
        return this;
    }
    _no_workflow(frm, workflow) {
        return !workflow || !!frm.is_new() || (!!workflow && !frm.states.get_state());
    }
    
    enable_table(frm, key) {
        this.init_form(frm);
        if (!frm._alerts.tables_disabled[key]) return this;
        let obj = frm._alerts.tables_disabled[key],
        grid = frm.get_field(key).grid;
        delete frm._alerts.tables_disabled[key];
        if (grid.meta && obj.editable_grid != null)
            grid.meta.editable_grid = obj.editable_grid;
        if (obj.static_rows != null) grid.static_rows = obj.static_rows;
        if (obj.sortable_status != null) grid.sortable_status = obj.sortable_status;
        if (
            obj.header_row != null && grid.header_row
            && grid.header_row.configure_columns_button
        )
            grid.header_row.configure_columns_button.show();
        if (
            obj.header_search != null && grid.header_search
            && grid.header_search.wrapper
        )
            grid.header_search.wrapper.show();
        if (obj.add_row != null) grid.wrapper.find('.grid-add-row').show();
        if (obj.add_multi_row != null) grid.wrapper.find('.grid-add-multiple-rows').show();
        if (obj.download != null) grid.wrapper.find('.grid-download').show();
        if (obj.upload != null) grid.wrapper.find('.grid-upload').show();
        return this;
    }
    disable_table(frm, key) {
        this.init_form(frm);
        if (frm._alerts.tables_disabled[key]) return this;
        let field = frm.get_field(key);
        if (!field || !field.df || field.df.fieldtype !== 'Table') return this;
        let obj = frm._alerts.tables_disabled[key] = {},
        grid = field.grid;
        if (grid.meta) {
            obj.editable_grid = grid.meta.editable_grid;
            grid.meta.editable_grid = true;
        }
        obj.static_rows = grid.static_rows;
        grid.static_rows = 1;
        obj.sortable_status = grid.sortable_status;
        grid.sortable_status = 0;
        if (
            grid.header_row && grid.header_row.configure_columns_button
            && grid.header_row.configure_columns_button.is(':visible')
        ) {
            obj.header_row = 1;
            grid.header_row.configure_columns_button.hide();
        }
        if (
            grid.header_search && grid.header_search.wrapper
            && grid.header_search.wrapper.is(':visible')
        ) {
            obj.header_search = 1;
            grid.header_row.wrapper.hide();
        }
        let $btn = grid.wrapper.find('.grid-add-row');
        if ($btn.length && $btn.is(':visible')) {
            obj.add_row = 1;
            $btn.hide();
        }
        $btn = grid.wrapper.find('.grid-add-multiple-rows');
        if ($btn.length && $btn.is(':visible')) {
            obj.add_multi_row = 1;
            $btn.hide();
        }
        $btn = grid.wrapper.find('.grid-download');
        if ($btn.length && $btn.is(':visible')) {
            obj.download = 1;
            $btn.hide();
        }
        $btn = grid.wrapper.find('.grid-upload');
        if ($btn.length && $btn.is(':visible')) {
            obj.upload = 1;
            $btn.hide();
        }
        return this;
    }
}


class AlertsMock extends AlertsBase {
    constructor() {
        super();
        this._id = frappe.utils.get_random(5);
    }
    build(data) {
        if (!this.$isDataObj(data) || this.$isEmptyObj(data)) return this;
        this._dialog = this._dialog || new AlertsDialog(this._id, 'alerts-mock-dialog-' + this._id);
        this._dialog
            .setTitle(data.name)
            .setMessage('This is a mock alert message.')
            .setType(data)
            .render()
            .show();
        return this;
    }
    show() {
        this._dialog && this._dialog.show();
        return this;
    }
    hide() {
        this._dialog && this._dialog.hide();
        return this;
    }
    destroy() {
        if (this._dialog) this._dialog.destroy();
        super.destroy();
    }
}


class AlertsDialog extends AlertsBase {
    constructor(id, _class) {
        super();
        this._id = id;
        this._class = _class;
        this._opts = {};
        this._sound = {loaded: 0, playing: 0, timeout: null};
    }
    setName(text) {
        if (this.$isStr(text) && text.length)
            this._name = text;
        return this;
    }
    get name() { return this._name; }
    setTitle(text, args) {
        if (this.$isStr(text) && text.length) {
            if (!this.$isArr(args)) text = __(text);
            else text = __(text, args);
            this._opts.title = text;
        }
        return this;
    }
    setMessage(text, args) {
        if (this.$isStr(text) && text.length) {
            if (!this.$isArr(args)) text = __(text);
            else text = __(text, args);
            this._message = text;
        }
        return this;
    }
    setType(type) {
        if (!this.$isDataObj(type) || this.$isEmptyObj(type)) return this;
        if (!this._style) this._style = new AlertsStyle(this._id, this._class);
        this._style.build(type);
        this.setTimeout(type.display_timeout);
        this.setSound(type.display_sound, type.custom_display_sound);
        return this;
    }
    setTimeout(sec) {
        sec = cint(sec);
        if (sec > 0) this._timeout = cint(sec * 1000);
        return this;
    }
    setSound(file, fallback) {
        this.stopSound();
        this._sound.loaded = 0;
        if (!this.$isStr(file) || !file.length || file === 'None') return this;
        if (file === 'Custom') file = fallback;
        else file = '/assets/frappe/sounds/' + file.toLowerCase() + '.mp3';
        if (!this.$isStr(file) || !file.length) return this;
        if (!this.$sound) {
            this.$sound = $('<audio>').attr({
                id: 'sound-' + this._id,
                volume: '0.2',
                preload: 'auto',
            });
            $('body').append(this.$sound);
        }
        this.$sound
            .off('canplaythrough')
            .attr('src', file)
            .on('canplaythrough', this.$fn(function() {
                this._sound.loaded = 1;
            }));
        this.$sound[0].load();
        return this;
    }
    beforeShow(fn) {
        if (this.$isFunc(fn)) this._pre_show = this.$fn(fn);
        return this;
    }
    onShow(fn, delay) {
        if (this.$isFunc(fn)) {
            if (cint(delay) < 1) this._on_show = this.$fn(fn);
            else this._on_show = this.$fn(function() {
                window.setTimeout(this.$fn(fn), cint(delay));
            });
        }
        return this;
    }
    onHide(fn, delay) {
        if (this.$isFunc(fn)) {
            if (cint(delay) < 1) this._on_hide = this.$fn(fn);
            else this._on_hide = this.$fn(function() {
                window.setTimeout(this.$fn(fn), cint(delay));
            });
        }
        return this;
    }
    render() {
        if (this._dialog) this.reset();
        this._dialog = new frappe.ui.Dialog(this._opts);
        this._dialog.$wrapper.addClass(this._class);
        if (this._message) $('<div class="alerts-message">')
            .html(this._message)
            .appendTo(this._dialog.modal_body);
        if (this._on_hide) this._dialog.onhide = this._on_hide;
        if (this._on_show) this._dialog.on_page_show = this._on_show;
        return this;
    }
    show() {
        if (!this._dialog) return this;
        if (this._pre_show) this._pre_show();
        this.playSound();
        this._dialog.show();
        if (this._timeout)
            window.setTimeout(this.$fn(this.hide), this._timeout);
        return this;
    }
    hide() {
        this.stopSound();
        this._dialog && this._dialog.hide();
        return this;
    }
    playSound() {
        if (!this.$sound) return this;
        if (this._sound.loaded) {
            this._sound.playing = 1;
            try { this.$sound[0].play(); } catch(_) {}
            return this;
        }
        this.stopSound();
        this._sound.timeout = window.setTimeout(this.$fn(this.playSound), 200);
        return this;
    }
    stopSound() {
        if (this._sound.timeout) window.clearTimeout(this._sound.timeout);
        this._sound.timeout = null;
        if (this.$sound && this._sound.playing)
            try { this.$sound[0].stop(); } catch(_) {}
        this._sound.playing = 0;
        return this;
    }
    reset() {
        this.hide();
        if (this._dialog) {
            this._dialog.$wrapper.modal('destroy');
            this._dialog.$wrapper.remove();
        }
        this._dialog = null;
        this.$sound && this.$sound.off('canplaythrough');
        this._sound.loaded = this._sound.playing = 0;
    }
    destroy() {
        this.reset();
        if (this._style) this._style.destroy();
        if (this.$sound) this.$sound.remove();
        super.destroy();
    }
}


class AlertsStyle extends AlertsBase {
    constructor(id, _class) {
        super();
        this._id = 'style-' + id;
        this._class = _class;
        this._dom = document.createElement('style');
        this._dom.id = this._id;
        this._dom.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(this._dom);
    }
    build(data) {
        if (!this.$isDataObj(data) || this.$isEmptyObj(data)) return this;
        var sel = '.$0>.modal-dialog>.modal-content'.replace('$0', this._class),
        css = [];
        if (this.$isStr(data.background) && data.background.length)
            css.push('$0{background:$1!important}'.replace('$0', sel).replace('$1', data.background));
        if (this.$isStr(data.border_color) && data.border_color.length)
            css.push(
                '$0,$0>.modal-header,$0>.modal-footer{border:1px solid $1!important}'
                .replace(/\$0/g, sel).replace('$1', data.border_color)
            );
        if (this.$isStr(data.title_color) && data.title_color.length)
            css.push(
                ('$0>$1>$2>.modal-title{color:$3!important}'
                + '$0>$1>$2>.indicator::before{background:$3!important}'
                + '$0>$1>.modal-actions>.btn{color:$3!important}')
                .replace(/\$0/g, sel).replace(/\$1/g, '.modal-header')
                .replace(/\$2/g, '.title-section').replace(/\$3/g, data.title_color)
            );
        if (this.$isStr(data.content_color) && data.content_color.length)
            css.push(
                '$0>$1,$0>$1>.alerts-message{color:$2!important}'
                .replace(/\$0/g, sel).replace(/\$1/g, '.modal-body')
                .replace('$2', data.content_color)
            );
        if (css.length) {
            css = css.join("\n");
            if (this._dom.styleSheet) this._dom.styleSheet.cssText = css;
            else {
                while (this._dom.firstChild)
                    this._dom.removeChild(this._dom.firstChild);
                this._dom.appendChild(document.createTextNode(css));
            }
        }
        return this;
    }
    destroy() {
        if (this._dom) this._dom.parentNode.removeChild(this._dom);
        super.destroy();
    }
}


$(document).ready(function() {
    frappe.alerts = new Alerts();
    frappe.after_ajax(function() {
        if (frappe.boot && frappe.boot.alerts)
            frappe.alerts.show(frappe.boot.alerts);
    });
});
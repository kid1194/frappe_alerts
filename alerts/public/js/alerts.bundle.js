/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


if (typeof String.prototype.trim !== 'function')
    (function() {
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        String.prototype.trim = function() { return this.replace(rtrim, ''); };
    }());
(function() {
    window.addEventListener('load', function() {
        function loader(data) {
            var $head = document.getElementsByTagName('head')[0];
            for (var k in data) {
                if (!data[k][0]) {
                    if (data[k][2]) data[k][2]();
                    continue;
                }
                var $el = document.getElementById(k);
                if (!!$el) continue;
                $el = document.createElement('script');
                $el.id = k;
                $el.src = data[k][1];
                $el.type = 'text/javascript';
                $el.async = true;
                if (data[k][2]) $el.onload = data[k][2];
                $head.appendChild($el);
            }
        }
        loader({
            promise_polyfill: [
                typeof window.Promise !== 'function',
                'https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js',
                function() {
                    if (typeof Promise.wait !== 'function')
                        Promise.wait = function(ms) {
                            return new Promise(function(resolve) {
                                window.setTimeout(resolve, ms);
                            });
                        };
                    if (typeof Promise.prototype.timeout !== 'function')
                        Promise.prototype.timeout = function(ms) {
                            return Promise.race([
                                this,
                                Promise.wait(ms).then(function() {
                                    throw new Error('Time out');
                                })
                            ]);
                        };
                },
            ],
        });
    }, {
        capture: true,
        once: true,
        passive: true,
    });
}());


class LevelUpBase {
    destroy() {
        for (var k in this) { if (this.$hasProp(k)) delete this[k]; }
    }
    $void() { return void 0; }
    $isVal(v) { return v != null; }
    $isNull(v) { return v === null; }
    $isVoid(v) { return v === this.$void(); }
    $type(v) {
        if (!this.$isVal(v)) return this.$isVoid(v) ? 'Undefined' : 'Null';
        var t = Object.prototype.toString.call(v).slice(8, -1);
        return t === 'Number' && isNaN(v) ? 'NaN' : t;
    }
    $isStr(v) { return this.$isVal(v) && this.$type(v) === 'String'; }
    $isStrVal(v) { return this.$isStr(v) && v.length; }
    $isNum(v) { return this.$isVal(v) && this.$type(v) === 'Number' && isFinite(v); }
    $isNumVal(v, n) { return this.$isNum(v) && (!n ? v > 0 : v < 0); }
    $isBool(v) { return v === true || v === false; }
    $isBoolLike(v) {
        return this.$isBool(v) || (this.$isNum(v) && (v === 0 || v === 1));
    }
    $isFunc(v) {
        return this.$isVal(v) && (typeof v === 'function' || /(Function|^Proxy)$/.test(this.$type(v)));
    }
    $isArr(v) { return this.$isVal(v) && $.isArray(v); }
    $isArrVal(v) { return this.$isArr(v) && v.length; }
    $isArgs(v) { return this.$isVal(v) && this.$type(v) === 'Arguments'; }
    $isArgsVal(v) { return this.$isArgs(v) && v.length; }
    $isArrLike(v) {
        return this.$isObjLike(v) && !this.$isStr(v) && this.$isNum(v.length);
    }
    $isObjLike(v) { return this.$isVal(v) && typeof v === 'object'; }
    $isDataObj(v) { return this.$isVal(v) && $.isPlainObject(v); }
    $isDataObjVal(v) { return this.$isDataObj(v) && !$.isEmptyObject(v); }
    $isPromise(v) { return this.$isVal(v) && this.$type(v) === 'Promise'; }
    $isEmpty(v) {
        return !this.$isVal(v) || v === '' || v === 0 || v === false || $.isEmptyObject(v);
    }
    $hasProp(k, o) { return Object.prototype.hasOwnProperty.call(o || this, k); }
    $def(o, p, s) { return this.$extend(o, p).$extend(o, s, 1); }
    $extend(o, v, i) {
        if (v && this.$isDataObjVal(v)) {
            var s = this.$isBoolLike(i);
            if (!s && !this.$isArrVal(i)) i = null;
            for (var k in v) this.$getter(k, v[k], o, s || (i && i.indexOf(k) < 0));
        }
        return this;
    }
    $getter(k, v, o, s) {
        o = o || this;
        if (s && this.$isVal(o['_' + k])) {
            Object.defineProperty(o, k,  {get() { return v; }});
        } else {
            o['_' + k] = v;
            if (!this.$isVal(o[k]))
                Object.defineProperty(o, k, {get() { return this['_' + k]; }});
        }
        return this;
    }
    $toArr(v, s, e) { return Array.prototype.slice.call(v, s, e); }
    $toJson(v, d) {
        try { return JSON.stringify(v); } catch(_) {}
        return d;
    }
    $parseJson(v, d) {
        try { return JSON.parse(v); } catch(_) {}
        return d;
    }
    $fn() {
        var a = this.$toArr(arguments);
        a[1] = a[1] || this;
        return $.proxy.apply(null, a);
    }
    $afn(fn, a, o) {
        var d = [fn, o || this];
        if (this.$isVal(a)) {
            if (!this.$isArrLike(a)) d.push(a);
            else d.push.apply(d, a);
        }
        return $.proxy.apply(null, d);
    }
    $call(fn, a, o) {
        if (!this.$isVal(a)) a = '';
        else if (!this.$isArrLike(a)) a = [a];
        o = o || this;
        switch (a.length) {
            case 0: return fn.call(o);
            case 1: return fn.call(o, a[0]);
            case 2: return fn.call(o, a[0], a[1]);
            case 3: return fn.call(o, a[0], a[1], a[2]);
            case 4: return fn.call(o, a[0], a[1], a[2], a[3]);
            case 5: return fn.call(o, a[0], a[1], a[2], a[3], a[4]);
            default: return fn.apply(o, a);
        }
    }
}


class LevelUp extends LevelUpBase {
    constructor(name, key, namespace, debug) {
        super();
        name = name || 'Level Up';
        key = key || 'LU';
        if (namespace) namespace += '.';
        this.$extend(this, {
            _name: name,
            _key: '_' + key,
            _realtime: key + '_',
            _prefix: '[' + name + ']',
            _namespace: namespace || '',
            _testing: !!debug
        }, 1);
        this._events = {
            list: {},
            real: {},
        };
        this._on_unload = this.$fn(this.destroy);
        window.addEventListener('beforeunload', this._on_unload);
        /*if (frappe) {
            this._hash_change = this.$fn(function() {
                this.clean_form();
                this.off();
                this.emit('state_change');
            });
            for (var i = 0, ks = ['route', 'router'], l = ks.length; i < l; i++) {
                if (!frappe[ks[i]] || !frappe[ks[i]].on) continue;
                frappe[ks[i]].on('change', this._hash_change);
                break;
            }
        } else {*/
            this._hash_change = this.$fn(function() {
                if (frappe && window.location.hash == frappe._cur_route) return;
                this.clean_form();
                this.off();
                this.emit('state_change');
            });
            $(window).on('hashchange', this._on_change);
        //}
    }
    
    options(opts) { return this.$extend(this, opts, 1); }
    destroy() {
        window.removeEventListener('beforeunload', this._on_unload);
        if (frappe) {
            for (var i = 0, ks = ['route', 'router'], l = ks.length; i < l; i++) {
                if (!frappe[ks[i]] || !frappe[ks[i]].off) continue;
                frappe[ks[i]].off('change', this._hash_change);
                break;
            }
        } else {
            $(window).off('hashchange', this._on_change);
        }
        this.emit('destroy').off(1);
        super.destroy();
    }
    
    $alert(t, m, a, d, i, f) {
        if (!a && this.$isArr(m)) {
            a = m;
            m = null;
        }
        if (!m) {
            m = t;
            t = null;
        }
        var o = {
            title: this._prefix + ': ' + __(this.$isStrVal(t) ? t : d),
            indicator: i,
            message: __('' + m, a),
        };
        if (!f) frappe.mprint(o);
        else {
            this._has_error = true;
            frappe.throw(o);
        }
        return this;
    }
    debug(t, m, a) {
        if (!this._testing) return this;
        return this.$alert(t, m, a, 'Debug', 'gray');
    }
    log(t, m, a) {
        if (!this._testing) return this;
        return this.$alert(t, m, a, 'Log', 'cyan');
    }
    info(t, m, a) { return this.$alert(t, m, a, 'Info', 'light-blue'); }
    warn(t, m, a) { return this.$alert(t, m, a, 'Warning', 'orange'); }
    error(t, m, a) { return this.$alert(t, m, a, 'Error', 'red'); }
    fatal(t, m, a) { return this.$alert(t, m, a, 'Error', 'red', 1); }
    
    $console(fn, args) {
        if (!this._testing) return this;
        if (!this.$isStr(args[0]))
            Array.prototype.unshift.call(args, this._prefix);
        else args[0] = (this._prefix + ' ' + args[0]).trim();
        (console[fn] || console.log).apply(null, args);
        return this;
    }
    _debug() { return this.$console('debug', arguments); }
    _log() { return this.$console('log', arguments); }
    _info() { return this.$console('info', arguments); }
    _warn() { return this.$console('warn', arguments); }
    _error() { return this.$console('error', arguments); }
    
    method(v) { return this._namespace + v; }
    request(method, args, callback, error, _freeze) {
        if (method.indexOf('.') < 0) method = this.method(method);
        if (!this.$isFunc(callback)) callback = null;
        if (!this.$isFunc(error)) error = null;
        var opts = {
            method: method,
            freeze: this.$isVal(_freeze),
            callback: this.$fn(function(ret) {
                if (!this.$isVal(ret)) ret = null;
                if (ret && this.$isDataObj(ret)) ret = ret.message || ret;
                if (!ret || !this.$isDataObj(ret) || !ret.error) {
                    if (callback) callback.call(this, ret);
                    return;
                }
                var err;
                if (this.$isStrVal(ret)) err = ret;
                else if (this.$isDataObjVal(ret)) {
                    if (this.$isStrVal(ret.message)) err = ret.message;
                    else if (this.$isStrVal(ret.error)) err = ret.error;
                }
                if (!err) err = 'The request sent returned an invalid response.';
                if (!error) this.error(message, args);
                else error.call(this, {message: __(message, args)});
            }),
            error: this.$fn(function(ret, txt) {
                var err;
                if (this.$isStrVal(ret)) err = ret;
                else if (this.$isStrVal(txt)) err = txt;
                else err = 'The request sent raised an error.';
                if (!error) this.error(err);
                else error.call(this, {message: __(message, args)});
                this._error(err, method, args);
            })
        };
        if (this.$isDataObjVal(args)) {
            opts.type = 'POST';
            opts.args = args;
        }
        try { frappe.call(opts); } catch(e) {
            if (error) error.call(this, e);
            else this._error(e.message, e.stack);
            if (this._has_error) throw e;
        } finally {
            this._has_error = false;
        }
        return this;
    }
    
    on(event, fn, keep)  { return this._add_event(event, fn, 0, keep); }
    once(event, fn) { return this._add_event(event, fn, 1); }
    off(event, fn) {
        if (!this.$isVal(event)) return this._clear_events();
        if (this.$isBoolLike(event)) return this._clear_events(event);
        if (!this.$isStrVal(event)) return this;
        if (!this.$isFunc(fn)) fn = null;
        event = event.split(' ');
        for (var i = 0, l = event.length, e; i < l; i++) {
            e = event[i];
            if (this._events.list[e]) this._del_event(e, fn);
        }
        return this;
    }
    emit(event) {
        if (!this.$isStrVal(event)) return this;
        var args = this.$toArr(arguments, 1);
        if (args.length < 1) args = null;
        event = event.split(' ');
        for (var i = 0, l = event.length, e; i < l; i++) {
            e = event[i];
            if (this._events.list[e]) this._emit_event(e, args);
        }
        return this;
    }
    emitp(event) {
        if (!this.$isStrVal(event)) return Promise.reject();
        var args = this.$toArr(arguments, 1),
        prm;
        if (args.length < 1) {
            args = null;
            prm = Promise.resolve();
        } else if (this.$isPromise(args[args.length - 1])) {
            prm = args.pop();
            if (args.length < 1) args = null;
        }
        event = event.split(' ');
        for (var i = 0, l = event.length, e; i < l; i++) {
            e = event[i];
            if (this._events.list[e]) this._emit_event(e, args, prm);
        }
        return prm;
    }
    _add_event(event, fn, once, keep) {
        if (!this.$isStrVal(event) || !this.$isFunc(fn)) return this;
        event = event.split(' ');
        for (var i = 0, l = event.length, e; i < l; i++) {
            e = event[i];
            if (e === 'ready' && this.is_ready) {
                fn.call(this);
                continue;
            }
            if (e === 'ready' || e === 'destroy') once = 1;
            if (!this._events.list[e]) {
                this._events.list[e] = [];
                if (e.indexOf(this._realtime) === 0) {
                    this._events.real[e] = this._make_realtime_fn(e);
                    frappe.realtime.on(e, this._events.real[e]);
                }
            }
            this._events.list[e].push({f: fn, o: once, s: keep});
        }
        return this;
    }
    _make_realtime_fn(e) {
        return this.$fn(function(ret) {
            var obj = this.$isDataObjVal(ret);
            if (obj) {
                ret = ret.message || ret;
                obj = this.$isDataObjVal(ret);
            }
            this._emit_event(
                e, [ret], !obj || !this.$isVal(ret.delay)
                ? Promise.resolve() : Promise.wait(700)
            );
        });
    }
    _del_event(e, fn) {
        if (!fn) {
            if (this._events.real[e])
                frappe.realtime.off(e, this._events.real[e]);
            delete this._events.list[e];
            delete this._events.real[e];
            return;
        }
        var evs = this._events.list[e].slice(),
        ret = [];
        for (var i = 0, x = 0, l = evs.length; i < l; i++) {
            if (evs[i].f !== fn) ret[x++] = evs[i];
        }
        if (!ret.length) this._del_event(e);
        else this._events.list[e] = ret;
    }
    _emit_event(e, args, p) {
        var evs = this._events.list[e].slice(),
        ret = [];
        for (var i = 0, x = 0, l = evs.length, ev; i < l; i++) {
            ev = evs[i];
            if (!p) this.$call(ev.f, args);
            else p.then(this.$afn(ev.f, args));
            if (ev.s || !ev.o) ret[x++] = ev;
        }
        if (!ret.length) this._del_event(e);
        else this._events.list[e] = ret;
    }
    _clear_events(all) {
        for (var e in this._events.list) {
            if (all) this._del_event(e);
            else this._filter_event(e);
        }
        return this;
    }
    _filter_event(e) {
        var evs = this._events.list[e].slice(),
        ret = [];
        for (var i = 0, x = 0, l = evs.length; i < l; i++) {
            if (evs[i].s) ret[x++] = evs[i];
        }
        if (!ret.length) this._del_event(e);
        else this._events.list[e] = ret;
    }
    
    init_form(frm) {
        if (!frm) frm = window.cur_frm;
        if (!frm || this.$isVal(frm[this._key])) return this;
        frm[this._key] = {
            is_ready: false,
            app_disabled: false,
            form_disabled: false,
            has_intro: false,
            fields_disabled: [],
            tables_disabled: {},
        };
        this.on('ready', function() {
            if (frm) frm[this._key].is_ready = true;
        });
        return this;
    }
    clean_form(frm) {
        if (!frm) frm = window.cur_frm;
        if (frm) delete frm[this._key];
        return this;
    }
    setup_form(frm, workflow) {
        if (!frm) frm = window.cur_frm;
        if (!frm) return this;
        this.init_form(frm);
        frm[this._key].app_disabled = this.is_enabled;
        if (this.is_enabled) this.enable_form(frm, workflow);
        else this.disable_form(frm, this._name + ' app is disabled.', null, workflow);
        return this;
    }
    enable_form(frm, workflow) {
        if (!frm) frm = window.cur_frm;
        if (!frm) return this;
        this.init_form(frm);
        if (!frm[this._key].form_disabled) return this.emit('form_enabled');
        var fields = frm[this._key].fields_disabled;
        if (!fields.length) return this;
        try {
            for (var i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i];
                if (f && fields.indexOf(f.df.fieldname) < 0) continue;
                if (f.df.fieldtype === 'Table') this.enable_table(frm, f.df.fieldname);
                else this.enable_field(frm, f.df.fieldname);
            }
            if (this._no_workflow(frm, workflow)) frm.enable_save();
            else frm.page.show_actions_menu();
            if (frm[this._key].has_intro) {
                frm[this._key].has_intro = false;
                frm.set_intro();
            }
        } catch(e) {
            this._error('Enable form error', e.message, e.stack);
        } finally {
            frm[this._key].form_disabled = false;
            if (frm[this._key].fields_disabled.length) {
                frm[this._key].fields_disabled = [];
                frm[this._key].tables_disabled = {};
            }
            this._has_error = false;
            this.emit('form_enabled');
        }
        return this;
    }
    disable_form(frm, msg, args, workflow, color) {
        this.init_form(frm);
        if (frm[this._key].form_disabled) return this.emit('form_disabled');
        if (!this.$isVal(color) && this.$isStr(workflow)) {
            if (workflow.length) color = workflow;
            workflow = null;
        }
        if (!this.$isStrVal(msg)) msg = null;
        else if (this.$isBoolLike(args)) {
            workflow = !!args;
            args = null;
        } else if (!this.$isArrVal(args) && !this.$isDataObjVal(args)) {
            args = null;
        }
        try {
            for (var i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i];
                if (f.df.fieldtype === 'Table') this.disable_table(frm, f.df.fieldname);
                else this.disable_field(frm, f.df.fieldname);
            }
            if (this._no_workflow(frm, workflow)) frm.disable_save();
            else frm.page.hide_actions_menu();
            if (msg) {
                frm[this._key].has_intro = true;
                frm.set_intro(__(msg, args), color || 'red');
            }
        } catch(e) {
            this._error('Disable form error', e.message, e.stack);
        } finally {
            frm[this._key].form_disabled = true;
            this._has_error = false;
            this.emit('form_disabled');
        }
        return this;
    }
    _no_workflow(frm, workflow) {
        try {
            return !frm || !!frm.is_new() || !workflow
                || !frm.states || !frm.states.get_state();
        } catch(_) {}
        return true;
    }
    
    enable_field(frm, key) {
        this.init_form(frm);
        if (!!frm[this._key].tables_disabled[key]) return this;
        var field = frm.get_field(key);
        if (
            !field || !field.df || !field.df.fieldtype
            || !this._is_field(field.df.fieldtype)
        ) return this;
        if (frm[this._key].fields_disabled.indexOf(key) >= 0)
            frm[this._key].fields_disabled.splice(
                frm[this._key].fields_disabled.indexOf(key), 1
            );
        frm.set_df_property(key, 'read_only', 0);
        if (!!cint(field.df.translatable) && field.$wrapper) {
            var $btn = field.$wrapper.find('.clearfix .btn-translation');
            if ($btn.length) $btn.show();
        }
        return this;
    }
    disable_field(frm, key) {
        this.init_form(frm);
        if (
            frm[this._key].fields_disabled.indexOf(key) >= 0
            || !!frm[this._key].tables_disabled[key]
        ) return this;
        var field = frm.get_field(key);
        if (
            !field || !field.df || !field.df.fieldtype
            || !this._is_field(field.df.fieldtype)
        ) return this;
        frm[this._key].fields_disabled.push(key);
        frm.set_df_property(key, 'read_only', 1);
        if (!!cint(field.df.translatable) && field.$wrapper) {
            var $btn = field.$wrapper.find('.clearfix .btn-translation');
            if ($btn.length) $btn.hide();
        }
        return this;
    }
    _is_field(type) {
        return ['Tab Break', 'Section Break', 'Column Break', 'Table'].indexOf(type) < 0;
    }
    
    enable_table(frm, key) {
        this.init_form(frm);
        if (!frm[this._key].tables_disabled[key]) return this;
        var obj = frm[this._key].tables_disabled[key],
        grid = frm.get_field(key).grid;
        delete frm[this._key].tables_disabled[key];
        frm[this._key].fields_disabled.splice(
            frm[this._key].fields_disabled.indexOf(key), 1
        );
        if (grid.meta && this.$isVal(obj.editable_grid))
            grid.meta.editable_grid = obj.editable_grid;
        if (this.$isVal(obj.static_rows)) grid.static_rows = obj.static_rows;
        if (this.$isVal(obj.sortable_status)) grid.sortable_status = obj.sortable_status;
        if (this.$isVal(obj.header_row))
            grid.header_row.configure_columns_button.show();
        if (this.$isVal(obj.header_search))
            grid.header_search.wrapper.show();
        if (grid.wrapper)
            this._toggle_buttons(grid.wrapper, obj, true);
        frm.refresh_field(key);
        return this;
    }
    disable_table(frm, key) {
        this.init_form(frm);
        if (frm[this._key].tables_disabled[key]) return this;
        var field = frm.get_field(key);
        if (!field || !field.df || !field.df.fieldtype || field.df.fieldtype !== 'Table') return this;
        var grid = field.grid;
        if (!grid) return this;
        frm[this._key].fields_disabled.push(key);
        var obj = frm[this._key].tables_disabled[key] = {};
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
        if (grid.wrapper)
            this._toggle_buttons(grid.wrapper, obj, false);
        frm.refresh_field(key);
        return this;
    }
    _toggle_buttons(grid, obj, show) {
        var btns = {
            add_row: '.grid-add-row',
            add_multi_row: '.grid-add-multiple-rows',
            download: '.grid-download',
            upload: '.grid-upload',
        },
        $btn;
        for (var k in btns) {
            if (show && !this.$isVal(obj[k])) continue;
            $btn = grid.find(btns[k]);
            if ($btn.length && $btn.is(':visible') != show) {
                if (show) $btn.show();
                else {
                    obj[k] = 1;
                    $btn.hide();
                }
            }
        }
    }
    
    invalid_field(frm, key, error, args) {
        var field = frm.get_field(key);
        if (!field) return this;
        var change = 0;
        if (field.df && !field.df.invalid) {
            field.df.invalid = 1;
            if (this.$isFunc(field.set_invalid))
                field.set_invalid();
            change++;
        }
        if (this.$isStrVal(error)) {
            if (this.$isFunc(field.set_new_description)) {
                field.set_new_description(__(error, args));
                change++;
            } else if (this.$isFunc(field.set_description)) {
                if (field.df && field.df.description)
                    field.df.old_description = field.df.description;
                field.set_description(__(error, args));
                change++;
            }
        }
        if (change) frm.refresh_field(key);
        return this;
    }
    valid_field(frm, key) {
        var field = frm.get_field(key);
        if (!field) return this;
        var change = 0;
        if (field.df && field.df.invalid) {
            field.df.invalid = 0;
            if (this.$isFunc(field.set_invalid))
                field.set_invalid();
            change++;
        }
        if (this.$isFunc(field.set_description)) {
            if (field.df && field.df.old_description) {
                field.df.description = field.df.old_description;
                delete field.df.old_description;
            }
            field.set_description();
            change++;
        }
        if (change) frm.refresh_field(key);
        return this;
    }
}


class Alerts extends LevelUp {
    constructor() {
        super(
            'Alerts',
            'alerts',
            'alerts.utils',
            true
        );
        
        this.$getter('_id', frappe.utils.get_random(5), null, 1);
        this.$getter('is_ready', false);
        this.$getter('is_enabled', false);
        
        this._dialog = null;
        this._init = 0;
        this._list = [];
        this._seen = [];
        this._seen_retry = 0;
        this._mock = null;
        
        if (cstr(window.location.pathname).indexOf('Alerts%20Settings') >= 0)
            this._setup(1);
        else
            this.request('is_enabled', null, this._setup);
    }
    get has_alerts() { return !!this._list.length; }
    mock() {
        this._mock = this._mock || new AlertsMock();
        return this._mock;
    }
    show(data) {
        if (this.$isDataObjVal(data)) data = [data];
        if (this.$isArrVal(data)) this._queue(data);
        if (!this.has_alerts) return this;
        return this._render();
    }
    _setup(ret) {
        this._is_ready = true;
        this._is_enabled = !!ret;
        if (!frappe.socketio.socket) frappe.socketio.init();
        this.on('alerts_app_status_changed', function(ret) {
            if (!ret || !this.$isVal(ret.is_enabled)) return;
            var old = this._is_enabled;
            this._is_enabled = !!ret.is_enabled;
            if (this._is_enabled !== old) {
                this.emit('change');
                if (this._is_enabled && !this._init)
                    this._get_alerts();
                else if (this._is_enabled) this.show();
            }
        }, 1)
        .on('alerts_show_alert', function(ret) {
            this._debug('alerts_show_alert', ret);
            if (
                this._is_enabled
                && this.$isDataObjVal(ret)
                && this._is_valid(ret)
            ) this.show(ret);
        }, 1);
        this.emit('ready');
        if (this._is_enabled)
            window.setTimeout(this.$fn(this._get_alerts), 700);
    }
    _get_alerts() {
        if (this._init) return;
        this._init = 1;
        this.request(
            'user_alerts',
            null,
            function(ret) {
                this._init = 1;
                this._debug('Getting user alerts.', ret);
                if (this.$isDataObjVal(ret) && this.$isArrVal(ret.alerts)) {
                    if (this._is_enabled) this.show(ret.alerts);
                    else this._queue(ret.alerts);
                }
            },
            function(e) {
                this._init = 0;
                this._error('Getting user alerts failed.', e.message);
            }
        );
    }
    _is_valid(data) {
        if (!this.$isDataObjVal(data)) return false;
        if (this._seen.indexOf(data.name) >= 0) return false;
        var user = frappe.session.user,
        score = 0;
        if (
            this.$isArrVal(data.users)
            && data.users.indexOf(user) >= 0
        ) score++;
        if (
            !score
            && this.$isArrVal(data.roles)
            && frappe.user.has_role(data.roles)
        ) score++;
        if (!score) return false;
        if (
            this.$isArrVal(data.seen_today)
            && data.seen_today.indexOf(user) >= 0
        ) return false;
        var seen_by = this.$isDataObj(data.seen_by) ? data.seen_by : {},
        seen = seen_by[user] != null ? cint(seen_by[user]) : -1;
        if (cint(data.is_repeatable) < 1 && seen > 0) return false;
        if (seen >= cint(data.number_of_repeats)) return false;
        return true;
    }
    _queue(data) { this._list.push.apply(this._list, data); }
    _render() {
        if (this._list.length) this._render_dialog();
        else if (this._seen.length) this._mmark_seens();
        return this;
    }
    _render_dialog() {
        if (!this._dialog)
            this._dialog = new AlertsDialog(this._id, 'alerts-dialog-' + this._id);
        
        var data = this._list.shift();
        this._dialog
            .setName(data.name)
            .setTitle(data.title)
            .setMessage(data.message)
            .setStyle(
                data.background,
                data.border_color,
                data.title_color,
                data.content_color
            )
            .setTimeout(data.display_timeout)
            .setSound(
                data.display_sound,
                data.custom_display_sound
            )
            .onShow(this.$fn(function() {
                this._seen.push(this._dialog.name);
            }))
            .onHide(this.$fn(this._render), 200)
            .render()
            .show();
    }
    _mmark_seens() {
        var seen = this._seen.splice(0, this._seen.length);
        this.request(
            'mark_seens',
            {names: seen},
            function(ret) {
                if (!this.$isDataObjVal(ret)) {
                    this._seen.push.apply(this._seen, seen);
                    this._error('Marking alerts as seen error.', ret, seen);
                    this._retry_mark_seens();
                } else if (!!ret.error) {
                    this._seen.push.apply(this._seen, seen);
                    this._error('Marking alerts as seen error.', ret, seen);
                    this._retry_mark_seens();
                }
            },
            function(e) {
                this._seen.push.apply(this._seen, seen);
                this._error('Marking alerts as seen error.', seen, e && e.message);
                this._retry_mark_seens();
            }
        );
    }
    _retry_mark_seens() {
        if (!this._seen_retry) {
            this._seen_retry++;
            window.setTimeout(this.$fn(this._mmark_seens), 2000);
        } else {
            this._seen_retry = 0;
            this.error(this._name + ' app is currently facing a problem.');
        }
    }
    destroy() {
        frappe.alerts = null;
        if (this._dialog) try { this._dialog.destroy(); } catch(_) {}
        if (this._mock) try { this._mock.destroy(); } catch(_) {}
        super.destroy();
    }
}


class AlertsMock extends LevelUpBase {
    constructor() {
        super();
        this._id = frappe.utils.get_random(5);
    }
    build(data) {
        if (!this.$isDataObjVal(data)) return this;
        if (!this._dialog) this._dialog = new AlertsDialog(this._id, 'alerts-mock-dialog-' + this._id);
        this._dialog
            .setTitle(data.name)
            .setMessage(data.message || 'This is a mock alert message.')
            .setStyle(
                data.background,
                data.border_color,
                data.title_color,
                data.content_color
            )
            .setTimeout(data.display_timeout)
            .setSound(
                data.display_sound,
                data.custom_display_sound
            )
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


class AlertsDialog extends LevelUpBase {
    constructor(id, _class) {
        super();
        this._id = id;
        this._class = _class;
        this._opts = {};
        this._sound = {loaded: 0, playing: 0, timeout: null};
        this.$getter('name', '');
    }
    setName(text) {
        if (this.$isStrVal(text)) this._name = text;
        return this;
    }
    setTitle(text, args) {
        if (this.$isStrVal(text))
            this._opts.title = __(text, args);
        return this;
    }
    setMessage(text, args) {
        if (this.$isStrVal(text))
            this._message = __(text, args);
        return this;
    }
    setStyle(background, border, title, content) {
        if (!this._style) this._style = new AlertsStyle(this._id, this._class);
        this._style.build(background, border, title, content);
        return this;
    }
    setTimeout(sec) {
        if (this.$isNumVal(sec)) this._timeout = sec * 1000;
        return this;
    }
    setSound(file, fallback) {
        this.stopSound();
        this._sound.loaded = 0;
        if (!this.$isStrVal(file) || file === 'None') return this;
        if (file === 'Custom') file = fallback;
        else file = '/assets/frappe/sounds/' + file.toLowerCase() + '.mp3';
        if (!this.$isStrVal(file)) return this;
        if (!this.$sound) {
            this.$sound = $('<audio>')
                .attr({
                    id: 'sound-' + this._id,
                    volume: '0.2',
                    preload: 'auto',
                })
                .click(function(e) {
                    try { $(e.target).play(); } catch(_) {}
                })
                .hide();
            $('body').append(this.$sound);
        }
        this.$sound
            .attr('src', file)
            .off('canplaythrough')
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
            if (!this.$isNumVal(delay)) this._on_show = this.$fn(fn);
            else this._on_show = this.$fn(function() {
                window.setTimeout(this.$fn(fn), delay);
            });
        }
        return this;
    }
    onHide(fn, delay) {
        if (this.$isFunc(fn)) {
            if (!this.$isNumVal(delay)) this._on_hide = this.$fn(fn);
            else this._on_hide = this.$fn(function() {
                window.setTimeout(this.$fn(fn), delay);
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
            this.$sound.click();
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
            try {
                this._dialog.$wrapper.modal('destroy');
            } catch(_) {}
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


class AlertsStyle extends LevelUpBase {
    constructor(id, _class) {
        super();
        this._id = 'style-' + id;
        this._class = _class;
        this._dom = document.getElementById(this._id);
        if (!this._dom) {
            this._dom = document.createElement('style');
            this._dom.id = this._id;
            this._dom.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(this._dom);
        }
    }
    build(background, border, title, content) {
        var sel = '.$0>.modal-dialog>.modal-content'.replace('$0', this._class),
        css = [];
        if (this.$isStrVal(background))
            css.push('$0{background:$1!important}'.replace('$0', sel).replace('$1', background));
        if (this.$isStrVal(border))
            css.push(
                '$0,$0>.modal-header,$0>.modal-footer{border:1px solid $1!important}'
                .replace(/\$0/g, sel).replace('$1', border)
            );
        if (this.$isStrVal(title))
            css.push(
                ('$0>$1>$2>.modal-title{color:$3!important}'
                + '$0>$1>$2>.indicator::before{background:$3!important}'
                + '$0>$1>.modal-actions>.btn{color:$3!important}')
                .replace(/\$0/g, sel).replace(/\$1/g, '.modal-header')
                .replace(/\$2/g, '.title-section').replace(/\$3/g, title)
            );
        if (this.$isStrVal(content))
            css.push(
                '$0>$1,$0>$1>.alerts-message{color:$2!important}'
                .replace(/\$0/g, sel).replace(/\$1/g, '.modal-body')
                .replace('$2', content)
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
        if (this._dom)
            this._dom.parentNode.removeChild(this._dom);
        super.destroy();
    }
}


$(document).ready(function() {
    frappe.alerts = new Alerts();
});
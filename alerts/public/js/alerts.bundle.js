/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


window.addEventListener('load', function() {
    function $isFn(v) { return typeof v === 'function'; }
    (function() {
        let id = 'core-polyfill';
        function onload() {
            if (!$isFn(Promise.wait))
                Promise.wait = function(ms) {
                    return new Promise(function(resolve) {
                        window.setTimeout(resolve, ms);
                    });
                };
            if (!$isFn(Promise.prototype.timeout))
                Promise.prototype.timeout = function(ms) {
                    return Promise.race([
                        this,
                        Promise.wait(ms)
                            .then(function() { throw new Error('Time out'); })
                    ]);
                };
        }
        if ($isFn(String.prototype.trim) && $isFn(window.Promise)) onload();
        else {
            let $el = document.getElementById(id);
            if (!!$el) onload();
            else {
                $el = document.createElement('script');
                $el.id = id;
                $el.src = 'https://polyfill.io/v3/polyfill.min.js?features=String.prototype.trim%2CPromise';
                $el.type = 'text/javascript';
                $el.async = true;
                $el.onload = onload;
                document.getElementsByTagName('head')[0].appendChild($el);
            }
        }
    }());
}, {capture: true, once: true, passive: true});


class LevelUpCore {
    destroy() {
        for (let k in this) { if (this.$hasProp(k)) delete this[k]; }
    }
    $type(v) {
        if (v == null) return v === null ? 'Null' : 'Undefined';
        let t = Object.prototype.toString.call(v).slice(8, -1);
        return t === 'Number' && isNaN(v) ? 'NaN' : t;
    }
    $isStr(v) { return v != null && this.$type(v) === 'String'; }
    $isStrVal(v) { return this.$isStr(v) && v.length; }
    $isNum(v) { return v != null && this.$type(v) === 'Number' && isFinite(v); }
    $isNumVal(v, n) { return this.$isNum(v) && (!n ? v > 0 : v < 0); }
    $isBool(v) { return v === true || v === false; }
    $isBoolLike(v) {
        return this.$isBool(v) || (this.$isNum(v) && (v === 0 || v === 1));
    }
    $isFunc(v) {
        return v != null && (typeof v === 'function' || /(Function|^Proxy)$/.test(this.$type(v)));
    }
    $isArr(v) { return v != null && $.isArray(v); }
    $isArrVal(v) { return this.$isArr(v) && v.length; }
    $isArgs(v) { return v != null && this.$type(v) === 'Arguments'; }
    $isArgsVal(v) { return this.$isArgs(v) && v.length; }
    $isArrLike(v) {
        return this.$isObjLike(v) && !this.$isStr(v) && this.$isNum(v.length);
    }
    $isObjLike(v) { return v != null && typeof v === 'object'; }
    $isDataObj(v) { return v != null && $.isPlainObject(v); }
    $isDataObjVal(v) { return this.$isDataObj(v) && !$.isEmptyObject(v); }
    $isPromise(v) { return v != null && this.$type(v) === 'Promise'; }
    $isEmpty(v) {
        return v == null || v === '' || v === 0 || v === false || $.isEmptyObject(v);
    }
    $hasProp(k, o) { return Object.prototype.hasOwnProperty.call(o || this, k); }
    $def(p, s, o) { return this.$extend(p, 0, o).$extend(s, 1, 0); }
    $extend(v, i, o) {
        if (!this.$isDataObjVal(v)) return this;
        let s = this.$isBoolLike(i);
        if (!s && !this.$isArrVal(i)) i = null;
        for (let k in v) this.$getter(k, v[k], s || (i && i.indexOf(k) < 0), o);
        return this;
    }
    $getter(k, v, s, o) {
        o = o || this;
        if (!s) o['_' + k] = v;
        if (o[k] == null)
            Object.defineProperty(o, k, s ? {get() { return v; }}
                 : {get() { return this['_' + k]; }});
        return this;
    }
    $toArr(v, s, e) { try { return Array.prototype.slice.call(v, s, e); } catch(_) { return []; } }
    $toJson(v, d) { try { return JSON.stringify(v); } catch(_) { return d; } }
    $parseJson(v, d) { try { return JSON.parse(v); } catch(_) { return d; } }
    $fn() {
        let a = this.$toArr(arguments);
        a[1] = a[1] || this;
        return $.proxy.apply(null, a);
    }
    $afn(fn, a, o) {
        let d = [fn, o || this];
        if (a != null)
            !this.$isArrLike(a) ? d.push(a) : d.push.apply(d, a);
        return $.proxy.apply(null, d);
    }
    $call(fn, a, o) {
        if (a == null) a = '';
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
    $timeout(fn, tm, a) {
        if (!this.$isFunc(fn)) window.clearTimeout(fn);
        else return window.setTimeout(this.$afn(fn, a), tm);
    }
    $delayed(fn, delay, later) {
        return new LevelUpDelayer(this.$fn(fn), delay, later);
    }
}


class LevelUpDelayer {
    constructor(fn, delay, later) {
        this._fn = function(a) {
            return function() {
                if (!a.length) fn();
                else fn.apply(null, a);
            };
        };
        this._tm = delay;
        this._ref = null;
        if (!later) this.start();
    }
    start() {
        this.cancel();
        this._ref = window.setTimeout(this._fn(arguments), this._tm);
        return this;
    }
    cancel() {
        this._ref && window.clearTimeout(this._ref);
        this._ref = null;
        return this;
    }
    destroy() {
        this.cancel();
        let prop = Object.prototype.hasOwnProperty;
        for (let k in this) prop.call(this, k) && delete this[k];
    }
}


class LevelUpBase extends LevelUpCore {
    constructor(mod, key, doc, ns, prod) {
        super();
        this._mod = mod || 'Level Up';
        this._key = key || 'lu';
        this._tmp = '_' + this._key;
        this._doc = new RegExp('^' + (doc || 'LevelUp'));
        this._real = this._key + '_';
        this._pfx = '[' + this._key.toUpperCase() + ']';
        if (ns && ns.slice(-1) !== '.') ns += '.';
        this._ns = ns || '';
        this._prod = !!prod;
        this._events = {
            con: !!frappe.socketio.socket,
            list: {},
            real: {},
            once: ['ready', 'destroy', 'after_destroy']
        };
    }
    
    $alert(t, m, a, d, i, f) {
        if (a == null && this.$isArr(m)) {
            a = m;
            m = null;
        }
        if (m == null) {
            m = t;
            t = null;
        }
        if (f) this._err = 1;
        f = f ? frappe.throw : frappe.msgprint;
        f({
            title: this._pfx + ': ' + __(this.$isStrVal(t) ? t : d),
            indicator: i,
            message: __('' + m, a),
        });
        return this;
    }
    debug(t, m, a) { return this._prod ? this : this.$alert(t, m, a, 'Debug', 'gray'); }
    log(t, m, a) { return this._prod ? this : this.$alert(t, m, a, 'Log', 'cyan'); }
    info(t, m, a) { return this.$alert(t, m, a, 'Info', 'light-blue'); }
    warn(t, m, a) { return this.$alert(t, m, a, 'Warning', 'orange'); }
    error(t, m, a) { return this.$alert(t, m, a, 'Error', 'red'); }
    fatal(t, m, a) { return this.$alert(t, m, a, 'Error', 'red', 1); }
    
    $console(fn, args) {
        if (this._prod) return this;
        if (!this.$isStr(args[0])) Array.prototype.unshift.call(args, this._pfx);
        else args[0] = (this._pfx + ' ' + args[0]).trim();
        (console[fn] || console.log).apply(null, args);
        return this;
    }
    _debug() { return this.$console('debug', arguments); }
    _log() { return this.$console('log', arguments); }
    _info() { return this.$console('info', arguments); }
    _warn() { return this.$console('warn', arguments); }
    _error() { return this.$console('error', arguments); }
    
    get_method(v) { return this._ns + v; }
    request(method, args, callback, error, _freeze) {
        if (method.indexOf('.') < 0) method = this.get_method(method);
        if (!this.$isFunc(callback)) callback = null;
        if (!this.$isFunc(error)) error = null;
        let opts = {
            method: method,
            freeze: _freeze != null,
            callback: this.$fn(function(ret) {
                if (this.$isDataObj(ret)) ret = ret.message || ret;
                if (!this.$isDataObj(ret) || !ret.error) {
                    callback && callback.call(this, ret);
                    return;
                }
                if (this.$isDataObjVal(ret)) {
                    if (this.$isStrVal(ret.message)) ret = ret.message;
                    else if (this.$isStrVal(ret.error)) ret = ret.error;
                }
                if (!this.$isStrVal(ret)) ret = 'The request sent returned an invalid response.';
                if (!error) this.error(ret, args);
                else error.call(this, {message: __(ret, args)});
            }),
            error: this.$fn(function(ret, txt) {
                if (this.$isStrVal(txt)) ret = txt;
                else if (!this.$isStrVal(ret)) ret = 'The request sent raised an error.';
                this._error(ret, method, args);
                if (!error) this.error(ret);
                else error.call(this, {message: __(ret, args)});
            })
        };
        if (this.$isDataObjVal(args)) {
            opts.type = 'POST';
            opts.args = args;
        }
        try { frappe.call(opts); } catch(e) {
            this._error(e.message, e.stack);
            if (!error) this.error(e.message);
            else error.call(this, e);
            if (this._err) throw e;
        } finally { this._err = 0; }
        return this;
    }
    
    on(ev, fn, st)  { return this._on(ev, fn, 0, st); }
    once(ev, fn, st) { return this._on(ev, fn, 1, st); }
    real(ev, fn, st) { return this._on(ev, fn, 0, st, 1); }
    off(ev, fn) {
        if (ev == null) return this._off();
        if (this.$isBoolLike(ev)) return this._off(0, 1);
        if (!this.$isStrVal(ev)) return this;
        if (!this.$isFunc(fn)) fn = null;
        ev = ev.split(' ');
        for (let i = 0, l = ev.length; i < l; i++)
            this._events.list[ev[i]] && this._off(ev[i], fn);
        return this;
    }
    emit(ev) {
        if (!this.$isStrVal(ev)) return this;
        let a = this.$toArr(arguments, 1);
        if (a.length < 1) a = null;
        ev = ev.split(' ');
        for (let i = 0, l = ev.length; i < l; i++)
            this._events.list[ev[i]] && this._emit(ev[i], a);
        return this;
    }
    _on(ev, fn, nc, st, rl) {
        if (!this.$isStrVal(ev) || !this.$isFunc(fn)) return this;
        ev = ev.split(' ');
        for (let es = this._events, i = 0, l = ev.length, e; i < l; i++) {
            e = (rl ? this._real : '') + ev[i];
            if (e === es.once[0] && this.is_ready) {
                fn.call(this);
                continue;
            }
            if (es.once.indexOf(e) >= 0) nc = 1;
            if (!es.list[e]) {
                es.list[e] = [];
                if (es.con && (rl || e.indexOf(this._real) === 0))
                    frappe.realtime.on(e, es.real[e] = this._rfn(e));
            }
            es.list[e].push({f: fn, o: nc, s: st});
        }
        return this;
    }
    _rfn(e) {
        return this.$fn(function(ret) {
            if (this.$isDataObj(ret)) ret = ret.message || ret;
            if (ret != null) ret = [ret];
            this._emit(
                e, ret, ret == null || ret.delay == null
                ? Promise.resolve() : Promise.wait(700)
            );
        });
    }
    _off(e, fn) {
        if (e && fn) this._del(e, fn);
        else if (!e) {
            for (let ev in this._events.list) {
                if (fn) this._off(ev, fn);
                else this._del(ev);
            }
        } else {
            let es = this._events;
            es.real[e] && frappe.realtime.off(e, es.real[e]);
            delete es.list[e];
            delete es.real[e];
        }
    }
    _del(e, fn) {
        let ev = this._events.list[e].slice(),
        ret = [];
        for (let x = 0, i = 0, l = ev.length; i < l; i++) {
            if (fn ? ev[i].f !== fn : ev[i].s) ret[x++] = ev[i];
        }
        if (!ret.length) this._off(e);
        else this._events.list[e] = ret;
    }
    _emit(e, a, p) {
        let ev = this._events.list[e].slice(),
        ret = [];
        for (let x = 0, i = 0, l = ev.length, f; i < l; i++) {
            f = a ? this.$afn(ev[i].f, a) : this.$fn(ev[i].f);
            !p ? f() : p.then(f);
            if (ev[i].s || !ev[i].o) ret[x++] = ev[i];
        }
        if (!ret.length) this._off(e);
        else this._events.list[e] = ret;
    }
}


class LevelUp extends LevelUpBase {
    constructor(mod, key, doc, ns, prod) {
        super(mod, key, doc, ns, prod);
        this._router = {obj: null, old: 0};
        this._window = {
            events: {
                unload: this.$fn(this.destroy),
                popstate: this.$fn(function() {
                    this._window.change.start(0);
                    this._window.changed.start(0);
                }),
                change: this.$fn(function() {
                    this._window.change.start(1);
                    this._window.changed.start(1);
                }),
            },
            change: this.$delayed(function(n) {
                this.emit(n ? 'page_change' : 'page_pop');
            }, 600, 1),
            changed: this.$delayed(function(n) {
                n = n ? 'page_changed' : 'page_popped';
                if (this.is_self_form()) this.emit(n);
                else this.clean_form().emit(n).off();
            }, 1200, 1),
        };
        $(document).ready(this.$fn(function() {
            window.addEventListener('beforeunload', this._window.events.unload);
            window.addEventListener('popstate', this._window.events.popstate);
            this._change_listener('on');
        }));
    }
    
    options(opts) { return this.$extend(opts, 1); }
    destroy() {
        this._window.change.destroy();
        this._window.changed.destroy();
        window.removeEventListener('beforeunload', this._on_unload);
        window.removeEventListener('popstate', this._state_popped);
        this._change_listener('off');
        this.clean_form();
        this.emit('destroy').emit('after_destroy').off(1);
        super.destroy();
    }
    _change_listener(fn) {
        if (!this._router.obj)
            for (let ks = ['router', 'route'], i = 0, l = ks.length; i < l; i++) {
                if (!frappe[ks[i]]) continue;
                this._router.obj = frappe[ks[i]];
                this._router.old = i < 1;
                break;
            }
        if (this._router.obj && this.$isFunc(this._router.obj[fn]))
            this._router.obj[fn]('change', this._window.events.change);
    }
    
    _route(i, l) {
        if (this._router.obj)
            try {
                let v;
                if (this._router.old) v = this._router.obj.parse()[i];
                else v = (frappe.get_route() || this._router.obj.parse())[i];
                if (v) return l ? v.toLowerCase() : v;
            } catch(_) {}
        return 'app';
    }
    
    get is_form() { return this._route(0, 1) === 'form'; }
    is_doctype(v) { return this._route(1) === v; }
    
    is_self_form(frm) {
        if (!this.is_form) return false;
        frm = this._get_form(frm);
        return this._doc.test(frm && this.$isStrVal(frm.doctype)
            ? frm.doctype.toLowerCase() : this._route(1, 1));
    }
    _get_form(frm) {
        frm = frm || window.cur_frm;
        return this.$isObjLike(frm) ? frm : null;
    }
    
    init_form(frm) {
        this._window.changed.cancel();
        this.off();
        frm = this._get_form(frm);
        if (!frm) return this;
        delete frm[this._tmp];
        frm[this._tmp] = {
            is_ready: 0,
            app_disabled: 0,
            form_disabled: 0,
            has_intro: 0,
            fields_disabled: [],
        };
        return this;
    }
    clean_form(frm) {
        this._window.changed.cancel();
        frm = this._get_form(frm);
        if (frm) delete frm[this._tmp];
        return this;
    }
    
    setup_form(frm, workflow) {
        this.init_form(frm);
        if (!this.is_self_form(frm)) return this;
        try {
            frm[this._tmp].app_disabled = this.is_enabled;
            if (this.is_enabled) this.enable_form(frm, workflow);
            else this.disable_form(frm, '{0} app is disabled.', [this._mod], workflow);
        } catch(e) {
            this._error('Setup form error', e.message, e.stack);
        }
        return this;
    }
    enable_form(frm, workflow) {
        frm = this._get_form(frm);
        if (!frm) return this;
        let self = this.is_self_form(frm);
        try {
            if (self) {
                if (!frm[this._tmp].form_disabled) return this.emit('form_enabled');
                let fields = frm[this._tmp].fields_disabled;
                if (!fields.length) return this;
            }
            for (let i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i];
                if (f && fields.indexOf(f.df.fieldname) < 0) continue;
                if (f.df.fieldtype === 'Table') this.enable_table(frm, f.df.fieldname);
                else this.enable_field(frm, f.df.fieldname);
            }
            if (this._no_workflow(frm, workflow)) frm.enable_save();
            else frm.page.show_actions_menu();
            if (self && frm[this._tmp].has_intro) {
                frm[this._tmp].has_intro = 0;
                frm.set_intro();
            }
        } catch(e) { this._error('Enable form', e.message, e.stack); }
        finally {
            if (self)
                try {
                    frm[this._tmp].form_disabled = 0;
                    if (frm[this._tmp].fields_disabled.length)
                        frm[this._tmp].fields_disabled = [];
                } catch(_) {}
            this.emit('form_enabled');
        }
        return this;
    }
    disable_form(frm, msg, args, workflow, color) {
        frm = this._get_form(frm);
        if (!frm) return this;
        let self = this.is_self_form(frm);
        try {
            if (self && frm[this._tmp].form_disabled) return this.emit('form_disabled');
            if (color == null && this.$isStr(workflow)) {
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
            for (let i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i].df;
                this[f.fieldtype === 'Table' ? 'disable_table' : 'disable_field'](frm, f.fieldname);
            }
            if (this._no_workflow(frm, workflow)) frm.disable_save();
            else frm.page.hide_actions_menu();
            if (msg) {
                if (self) frm[this._tmp].has_intro = 1;
                frm.set_intro(__(msg, args), color || 'red');
            }
        } catch(e) { this._error('Disable form', e.message, e.stack); }
        finally {
            if (self)
                try { frm[this._tmp].form_disabled = 1; } catch(_) {}
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
        frm = this._get_form(frm);
        if (!frm) return this;
        try {
            let self = this.is_self_form(frm),
            obj = self ? frm[this._tmp] : null;
            if (self && obj.fields_disabled.indexOf(key) < 0) return this;
            let field = frm.get_field(key);
            if (
                !field || !field.df || !field.df.fieldtype
                || !this._is_field(field.df.fieldtype)
            ) return this;
            if (self)
                obj.fields_disabled.splice(obj.fields_disabled.indexOf(key), 1);
            frm.set_df_property(key, 'read_only', 0);
            if (!!cint(field.df.translatable) && field.$wrapper) {
                let $btn = field.$wrapper.find('.clearfix .btn-translation');
                if ($btn.length) $btn.show();
            }
        } catch(e) { this._error('Enable field', e.message, e.stack); }
        return this;
    }
    disable_field(frm, key) {
        frm = this._get_form(frm);
        if (!frm) return this;
        let self = this.is_self_form(frm);
        try {
            if (self && frm[this._tmp].fields_disabled.indexOf(key) >= 0) return this;
            let field = frm.get_field(key);
            if (
                !field || !field.df || !field.df.fieldtype
                || !this._is_field(field.df.fieldtype)
            ) return this;
            if (self) frm[this._tmp].fields_disabled.push(key);
            frm.set_df_property(key, 'read_only', 1);
            if (!!cint(field.df.translatable) && field.$wrapper) {
                let $btn = field.$wrapper.find('.clearfix .btn-translation');
                if ($btn.length) $btn.hide();
            }
        } catch(e) { this._error('Disable field', e.message, e.stack); }
        return this;
    }
    _is_field(type) {
        return ['Tab Break', 'Section Break', 'Column Break', 'Table'].indexOf(type) < 0;
    }
    
    enable_table(frm, key) {
        frm = this._get_form(frm);
        if (!frm) return this;
        try {
            let self = this.is_self_form(frm),
            obj = self ? frm[this._tmp] : null;
            if (self && obj.fields_disabled.indexOf(key) < 0) return this;
            let grid = frm.get_field(key).grid;
            if (self)
                obj.fields_disabled.splice(obj.fields_disabled.indexOf(key), 1);
            if (grid.meta && grid.meta._editable_grid != null) {
                grid.meta.editable_grid = grid.meta._editable_grid;
                delete grid.meta._editable_grid;
            }
            if (grid._static_rows != null) {
                grid.static_rows = grid._static_rows;
                delete grid._static_rows;
            }
            if (grid._sortable_status != null) {
                grid.sortable_status = grid._sortable_status;
                delete grid._sortable_status;
            }
            if (grid._header_row != null) {
                grid.header_row.configure_columns_button.show();
                delete grid._header_row;
            }
            if (grid._header_search != null) {
                grid.header_search.wrapper.show();
                delete grid._header_search;
            }
            if (grid.wrapper) this._toggle_buttons(grid, 1, self);
            frm.refresh_field(key);
        } catch(e) { this._error('Enable table', e.message, e.stack); }
        return this;
    }
    disable_table(frm, key) {
        frm = this._get_form(frm);
        if (!frm) return this;
        try {
            let self = this.is_self_form(frm),
            obj = self ? frm[this._tmp] : null;
            if (self && obj.fields_disabled.indexOf(key) >= 0) return this;
            let field = frm.get_field(key);
            if (!field || !field.df || !field.df.fieldtype || field.df.fieldtype !== 'Table') return this;
            let grid = field.grid;
            if (!grid) return this;
            if (self) obj.fields_disabled.push(key);
            if (grid.meta) {
                grid.meta._editable_grid = grid.meta.editable_grid;
                grid.meta.editable_grid = true;
            }
            grid._static_rows = grid.static_rows;
            grid.static_rows = 1;
            grid._sortable_status = grid.sortable_status;
            grid.sortable_status = 0;
            if (
                grid.header_row && grid.header_row.configure_columns_button
                && grid.header_row.configure_columns_button.is(':visible')
            ) {
                grid._header_row = 1;
                grid.header_row.configure_columns_button.hide();
            }
            if (
                grid.header_search && grid.header_search.wrapper
                && grid.header_search.wrapper.is(':visible')
            ) {
                grid._header_search = 1;
                grid.header_row.wrapper.hide();
            }
            if (grid.wrapper) this._toggle_buttons(grid, 0, self);
            frm.refresh_field(key);
        } catch(e) { this._error('Disable table', e.message, e.stack); }
        return this;
    }
    _toggle_buttons(grid, show, self) {
        let btns = {
            _add_row: '.grid-add-row',
            _add_multi_row: '.grid-add-multiple-rows',
            _download: '.grid-download', _upload: '.grid-upload',
        },
        $btn;
        for (let k in btns) {
            if (show && self && grid[k] == null) continue;
            $btn = grid.wrapper.find(btns[k]);
            if ($btn.length)
                if (show) {
                    delete grid[k];
                    $btn.show();
                } else {
                    grid[k] = 1;
                    $btn.hide();
                }
        }
    }
    
    valid_field(frm, key) {
        frm = this._get_form(frm);
        if (!frm) return this;
        try {
            let field = frm.get_field(key);
            if (!field) return this;
            let change = 0;
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
            if (change && frm.refresh_field) frm.refresh_field(key);
        } catch(e) { this._error('Valid field', e.message, e.stack); }
        return this;
    }
    invalid_field(frm, key, error, args) {
        frm = this._get_form(frm);
        if (!frm) return this;
        try {
            let field = frm.get_field(key);
            if (!field) return this;
            let change = 0;
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
            if (change && frm.refresh_field) frm.refresh_field(key);
        } catch(e) { this._error('Invalid field', e.message, e.stack); }
        return this;
    }
}


class Alerts extends LevelUp {
    constructor() {
        super(
            'Alerts', 'alerts', 'Alert',
            'alerts.utils', false
        );
        
        this.$getter('_id', frappe.utils.get_random(5), 1);
        this.$extend({is_ready: false, is_enabled: false});
        
        this._dialog = null;
        this._init = 0;
        this._in_req = 0;
        this._styles = {};
        this._list = [];
        this._seen = [];
        this._seen_retry = 0;
        this._mock = null;
        
        if (this.is_doctype('Alerts Settings')) this._setup(1);
        else this.request('is_enabled', null, this._setup);
    }
    get has_alerts() { return !!this._list.length; }
    mock() {
        if (!this._mock) {
            this._mock = new AlertsMock();
            this._mock._slug = this._slug;
        }
        return this._mock;
    }
    show() { return this.has_alerts ? this._render() : this; }
    _setup(ret) {
        this._is_ready = true;
        this._is_enabled = !!ret;
        this.on('page_change page_pop', function() {
            if (this._is_enabled) {
                if (this.has_alerts) this.show();
                else this._get_alerts();
            }
        }, 1)
        .real('app_status_changed', function(ret) {
            this._debug('real app_status_changed', ret);
            var old = this._is_enabled;
            this.$extend(ret);
            if (this._is_enabled === old) return;
            this.emit('change');
            if (this._is_enabled) {
                if (!this._init) {
                    this._first = 1;
                    this._init = 1;
                    this._get_alerts();
                } else this.show();
            }
        }, 1)
        .real('type_changed', function(ret) {
            this._debug('real type_changed', ret);
            if (!this.$isDataObjVal(ret)) return;
            var name = cstr(ret.name);
            if (cstr(ret.action) === 'trash')
                delete this._styles[name];
            else {
                if (!this._styles[name])
                    this._styles[name] = new AlertsStyle(this._id, this._slug(name));
                this._styles[name].build(
                    ret.background, ret.border_color,
                    ret.title_color, ret.content_color,
                    ret.dark_background, ret.dark_border_color,
                    ret.dark_title_color, ret.dark_content_color
                );
            }
        }, 1)
        .real('show_alert', function(ret) {
            this._debug('real show_alert', ret);
            if (this._is_enabled && this._is_valid(ret))
                this._queue(ret);
        }, 1);
        this.emit('ready');
        if (this._is_enabled) {
            this._init = 1;
            this._first = 1;
            this.$timeout(this._get_alerts, 700);
        }
    }
    _get_alerts() {
        if (this._in_req) return;
        this._in_req = 1;
        this.request(
            'user_alerts',
            this._first ? {init: 1} : null,
            function(ret) {
                this._first = 0;
                this._in_req = 0;
                this._debug('Getting user alerts.', ret);
                if (!this.$isDataObjVal(ret)) this._init = 0;
                else {
                    this._is_enabled = !!ret.is_enabled;
                    if (this._is_enabled) {
                        if (this.$isArrVal(ret.types)) this._build_types(ret.types);
                        if (this.$isArrVal(ret.alerts)) this._queue(ret.alerts);
                    }
                }
            },
            function(e) {
                this._first = 0;
                this._init = 0;
                this._in_req = 0;
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
    _queue(data) {
        if (!this.$isArr(data)) this._list.push(data);
        else this._list.push.apply(this._list, data);
        this._list.sort(function(a, b) {
            return cint(b.priority) - cint(a.priority);
        });
        this.show();
    }
    _render() {
        if (this._list.length) this._render_dialog();
        else if (this._seen.length) this._mmark_seens();
        return this;
    }
    _render_dialog() {
        if (!this._dialog)
            this._dialog = new AlertsDialog(this._id, 'alerts-' + this._id);
        
        var data = this._list.shift();
        this._dialog
            .setName(data.name)
            .setTitle(data.title)
            .setMessage(data.message)
            .setTimeout(data.display_timeout)
            .setSound(
                data.display_sound,
                data.custom_display_sound
            )
            .onShow(this.$fn(function() {
                this._seen.push(this._dialog.name);
            }))
            .onHide(this.$fn(this._render), 200)
            .render(this._slug(data.alert_type))
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
            this.$timeout(this._mmark_seens, 2000);
        } else {
            this._seen_retry = 0;
            this.error(this.name + ' app is currently facing a problem.');
        }
    }
    _build_types(data) {
        this._destroy_types();
        for (var i = 0, l = data.length; i < l; i++)
            this._styles[data[i].name] = (
                new AlertsStyle(this._id, this._slug(data[i].name))
            ).build(
                data[i].background, data[i].border_color,
                data[i].title_color, data[i].content_color,
                data[i].dark_background, data[i].dark_border_color,
                data[i].dark_title_color, data[i].dark_content_color
            );
    }
    _destroy_types() {
        for (var k in this._styles) {
            try { this._styles[k].destroy(); } catch(_) {}
            delete this._styles[k];
        }
    }
    _slug(v) { return v.toLowerCase().replace(/ /g, '-'); }
    destroy() {
        frappe.alerts = null;
        this._destroy_types();
        if (this._dialog) try { this._dialog.destroy(); } catch(_) {}
        if (this._mock) try { this._mock.destroy(); } catch(_) {}
        super.destroy();
    }
}


class AlertsMock extends LevelUpCore {
    constructor() {
        super();
        this._id = frappe.utils.get_random(5);
    }
    build(data) {
        if (!this.$isDataObjVal(data)) return this;
        if (!this._dialog)
            this._dialog = new AlertsDialog(this._id, 'alerts-mock-' + this._id);
        this._dialog
            .setTitle('Mock Alert')
            .setMessage(data.message || 'This is a mock alert message.');
        if (data.display_timeout)
            this._dialog.setTimeout(data.display_timeout);
        if (data.display_sound)
            this._dialog.setSound(data.display_sound, data.custom_display_sound);
        if (data.alert_type)
            this._dialog.render(this._slug(data.alert_type));
        else
            this._dialog.setStyle(
                data.background, data.border_color,
                data.title_color, data.content_color,
                data.dark_background, data.dark_border_color,
                data.dark_title_color, data.dark_content_color
            );
        this._dialog.show();
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
        this._dialog && this._dialog.destroy();
        super.destroy();
    }
}


class AlertsDialog extends LevelUpCore {
    constructor(id, _class) {
        super();
        this._id = id;
        this._class = _class;
        this._def_class = _class;
        this._body = null;
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
    setStyle(
        background, border, title, content,
        dark_background, dark_border, dark_title, dark_content
    ) {
        if (!this._style) this._style = new AlertsStyle(this._id, this._class);
        this._style.build(
            background, border, title, content,
            dark_background, dark_border, dark_title, dark_content
        );
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
                this.$timeout(fn, delay);
            });
        }
        return this;
    }
    onHide(fn, delay) {
        if (this.$isFunc(fn)) {
            if (!this.$isNumVal(delay)) this._on_hide = this.$fn(fn);
            else this._on_hide = this.$fn(function() {
                this.$timeout(fn, delay);
            });
        }
        return this;
    }
    render(clss) {
        if (!this._dialog) {
            this._dialog = new frappe.ui.Dialog(this._opts);
            this._container = this._dialog.$wrapper.find('.modal-dialog').first();
            this._container.attr('id', this._class);
            this._body = $('<div class="alerts-message">');
            this._dialog.modal_body.append(this._body);
        }
        if (!clss && this._class !== this._def_class) clss = this._def_class;
        if (clss) {
            this._class = clss;
            this._container.attr('id', this._class);
        }
        this._body.html(this._message || '');
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
            this.$timeout(this.hide, this._timeout);
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
        this._sound.timeout = this.$timeout(this.playSound, 200);
        return this;
    }
    stopSound() {
        if (this._sound.timeout) this.$timeout(this._sound.timeout);
        this._sound.timeout = null;
        if (this.$sound && this._sound.playing)
            try { this.$sound[0].stop(); } catch(_) {}
        this._sound.playing = 0;
        return this;
    }
    reset() {
        this.hide();
        this.$sound && this.$sound.off('canplaythrough');
        this._sound.loaded = this._sound.playing = 0;
    }
    destroy() {
        this.reset();
        if (this._dialog) {
            this._body.remove();
            try { this._dialog.$wrapper.modal('destroy'); } catch(_) {}
            this._dialog.$wrapper.remove();
        }
        if (this._style) this._style.destroy();
        if (this.$sound) this.$sound.remove();
        super.destroy();
    }
}


class AlertsStyle extends LevelUpCore {
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
    build(
        background, border, title, content,
        dark_background, dark_border, dark_title, dark_content
    ) {
        var css = [],
        tpl = [
            '$0{background:$1 !important}',
            '$0,$0>.modal-header,$0>.modal-footer{border:1px solid $1 !important}',
            '$0>$1>$2>.modal-title{color:$3 !important}'
                + '$0>$1>$2>.indicator::before{background:$3 !important}'
                + '$0>$1>.modal-actions>.btn{color:$3 !important}',
            '$0>$1,$0>$1>.alerts-message{color:$2 !important}'
        ],
        rgx = [/\$0/g, /\$1/g, /\$2/g, /\$3/g, /\$t/g];
        if (this.$isStrVal(background))
            css.push(tpl[0].replace(rgx[1], background));
        if (this.$isStrVal(border))
            css.push(tpl[1].replace(rgx[1], border));
        if (this.$isStrVal(title))
            css.push(tpl[2].replace(rgx[1], '.modal-header').replace(rgx[2], '.title-section')
                .replace(rgx[3], title));
        if (this.$isStrVal(content))
            css.push(tpl[3].replace(rgx[1], '.modal-body').replace(rgx[2], content));
        if (this.$isStrVal(dark_background))
            css.push(tpl[0].replace(rgx[0], '$t $0').replace(rgx[1], dark_background));
        if (this.$isStrVal(dark_border))
            css.push(tpl[1].replace(rgx[0], '$t $0').replace(rgx[1], dark_border));
        if (this.$isStrVal(dark_title))
            css.push(tpl[2].replace(rgx[0], '$t $0').replace(rgx[1], '.modal-header')
                .replace(rgx[2], '.title-section').replace(rgx[3], dark_title));
        if (this.$isStrVal(dark_content))
            css.push(tpl[3].replace(rgx[0], '$t $0').replace(rgx[1], '.modal-body')
                .replace(rgx[2], dark_content));
        if (css.length) {
            var sel = '#' + this._class + '>.modal-content';
            css = css.join("\n").replace(rgx[0], sel).replace(rgx[4], '[data-theme="dark"]');
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
/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


class LevelUpCore {
    destroy() {
        for (let k in this) { if (this.$hasProp(k)) delete this[k]; }
    }
    $type(v) {
        if (v == null) return v === null ? 'Null' : 'Undefined';
        let t = Object.prototype.toString.call(v).slice(8, -1);
        return t === 'Number' && isNaN(v) ? 'NaN' : t;
    }
    $hasProp(k, o) { return Object.prototype.hasOwnProperty.call(o || this, k); }
    $is(v, t) { return v != null && this.$type(v) === t; }
    $of(v, t) { return typeof v === t; }
    $isObjLike(v) { return v != null && this.$of(v, 'object'); }
    $isStr(v) { return this.$is(v, 'String'); }
    $isStrVal(v) { return this.$isStr(v) && v.length; }
    $isNum(v) { return this.$is(v, 'Number') && isFinite(v); }
    $isBool(v) { return v === true || v === false; }
    $isBoolLike(v) { return this.$isBool(v) || v === 0 || v === 1; }
    $isFunc(v) { return this.$of(v, 'function') || /(Function|^Proxy)$/.test(this.$type(v)); }
    $isArr(v) { return this.$is(v, 'Array'); }
    $isArrVal(v) { return this.$isArr(v) && v.length; }
    $isArgs(v) { return this.$is(v, 'Arguments'); }
    $isArgsVal(v) { return this.$isArgs(v) && v.length; }
    $isArrLike(v) {
        return this.$isObjLike(v) && !this.$isStr(v) && this.$isNum(v.length)
            && (v.length === 0 || v[v.length - 1] != null);
    }
    $isBaseObj(v) { return this.$is(v, 'Object'); }
    $isObj(v, d) {
        return this.$isObjLike(v) && (!(v = Object.getPrototypeOf(v))
            || (this.$hasProp('constructor', v) && this.$isFunc(v.constructor)
                && (!d || this.$fnStr(v.constructor) === this.$fnStr(Object))));
    }
    $fnStr(v) { return Function.prototype.toString.call(v); }
    $isEmptyObj(v) {
        if (this.$isObjLike(v)) for (let k in v) { if (this.$hasProp(k, v)) return false; }
        return true;
    }
    $isDataObj(v) { return this.$isObj(v, 1); }
    $isDataObjVal(v) { return this.$isDataObj(v) && !this.$isEmptyObj(v); }
    $isEmpty(v) {
        return v == null || v === '' || v === 0 || v === false
            || (this.$isArrLike(v) && v.length === 0) || this.$isEmptyObj(v);
    }
    $ext(v, o, s, e) {
        if (this.$isDataObj(v)) for (let k in v) this.$getter(k, v[k], s, e, o);
        return this;
    }
    $def(v, o) { return this.$ext(v, o, 0); }
    $xdef(v, o) { return this.$ext(v, o, 0, 1); }
    $static(v, o) { return this.$ext(v, o, 1); }
    $getter(k, v, s, e, o) {
        o = o || this;
        if (!s) o[(k[0] !== '_' ? '_' : '') + k] = v;
        if (s || (e && o[k] == null))
            Object.defineProperty(o, k, s ? {value: v} : {get() { return this['_' + k]; }});
        return this;
    }
    $extend() {
        let a = this.$toArr(arguments),
        d = this.$isBool(a[0]) && a.shift(),
        v = this.$isBaseObj(a[0]) ? a.shift() : {};
        for (let i = 0, l = a.length; i < l; i++) {
            if (!this.$isBaseObj(a[i])) continue;
            for (let k in a[i]) {
                if (!this.$hasProp(k, a[i]) || a[i][k] == null) continue;
                if (!d || !this.$isBaseObj(v[k]) || !this.$isBaseObj(a[i][k])) v[k] = a[i][k];
                else this.$extend(d, v[k], a[i][k]);
            }
        }
        return v;
    }
    $toArr(v, s, e) { try { return Array.prototype.slice.call(v, s, e); } catch(_) { return []; } }
    $toJson(v, d) { try { return JSON.stringify(v); } catch(_) { return d; } }
    $parseJson(v, d) { try { return JSON.parse(v); } catch(_) { return d; } }
    $fn(fn, o) { return fn.bind(o || this); }
    $afn(fn, a, o) {
        if (a == null) return this.$fn(fn, o);
        a = !this.$isArr(a) ? [a] : a.slice();
        a.unshift(o || this);
        return fn.bind.apply(fn, a);
    }
    $call(fn, a, o) {
        if (a != null && !this.$isArrLike(a)) a = [a];
        o = o || this;
        switch ((a || '').length) {
            case 0: return fn.call(o);
            case 1: return fn.call(o, a[0]);
            case 2: return fn.call(o, a[0], a[1]);
            case 3: return fn.call(o, a[0], a[1], a[2]);
            case 4: return fn.call(o, a[0], a[1], a[2], a[3]);
            case 5: return fn.call(o, a[0], a[1], a[2], a[3], a[4]);
            default: return fn.apply(o, a);
        }
    }
    $try(fn, a, o) {
        try { return this.$call(fn, a, o); } catch(e) { console.error(e.message, e.stack); }
    }
    $xtry(fn, a, o) { return this.$fn(function() { return this.$try(fn, a, o); }); }
    $timeout(fn, tm, a) {
        if (tm == null) return (fn && clearTimeout(fn)) || this;
        return setTimeout(this.$afn(fn, a), tm || 0);
    }
    $proxy(fn, tm) {
        fn = this.$fn(fn);
        return {
            _r: null,
            _fn: function(a, d) {
                this.cancel();
                let f = function() { a.length ? fn.apply(null, a) : fn(); };
                this._r = d ? setTimeout(f, tm) : f();
            },
            call: function() { this._fn(arguments); },
            delay: function() { this._fn(arguments, 1); },
            cancel: function() { this._r && (this._r = clearTimeout(this._r)); },
        };
    }
    $hasElem(id) { return !!document.getElementById(id); }
    $loadJs(src, opt) {
        let $el = document.createElement('script');
        $el.src = src;
        $el.type = 'text/javascript';
        $el.async = true;
        if (opt) for (let k in opt) $el[k] = opt[k];
        document.getElementsByTagName('body')[0].appendChild($el);
        return this;
    }
    $loadCss(href, opt) {
        let $el = document.createElement('link');
        $el.href = href;
        $el.type = 'text/css';
        $el.rel = 'stylesheet';
        $el.async = true;
        if (opt) for (let k in opt) $el[k] = opt[k];
        document.getElementsByTagName('head')[0].appendChild($el);
        return this;
    }
    $load(css, opt) {
        let $el = document.createElement('style');
        $el.innerHTML = css;
        $el.type = 'text/css';
        if (opt) for (let k in opt) $el[k] = opt[k];
        document.getElementsByTagName('head')[0].appendChild($el);
        return this;
    }
}


class LevelUpBase extends LevelUpCore {
    constructor(mod, key, doc, ns, prod) {
        super();
        this._mod = mod;
        this._key = key;
        this._tmp = '_' + this._key;
        this._doc = new RegExp('^' + doc);
        this._real = this._key + '_';
        this._pfx = '[' + this._key.toUpperCase() + ']';
        this._ns = ns + (ns.slice(-1) !== '.' ? '.' : '');
        this._prod = !!prod;
        this.$xdef({is_ready: true});
        this._events = {
            sock: !!frappe.socketio.socket,
            list: {},
            real: {},
            once: 'ready page_clean page_change page_pop destroy after_destroy'.split(' ')
        };
    }
    get module() { return this._mod; }
    get key() { return this._key; }
    $alert(t, m, i, f) {
        m == null && (m = t) && (t = null);
        f && (this._err = 1);
        t = {title: this.$isStrVal(t) ? t : this._mod, indicator: i};
        this.$isDataObj(m) ? (t = this.$extend(m, t)) : (t.message = '' + m);
        this.call('on_alert', t);
        (f ? frappe.throw : frappe.msgprint)(t);
        return this;
    }
    debug(t, m) { return this._prod ? this : this.$alert(t, m, 'gray'); }
    log(t, m) { return this._prod ? this : this.$alert(t, m, 'cyan'); }
    info(t, m) { return this.$alert(t, m, 'light-blue'); }
    warn(t, m) { return this.$alert(t, m, 'orange'); }
    error(t, m) { return this.$alert(t, m, 'red'); }
    fatal(t, m) { return this.$alert(t, m, 'red', 1); }
    $toast(m, i) {
        frappe.show_alert({message: m, indicator: i});
        return this;
    }
    success_(m) { return this.$toast(m, 'green'); }
    info_(m) { return this.$toast(m, 'blue'); }
    warn_(m) { return this.$toast(m, 'orange'); }
    error_(m) { return this.$toast(m, 'red'); }
    $console(fn, a) {
        if (this._prod) return this;
        if (!this.$isStr(a[0])) Array.prototype.unshift.call(a, this._pfx);
        else a[0] = (this._pfx + ' ' + a[0]).trim();
        (console[fn] || console.log).apply(null, a);
        return this;
    }
    _debug() { return this.$console('debug', arguments); }
    _log() { return this.$console('log', arguments); }
    _info() { return this.$console('info', arguments); }
    _warn() { return this.$console('warn', arguments); }
    _error() { return this.$console('error', arguments); }
    ajax(u, o, s, f) {
        f = this.$isFunc(f) && this.$fn(f);
        o = this.$extend(1, {
            url: u, method: 'GET', cache: false, 'async': true, crossDomain: true,
            headers: {'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
            success: this.$isFunc(s) ? this.$fn(s) : null,
            error: this.$fn(function(r, t) {
                r = (this.$isStrVal(r) && __(r)) || (this.$isStrVal(t) && __(t))
                    || __('The ajax request sent raised an error.');
                f ? f({message: r}) : this.error(r);
            })
        }, o);
        o.contentType == null && (o.contentType = (o.method == 'post' ? 'application/json' : 'application/x-www-form-urlencoded') + '; charset=utf-8');
        this.call('on_ajax', o);
        try { $.ajax(o); } catch(e) {
            f ? f(e) : this.error(e.message);
            if (this._err) throw e;
        } finally { this._err = 0; }
        return this;
    }
    get_method(v) { return this._ns + v; }
    request(m, a, s, f) {
        s = this.$isFunc(s) && this.$fn(s);
        f = this.$isFunc(f) && this.$fn(f);
        let d = {
            method: m.includes('.') ? m : this.get_method(m),
            callback: this.$fn(function(r) {
                r = (this.$isObjLike(r) && r.message) || r;
                if (!this.$isDataObj(r) || !r.error) return s && s(r);
                r = this.$isDataObjVal(r) && ((this.$isStrVal(r.message) && __(r.message))
                    || (this.$isStrVal(r.error) && __(r.error)))
                    || __('The request sent returned an invalid response.');
                f ? f({message: r}) : this.error(r);
            }),
            error: this.$fn(function(r, t) {
                r = (this.$isStrVal(r) && __(r)) || (this.$isStrVal(t) && __(t))
                    || __('The request sent raised an error.');
                f ? f({message: r}) : this.error(r);
            })
        };
        !this.$isDataObj(a) && (a = {});
        this.call('on_request', a);
        if (!this.$isEmptyObj(a)) this.$extend(d, {type: 'POST', args: a});
        try { frappe.call(d); } catch(e) {
            f ? f(e) : this.error(e.message);
            if (this._err) throw e;
        } finally { this._err = 0; }
        return this;
    }
    on(e, fn)  { return this._on(e, fn); }
    xon(e, fn)  { return this._on(e, fn, 0, 1); }
    once(e, fn) { return this._on(e, fn, 1); }
    xonce(e, fn) { return this._on(e, fn, 1, 1); }
    real(e, fn, n) { return this._on(e, fn, n, 0, 1); }
    xreal(e, fn, n) { return this._on(e, fn, n, 1, 1); }
    off(e, fn, rl) {
        if (e == null) return this._off();
        if (this.$isBoolLike(e)) return this._off(0, 1);
        if (!this.$isStrVal(e)) return this;
        fn = this.$isFunc(fn) && fn;
        e = e.split(' ');
        for (let i = 0, l = e.length, ev; i < l; i++) {
            ev = (rl ? this._real : '') + e[i];
            this._events.list[ev] && this._off(ev, fn);
        }
        return this;
    }
    emit(e) {
        let a = this.$toArr(arguments, 1),
        p = Promise.resolve();
        e = e.split(' ');
        for (let i = 0, l = e.length; i < l; i++)
            this._events.list[e[i]] && this._emit(e[i], a, p);
        return this;
    }
    call(e) {
        let a = this.$toArr(arguments, 1);
        e = e.split(' ');
        for (let i = 0, l = e.length; i < l; i++)
            this._events.list[e[i]] && this._emit(e[i], a);
        return this;
    }
    _on(ev, fn, nc, st, rl) {
        ev = ev.split(' ');
        fn = this.$fn(fn);
        let rd;
        for (let es = this._events, i = 0, l = ev.length, e; i < l; i++) {
            if (rl && !es.sock) continue;
            e = (rl ? this._real : '') + ev[i];
            if (e === es.once[0] && this._is_ready) rd = es.once[0];
            if (es.once.includes(e)) nc = 1;
            if (!es.list[e]) {
                es.list[e] = [];
                rl && frappe.realtime.on(e, (es.real[e] = this._rfn(e)));
            }
            es.list[e].push({f: fn, o: nc, s: st});
        }
        return rd ? this.emit(rd) : this;
    }
    _rfn(e) {
        return this.$fn(function(ret) {
            ret = (this.$isObjLike(ret) && ret.message) || ret;
            this._emit(e, ret != null ? [ret] : ret, Promise.wait(300));
        });
    }
    _off(e, fn) {
        if (e && fn) this._del(e, fn);
        else if (!e) {
            for (let ev in this._events.list) fn ? this._off(ev, fn) : this._del(ev);
        } else {
            let es = this._events;
            es.real[e] && frappe.realtime.off(e, es.real[e]);
            delete es.list[e];
            delete es.real[e];
        }
        return this;
    }
    _del(e, fn) {
        let ev = this._events.list[e].slice(), ret = [];
        for (let x = 0, i = 0, l = ev.length; i < l; i++)
            (fn ? ev[i].f !== fn : ev[i].s) && (ret[x++] = ev[i]);
        !ret.length ? this._off(e) : (this._events.list[e] = ret);
    }
    _emit(e, a, p) {
        let ev = this._events.list[e].slice(), ret = [];
        p && p.catch(this.$fn(function(e) { this._error('Events emit', e, a, e.message, e.stack); }));
        for (let x = 0, i = 0, l = ev.length; i < l; i++) {
            p ? p.then(this.$xtry(ev[i].f, a)) : this.$try(ev[i].f, a);
            !ev[i].o && (ret[x++] = ev[i]);
        }
        !ret.length ? this._off(e) : (this._events.list[e] = ret);
    }
    stop_realtime() {
        this._events.sock = null;
        for (let e in this._events.real) this._off(e);
        this.info_(__('Frappe realtime events is unavailable.'));
    }
}


class LevelUp extends LevelUpBase {
    constructor(mod, key, doc, ns, prod) {
        super(mod, key, doc, ns, prod);
        this.$xdef({is_enabled: true});
        this._router = {obj: null, old: 0, val: ['app']};
        this._win = {
            e: {
                unload: this.$fn(this.destroy),
                popstate: this.$fn(function() { !this._win.c && this._win.fn.delay(); }),
                change: this.$fn(function() { !this._win.c && this._win.fn.call(1); }),
            },
            c: 0,
            fn: this.$proxy(function(n) {
                this._win.c++;
                this._routes();
                this.emit('page_clean ' + (n ? 'page_change' : 'page_pop'));
                this.$timeout(function() { this._win.c--; }, n ? 2000 : 1200);
            }, 200),
        };
        addEventListener('beforeunload', this._win.e.unload);
        addEventListener('popstate', this._win.e.popstate);
        this._route_change('on');
    }
    options(opts) { return this.$static(opts); }
    destroy() {
        this._win.fn.cancel();
        removeEventListener('beforeunload', this._on_unload);
        removeEventListener('popstate', this._state_popped);
        this._route_change('off');
        this.emit('page_clean destroy after_destroy').off(1);
        super.destroy();
    }
    _route_change(fn) {
        if (!this._router.obj)
            for (let ks = ['router', 'route'], i = 0, l = ks.length; i < l; i++) {
                if (!frappe[ks[i]]) continue;
                this._router.obj = frappe[ks[i]];
                this._router.old = i > 1;
                break;
            }
        if (this._router.obj && this._router.obj[fn])
            this._router.obj[fn]('change', this._win.e.change);
    }
    _routes() {
        let v;
        try { this._router.obj && (v = !this._router.old ? frappe.get_route() : this._router.obj.parse()); } catch(_) {}
        if (this.$isArrVal(v)) this._router.val = v;
    }
    route(i) { return this._router.val[i] || this._router.val[0]; }
    get is_list() { return this.route(0).toLowerCase() === 'list'; }
    get is_form() { return this.route(0).toLowerCase() === 'form'; }
    get is_self() { return this._doc.test(this.route(1)); }
    is_doctype(v) { return this.route(1) === v; }
    _is_self_view(o) { return this._doc.test((o && o.doctype) || this.route(1)); }
    get_list(o) { return (o = o || cur_list) && this.$isObjLike(o) ? o : null; }
    get_form(o) { return (o = o || cur_frm) && this.$isObjLike(o) ? o : null; }
    is_self_list(o) { return this.is_list && this._is_self_view(this.get_list(o)); }
    setup_list(o) {
        if (!(o = this.get_list(o)) || !this.is_self_list(o)) return this;
        o[this._tmp] = {disabled: 0};
        let k = 'toggle_actions_menu_button';
        if (this._is_enabled) {
            o[this._tmp].disabled = 0;
            o['_' + k] && (o[k] = o['_' + k]);
            delete o['_' + k];
            o.page.clear_inner_toolbar();
            o.set_primary_action();
            this.off('page_clean');
        } else if (!o[this._tmp].disabled) {
            o[this._tmp].disabled = 1;
            o.page.hide_actions_menu();
            o.page.clear_primary_action();
            o.page.add_inner_message(__('{0} app is disabled.', [this._mod]))
                .removeClass('text-muted').addClass('text-danger');
            o['_' + k] = o[k];
            o[k] = function() {};
            this.once('page_clean', this.clean_list);
        }
        return this;
    }
    clean_list(o) {
        if (!(o = this.get_list(o))) return this;
        delete o[this._tmp];
        let k = 'toggle_actions_menu_button';
        o['_' + k] && (o[k] = o['_' + k]);
        delete o['_' + k];
        return this;
    }
    is_self_form(o) { return this.is_form && this._is_self_view(this.get_form(o)); }
    clean_form(frm) {
        if ((frm = this.get_form(frm))) {
            try { (!frm[this._tmp] || frm[this._tmp].disabled) && this.enable_form(frm); }
            finally { delete frm[this._tmp]; }
        }
        return this;
    }
    setup_form(frm, wf) {
        if (!(frm = this.get_form(frm)) || !this.is_self_form(frm)) return this;
        frm[this._tmp] = {disabled: 0, intro: 0, workflow: 0, fields: []};
        try {
            if (this._is_enabled) this.enable_form(frm, wf);
            else this.disable_form(frm, __('{0} app is disabled.', [this._mod]), wf);
        } catch(e) { this._error('Setup form error', e.message, e.stack); }
        return this;
    }
    enable_form(frm, wf) {
        if (!(frm = this.get_form(frm))) return this;
        let obj;
        try {
            obj = this.is_self_form(frm) && frm[this._tmp];
            let dfs = obj && obj.disabled ? obj.fields : null;
            if ((obj && !obj.disabled) || (dfs && !dfs.length)) return this;
            for (let i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i];
                if (dfs && !dfs.includes(f.df.fieldname)) continue;
                if (f.df.fieldtype === 'Table') this._enable_table(frm, f.df.fieldname);
                else this._enable_field(frm, f.df.fieldname);
            }
            wf == null && obj && (wf = obj.workflow);
            if (!!frm.is_new() || !this._has_flow(frm, wf)) frm.enable_save();
            else (!obj || (obj.workflow = 1)) && frm.page.show_actions_menu();
            if (obj && obj.intro) frm.set_intro() && (obj.intro = 0);
        } catch(e) { this._error('Enable form', e.message, e.stack); }
        finally {
            try { if (obj) this.$extend(obj, {disabled: 0, fields: []}); } catch(_) {}
            this.off('page_clean').emit('form_enabled', frm);
        }
        return this;
    }
    disable_form(frm, msg, wf, color) {
        if (!(frm = this.get_form(frm))) return this;
        if (color == null && this.$isStr(wf)) (color = wf) && (wf = 0);
        let obj;
        try {
            obj = this.is_self_form(frm) && frm[this._tmp];
            if (obj && obj.disabled) return this;
            for (let i = 0, l = frm.fields.length, f; i < l; i++) {
                f = frm.fields[i].df;
                if (f.fieldtype === 'Table') this._disable_table(frm, f.fieldname);
                else this._disable_field(frm, f.fieldname);
            }
            wf == null && obj && (wf = obj.workflow);
            if (!!frm.is_new() || !this._has_flow(frm, wf)) frm.disable_save();
            else (!obj || (obj.workflow = 1)) && frm.page.hide_actions_menu();
        } catch(e) { this._error('Disable form', e.message, e.stack); }
        finally {
            try {
                if (this.$isStrVal(msg)) {
                    obj && (obj.intro = 1);
                    frm.set_intro(msg, color || 'red');
                }
            } catch(_) {}
            try { obj && (obj.disabled = 1); } catch(_) {}
            this.once('page_clean', this.clean_form).emit('form_disabled', frm);
        }
        return this;
    }
    _has_flow(frm, wf) {
        try { return frm && wf && frm.states && frm.states.get_state(); } catch(_) {}
    }
    get_field(frm, k, n, ck, g) {
        return (frm = this.get_form(frm)) ? this._get_field(frm, k, n, ck, g) : null;
    }
    _get_field(frm, k, n, ck, g) {
        let f = frm.get_field(k);
        f && n != null && (f = f.grid && f.grid.get_row(n));
        f && ck != null && (f = !g ? f.get_field(ck) : f.grid_form && (f.grid_form.fields_dict || {})[ck]);
        if (f) return f;
    }
    _reload_field(frm, k, n, ck) {
        n != null && (frm = this._get_field(frm, k, n));
        frm && frm.refresh_field && frm.refresh_field(n == null ? k : ck);
    }
    _toggle_translatable(f, s) {
        if (!f.df || !cint(f.df.translatable) || !f.$wrapper) return;
        f = f.$wrapper.find('.clearfix .btn-translation');
        f.length && f.hidden(!s);
    }
    enable_field(frm, key, cdn, ckey) {
        (frm = this.get_form(frm)) && this._enable_field(frm, key, cdn, ckey);
        return this;
    }
    _enable_field(frm, k, n, ck) {
        try {
            let o = this.is_self_form(frm) && frm[this._tmp],
            fk = ck == null ? (n == null ? k : [k, n].join('-')) : [k, n, ck].join('-');
            if (o && !o.fields.includes(fk)) return;
            let f = this._get_field(frm, k, n, ck);
            if (!f || !f.df || !!cint(f.df.hidden) || !this._is_field(f.df.fieldtype)) return;
            o && (fk = o.fields.indexOf(fk)) >= 0 && o.fields.splice(fk, 1);
            n == null && frm.set_df_property(k, 'read_only', 0);
            if (n == null) return this._toggle_translatable(f, 1);
            if (ck == null) return f.grid && f.grid.toggle_enable(n, 1);
            f = this._get_field(frm, k, n);
            f && f.set_field_property(ck, 'read_only', 0);
            f = this._get_field(frm, k, n, ck, 1);
            f && this._toggle_translatable(f, 1);
        } catch(_) {}
    }
    disable_field(frm, k, n, ck) {
        (frm = this.get_form(frm)) && this._disable_field(frm, k, n, ck);
        return this;
    }
    _disable_field(frm, k, n, ck) {
        try {
            let fs = this.is_self_form(frm) && frm[this._tmp].fields,
            fk = ck == null ? (n == null ? k : [k, n].join('-')) : [k, n, ck].join('-');
            if (fs && fs.includes(fk)) return;
            let f = this._get_field(frm, k, n, ck);
            if (!f || !f.df || !!cint(f.df.hidden) || !this._is_field(f.df.fieldtype)) return;
            fs && fs.push(fk);
            n == null && frm.set_df_property(k, 'read_only', 1);
            if (n == null) return this._toggle_translatable(f, 0);
            if (ck == null) return f.grid && f.grid.toggle_enable(n, 0);
            f = this._get_field(frm, k, n);
            f && f.set_field_property(ck, 'read_only', 1);
            f = this._get_field(frm, k, n, ck, 1);
            f && this._toggle_translatable(f, 0);
        } catch(_) {}
    }
    _is_field(v) { return v && !/^((Tab|Section|Column) Break|Table)$/.test(v); }
    enable_table(frm, key) {
        (frm = this.get_form(frm)) && this._enable_table(frm, key);
        return this;
    }
    _enable_table(frm, k) {
        try {
            let fs = this.is_self_form(frm) && (frm[this._tmp] || {}).fields, t;
            if (fs && !fs.includes(k)) return;
            fs && (t = fs.indexOf(k)) >= 0 && fs.splice(t, 1);
            let f = frm.get_field(k);
            if (!f || !f.df || !!cint(f.df.hidden) || f.df.fieldtype !== 'Table' || !f.grid) return;
            f.of && f.of.add != null && (f.df.cannot_add_rows = f.of.add);
            f.of && f.of.del != null && (f.df.cannot_delete_rows = f.of.del);
            delete f.of;
            f = f.grid;
            if (!f.of) return;
            f.of.edit != null && (f.df.in_place_edit = f.of.edit);
            f.meta && f.of.grid != null && (f.meta.editable_grid = f.of.grid);
            f.of.static != null && (f.static_rows = f.of.static);
            f.of.sort != null && (f.sortable_status = f.of.sort);
            if (f.of.read) {
                let ds = [];
                if (this.$isArrVal(f.grid_rows))
                    for (let i = 0, l = f.grid_rows.length, r; i < l; i++) {
                        (r = f.grid_rows[i]) && this.$isArrVal(r.docfields) && ds.push(r.docfields);
                    }
                if (this.$isArrVal(f.docfields)) ds.push(f.docfields);
                for (let i = 0, l = ds.length; i < l; i++) {
                    for (let x = 0, z = ds[i].length, d; x < z; x++)
                        (d = ds[i][x]) && f.of.read.includes(d.fieldname) && (d.read_only = 0);
                }
            }
            this._reload_field(frm, k);
            f.of.checkbox && f.toggle_checkboxes(1);
            delete f.of;
        } catch(_) {}
    }
    disable_table(frm, key, opts) {
        !this.$isDataObj(opts) && (opts = null);
        (frm = this.get_form(frm)) && this._disable_table(frm, key, opts);
        return this;
    }
    _disable_table(frm, k, o) {
        try {
            let fs = this.is_self_form(frm) && (frm[this._tmp] || {}).fields,
            f = frm.get_field(k);
            if (!f || !f.df || !!cint(f.df.hidden) || f.df.fieldtype !== 'Table' || !f.grid) return;
            fs && !fs.includes(k) && fs.push(k);
            let y = true, n = false;
            !f.of && (f.of = {});
            let x;
            if (!o || !o.add) {
                (x = 'add') && f.of[x] !== y && (f.of[x] = !!f.df.cannot_add_rows);
                f.df.cannot_add_rows = y;
            }
            if (!o || !o.del) {
                (x = 'del') && f.of[x] !== y && (f.of[x] = !!f.df.cannot_delete_rows);
                f.df.cannot_delete_rows = y;
            }
            f = f.grid;
            !f.of && (f.of = {});
            if (!o || !o.edit) {
                (x = 'edit') && f.of[x] !== n && (f.of[x] = !!f.df.in_place_edit);
                f.df.in_place_edit = n;
                if (f.meta) {
                    (x = 'grid') && f.of[x] !== n && (f.of[x] = !!f.meta.editable_grid);
                    f.meta.editable_grid = n;
                }
            }
            if (!o || !o.edit || !o.keep) {
                (x = 'static') && f.of[x] !== y && (f.of[x] = !!f.static_rows);
                f.static_rows = y;
            }
            if (!o || !o.sort) {
                (x = 'sort') && f.of[x] !== n && (f.of[x] = !!f.sortable_status);
                f.sortable_status = n;
            }
            if (!o || !o.edit) {
                f.of.read = [];
                let ds = [];
                if (this.$isArrVal(f.grid_rows))
                    for (let i = 0, l = f.grid_rows.length, r; i < l; i++) {
                        (r = f.grid_rows[i]) && this.$isArrVal(r.docfields) && ds.push(r.docfields);
                    }
                if (this.$isArrVal(f.docfields)) ds.push(f.docfields);
                for (let i = 0, l = ds.length; i < l; i++) {
                    for (let x = 0, z = ds[i].length, d; x < z; x++)
                        (d = ds[i][x]) && !d.read_only && (!o || !(o.keep || '').includes(d.fieldname))
                            && (d.read_only = 1) && f.of.read.push(d.fieldname);
                }
            }
            this._reload_field(frm, k);
            (!o || !o.del) && (f.of.checkbox = 1) && f.toggle_checkboxes(0);
        } catch(_) {}
    }
    _set_field_desc(f, m) {
        let c = 0;
        f.df && !f.df.__description && (f.df.__description = f.df.description);
        if (m && f.set_new_description) c++ && f.set_new_description(m);
        else if (f.set_description) {
            f.df && !m && (m = f.df.__description) && delete f.df.__description;
            c++ && f.set_description(m);
        }
        c && f.toggle_description && f.toggle_description(f, !!m);
        return c;
    }
    set_field_desc(frm, key, cdn, ckey, msg) {
        if (!(frm = this.get_form(frm))) return this;
        msg == null && cstr(cdn).length && ckey == null && (msg = cdn) && (cdn = null);
        try {
            let f = this._get_field(frm, key, cdn, ckey, 1);
            f && this._set_field_desc(f, msg);
        } catch(_) {}
        return this;
    }
    get_field_desc(frm, key, cdn, ckey, bk) {
        if (!(frm = this.get_form(frm))) return '';
        bk == null && this.$isBoolLike(cdn) && ckey == null && (bk = cdn) && (cdn = null);
        try {
            let f = this._get_field(frm, key, cdn, ckey, 1);
            return (f && f.fd && ((bk && f.fd.__description) || f.df.description)) || '';
        } catch(_) {}
        return '';
    }
    valid_field(frm, key, cdn, ckey) {
        if (!(frm = this.get_form(frm))) return this;
        try {
            let f = this._get_field(frm, key, cdn, ckey, 1);
            if (!f) return this;
            let c = 0;
            if (f.df && f.df.invalid) {
                f.df.invalid = 0;
                f.set_invalid && f.set_invalid();
                c++;
            }
            this._set_field_desc(f) && c++;
            c && this._reload_field(frm, key, cdn, ckey);
        } catch(_) {}
        return this;
    }
    invalid_field(frm, key, cdn, ckey, msg) {
        if (!(frm = this.get_form(frm))) return this;
        if (msg == null && cstr(cdn).length && ckey == null) {
            msg = cdn;
            cdn = null;
        }
        try {
            let f = this._get_field(frm, key, cdn, ckey, 1);
            if (!f) return this;
            let c = 0;
            if (f.df && !f.df.invalid) {
                f.df.invalid = 1;
                f.set_invalid && f.set_invalid();
                c++;
            }
            this.$isStrVal(msg) && this._set_field_desc(f, msg) && c++;
            c && this._reload_field(frm, key, cdn, ckey);
        } catch(_) {}
        return this;
    }
}


class Alerts extends LevelUp {
    constructor() {
        super(__('Alerts'), 'alerts', 'Alert', 'alerts.utils', 0);
        this.$xdef({
            id: frappe.utils.get_random(5),
            is_ready: false,
            is_enabled: false,
        });
        this._dialog = null;
        this._init = 0;
        this._in_req = 0;
        this._styles = {};
        this._list = [];
        this._seen = [];
        this._seen_retry = 0;
        this._mock = null;
        
        this.real('use_realtime', function() { this.$timeout(this._realtime_tm); }, 1);
        this._realtime_tm = this.$timeout(this.stop_realtime, 60000);
        this.$timeout(function() { delete this._realtime_tm; }, 65000);
        this.request('use_realtime');
        
        this.request('is_enabled', null, this._setup);
    }
    get has_alerts() { return !!this._list.length; }
    mock() {
        if (!this._mock) this._mock = new AlertsMock();
        return this._mock;
    }
    show() { return this.has_alerts ? this._render() : this; }
    setup_list() {
        if (!this._is_enabled)
            this.error(__(this._mod + ' app has been disabled.'));
    }
    _setup(ret) {
        this._is_ready = true;
        this._is_enabled = !!ret;
        this.xon('page_change page_pop', function() {
            if (this._is_enabled) {
                if (this.has_alerts) this.show();
                else this._get_alerts();
            }
        })
        .xreal('app_status_changed', function(ret) {
            this._debug('real app_status_changed', ret);
            var old = this._is_enabled;
            this.$xdef(ret);
            if (this._is_enabled === old) return;
            this.emit('change');
            if (this._is_enabled) {
                if (!this._init) {
                    this._first = 1;
                    this._init = 1;
                    this._get_alerts();
                } else this.show();
            }
        })
        .xreal('type_changed', function(ret) {
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
        })
        .xreal('show_alert', function(ret) {
            this._debug('real show_alert', ret);
            if (this._is_enabled && this._is_valid(ret))
                this._queue(ret);
        });
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
        if (this._seen.includes(data.name)) return false;
        var user = frappe.session.user,
        score = 0;
        if (this.$isArrVal(data.users) && data.users.includes(user)) score++;
        if (
            !score
            && this.$isArrVal(data.roles)
            && frappe.user.has_role(data.roles)
        ) score++;
        if (!score) return false;
        if (
            this.$isArrVal(data.seen_today)
            && data.seen_today.includes(user)
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
                } else if (ret.error) {
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
        //frappe.alerts = null;
        //this._destroy_types();
        //if (this._dialog) try { this._dialog.destroy(); } catch(_) {}
        if (this._mock) try { this._mock.destroy(); } catch(_) {}
        this._mock = null;
        //super.destroy();
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
            this._dialog
                .setStyle(
                    data.background, data.border_color,
                    data.title_color, data.content_color,
                    data.dark_background, data.dark_border_color,
                    data.dark_title_color, data.dark_content_color
                )
                .render();
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
    _slug(v) { return v.toLowerCase().replace(/ /g, '-'); }
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
        if (this.$isNum(sec) && sec > 0) this._timeout = sec * 1000;
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
            if (!this.$isNum(delay) || delay < 1) this._on_show = this.$fn(fn);
            else this._on_show = this.$fn(function() {
                this.$timeout(fn, delay);
            });
        }
        return this;
    }
    onHide(fn, delay) {
        if (this.$isFunc(fn)) {
            if (!this.$isNum(delay) || delay < 1) this._on_hide = this.$fn(fn);
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
   if (frappe == null || typeof frappe !== 'object')
        throw new Error('Frappe framework is required.');
    let app = new LevelUpCore(),
    id = 'core-polyfill';
    function $onload() {
        Promise.wait = function(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); };
        Promise.prototype.timeout = function(ms) {
            return Promise.race([this, Promise.wait(ms).then(function() { throw new Error('Time out'); })]);
        };
    }
    if (
        app.$isFunc(Promise) && app.$isFunc(id.trim)
        && app.$isFunc(id.includes) && app.$isFunc(id.startsWith)
        && app.$isFunc(id.endsWith) && app.$isFunc([].includes)
        && app.$isFunc(app.$isFunc.bind)
    ) $onload();
    else if (app.$hasElem(id)) $onload();
    else app.$loadJs(
        'https://polyfill.io/v3/polyfill.min.js?features=String.prototype.trim%2CString.prototype.includes%2CString.prototype.startsWith%2CString.prototype.endsWith%2CArray.prototype.includes%2CFunction.prototype.bind%2CPromise',
        {id: id, onload: $onload}
    );
    $.fn.hidden = function(s) { return this.toggleClass('lu-hidden', !!s); };
    $.fn.isHidden = function() { return this.hasClass('lu-hidden'); };
    !app.$hasElem('lu-style') && app.$load('.lu-hidden { display: none; }', {id: 'lu-style'});
    
    frappe.alerts = new Alerts();
});
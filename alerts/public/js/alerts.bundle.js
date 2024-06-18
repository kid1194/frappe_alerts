/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


(function() {
    var LU = {
        $type(v) {
            if (v == null) return v === null ? 'Null' : 'Undefined';
            let t = Object.prototype.toString.call(v).slice(8, -1);
            return t === 'Number' && isNaN(v) ? 'NaN' : t;
        },
        $hasProp(k, o) { return Object.prototype.hasOwnProperty.call(o || this, k); },
        $is(v, t) { return v != null && this.$type(v) === t; },
        $of(v, t) { return typeof v === t; },
        $isObjLike(v) { return v != null && this.$of(v, 'object'); },
        $isStr(v) { return this.$is(v, 'String'); },
        $isStrVal(v) { return this.$isStr(v) && v.length; },
        $isNum(v) { return this.$is(v, 'Number') && isFinite(v); },
        $isBool(v) { return v === true || v === false; },
        $isBoolLike(v) { return this.$isBool(v) || v === 0 || v === 1; },
        $isFunc(v) { return this.$of(v, 'function') || /(Function|^Proxy)$/.test(this.$type(v)); },
        $isArr(v) { return this.$is(v, 'Array'); },
        $isArrVal(v) { return this.$isArr(v) && v.length; },
        $isArgs(v) { return this.$is(v, 'Arguments'); },
        $isArgsVal(v) { return this.$isArgs(v) && v.length; },
        $isArrLike(v) { return this.$isArr(v) || this.$isArgs(v); },
        $isArrLikeVal(v) { return this.$isArrLike(v) && v.length; },
        $isEmptyObj(v) {
            if (this.$isObjLike(v)) for (let k in v) { if (this.$hasProp(k, v)) return false; }
            return true;
        },
        $isBaseObj(v) { return !this.$isArgs(v) && this.$is(v, 'Object'); },
        $isBaseObjVal(v) { return this.$isBaseObj(v) && !this.$isEmptyObj(v); },
        $fnStr(v) { return Function.prototype.toString.call(v); },
        $isObj(v, _) {
            if (!this.$isObjLike(v)) return false;
            let k = 'constructor';
            v = Object.getPrototypeOf(v);
            return this.$hasProp(k, v) && this.$isFunc(v[k])
                && (!_ || this.$fnStr(v[k]) === this.$fnStr(Object));
        },
        $isObjVal(v) { return this.$isObj(v) && !this.$isEmptyObj(v); },
        $isDataObj(v) { return this.$isObj(v, 1); },
        $isDataObjVal(v) { return this.$isDataObj(v) && !this.$isEmptyObj(v); },
        $isIter(v) { return this.$isBaseObj(v) || this.$isArrLike(v); },
        $isEmpty(v) {
            return v == null || v === '' || v === 0 || v === false
                || (this.$isArrLike(v) && v.length < 1) || this.$isEmptyObj(v);
        },
        $toArr(v, s, e) { try { return Array.prototype.slice.call(v, s, e); } catch(_) { return []; } },
        $toJson(v, d) { try { return JSON.stringify(v); } catch(_) { return d; } },
        $parseJson(v, d) { try { return JSON.parse(v); } catch(_) { return d; } },
        $clone(v) { return this.$parseJson(this.$toJson(v)); },
        $filter(v, fn) {
            fn = this.$fn(fn) || function(v) { return v != null; };
            let o = this.$isBaseObj(v), r = o ? {} : [];
            if (o) for (let k in v) { if (this.$hasProp(k, v) && fn(v[k], k) !== false) r[k] = v[k]; }
            else for (let i = 0, x = 0, l = v.length; i < l; i++) { if (fn(v[i], i) !== false) r[x++] = v[i]; }
            return r;
        },
        $map(v, fn) {
            if (!(fn = this.$fn(fn))) return this.$clone(v);
            let o = this.$isBaseObj(v), r = o ? {} : [];
            if (o) for (let k in v) { if (this.$hasProp(k, v)) r[k] = fn(v[k], k); }
            else for (let i = 0, x = 0, l = v.length; i < l; i++) { r[x++] = fn(v[i], i); }
            return r;
        },
        $reduce(v, fn, r) {
            if (!(fn = this.$fn(fn))) return r;
            if (this.$isBaseObj(v)) for (let k in v) { this.$hasProp(k, v) && fn(v[k], k, r); }
            else for (let i = 0, x = 0, l = v.length; i < l; i++) { fn(v[i], i, r); }
            return r;
        },
        $assign() {
            let a = arguments.length && this.$filter(arguments, this.$isBaseObj);
            if (!a || !a.length) return {};
            a.length > 1 && Object.assign.apply(null, a);
            return a[0];
        },
        $extend() {
            let a = arguments.length && this.$filter(arguments, this.$isBaseObj);
            if (!a || a.length < 2) return a && a.length ? a[0] : {};
            let d = this.$isBoolLike(arguments[0]) && arguments[0],
            t = this.$map(a[0], this.$isBaseObj);
            for (let i = 1, l = a.length; i < l; i++)
                for (let k in a[i]) {
                    if (!this.$hasProp(k, a[i]) || a[i][k] == null) continue;
                    d && t[k] && this.$isBaseObj(a[i][k]) ? this.$extend(d, a[0][k], a[i][k]) : (a[0][k] = a[i][k]);
                }
            return a[0];
        },
        $fn(fn, o) { if (this.$isFunc(fn)) return fn.bind(o || this); },
        $afn(fn, a, o) {
            if (!this.$isFunc(fn)) return;
            a = this.$isArrLike(a) ? this.$toArr(a) : (a != null ? [a] : a);
            return a && a.unshift(o || this) ? fn.bind.apply(fn, a) : fn.bind(o || this);
        },
        $call(fn, a, o) {
            if (!this.$isFunc(fn)) return;
            a = a == null || this.$isArrLike(a) ? a : [a];
            o = o || this;
            let l = a != null && a.length;
            return !l ? fn.call(o) : (l < 2 ? fn.call(o, a[0]) : (l < 3 ? fn.call(o, a[0], a[1])
                : (l < 4 ? fn.call(o, a[0], a[1], a[2]) : fn.apply(o, a))));
        },
        $try(fn, a, o) { try { return this.$call(fn, a, o); } catch(e) { console.error(e.message, e.stack); } },
        $xtry(fn, a, o) { return this.fn(function() { return this.try(fn, a, o); }); },
        $timeout(fn, tm, a, o) {
            return tm != null ? setTimeout(this.$afn(fn, a, o), tm) : ((fn && clearTimeout(fn)) || this);
        },
        $proxy(fn, tm) {
            var me = this;
            return {
                _fn(a, d) { this.cancel() || (d ? (this._r = me.$timeout(fn, tm, a)) : me.$call(fn, a)); },
                call() { this._fn(arguments); },
                delay() { this._fn(arguments, 1); },
                cancel() { me.$timeout(this._r); delete this._r; },
            };
        },
        $def(v, o) { return this.$ext(v, o, 0); },
        $xdef(v, o) { return this.$ext(v, o, 0, 1); },
        $static(v, o) { return this.$ext(v, o, 1); },
        $ext(v, o, s, e) {
            for (let k in v) { this.$hasProp(k, v) && this.$getter(k, v[k], s, e, o); }
            return this;
        },
        $getter(k, v, s, e, o) {
            o = o || this;
            if (!s && k[0] === '_') k = k.substring(1);
            if (!s) o['_' + k] = v;
            if (s || (e && o[k] == null)) Object.defineProperty(o, k, s ? {value: v} : {get() { return this['_' + k]; }});
            return this;
        },
        $getElem(k) { return document.getElementById(k); },
        $hasElem(k) { return !!this.$getElem(k); },
        $makeElem(t, o) {
            t = document.createElement(t);
            if (o) for (let k in o) { if (this.$hasProp(k, o)) t[k] = o[k]; }
            return t;
        },
        $loadJs(s, o) {
            o = this.$assign(o || {}, {src: s, type: 'text/javascript', 'async': true});
            document.getElementsByTagName('body')[0].appendChild(this.$makeElem('script', o));
            return this;
        },
        $loadCss(h, o) {
            o = this.$assign(o || {}, {href: h, type: 'text/css', rel: 'stylesheet', 'async': true});
            document.getElementsByTagName('head')[0].appendChild(this.$makeElem('link', o));
            return this;
        },
        $load(c, o) {
            o = this.$assign(o || {}, {innerHTML: c, type: 'text/css'});
            document.getElementsByTagName('head')[0].appendChild(this.$makeElem('style', o));
            return this;
        }
    };
    
    
    class LevelUpCore {
        destroy() { for (let k in this) { if (this.$hasProp(k)) delete this[k]; } }
    }
    LU.$extend(LevelUpCore.prototype, LU);
    frappe.LevelUpCore = LevelUpCore;
    
    
    class LevelUpBase extends LevelUpCore {
        constructor(mod, key, doc, ns) {
            super();
            this._mod = mod;
            this._key = key;
            this._tmp = '_' + this._key;
            this._doc = new RegExp('^' + doc);
            this._real = this._key + '_';
            this._pfx = '[' + this._key.toUpperCase() + ']';
            this._ns = ns + (!ns.endsWith('.') ? '.' : '');
            this._prod = 0;
            this._events = {
                list: {},
                real: {},
                once: 'ready page_change page_clean destroy after_destroy'.split(' ')
            };
        }
        get module() { return this._mod; }
        get key() { return this._key; }
        get is_debug() { return !this._prod; }
        $alert(t, m, i, x) {
            m == null && (m = t) && (t = this._mod);
            t = this.$assign({title: t, indicator: i}, this.$isBaseObj(m) ? m : {message: m, as_list: this.$isArr(m)});
            this.call('on_alert', t, x);
            (x === 'fatal' && (this._err = 1) ? frappe.throw : frappe.msgprint)(t);
            return this;
        }
        debug(t, m) { return this.is_debug ? this.$alert(t, m, 'gray', 'debug') : this; }
        log(t, m) { return this.is_debug ? this.$alert(t, m, 'cyan', 'log') : this; }
        info(t, m) { return this.$alert(t, m, 'light-blue', 'info'); }
        warn(t, m) { return this.$alert(t, m, 'orange', 'warn'); }
        error(t, m) { return this.$alert(t, m, 'red', 'error'); }
        fatal(t, m) { return this.$alert(t, m, 'red', 'fatal'); }
        $toast(m, i, s, a) {
            this.$isBaseObj(s) && (a = s) && (s = 0);
            frappe.show_alert(this.$assign({indicator: i}, this.$isBaseObj(m) ? m : {message: m}), s || 4, a);
            return this;
        }
        success_(m, s, a) { return this.$toast(m, 'green', s, a); }
        info_(m, s, a) { return this.$toast(m, 'blue', s, a); }
        warn_(m, s, a) { return this.$toast(m, 'orange', s, a); }
        error_(m, s, a) { return this.$toast(m, 'red', s, a); }
        $console(fn, a) {
            if (!this.is_debug) return this;
            !this.$isStr(a[0]) ? Array.prototype.unshift.call(a, this._pfx)
                : (a[0] = (this._pfx + ' ' + a[0]).trim());
            (console[fn] || console.log).apply(null, a);
            return this;
        }
        _debug() { return this.$console('debug', arguments); }
        _log() { return this.$console('log', arguments); }
        _info() { return this.$console('info', arguments); }
        _warn() { return this.$console('warn', arguments); }
        _error() { return this.$console('error', arguments); }
        ajax(u, o, s, f) {
            o = this.$extend(1, {
                url: u, method: 'GET', cache: false, 'async': true, crossDomain: true,
                headers: {'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
                success: this.$fn(s),
                error: this.$fn(function(r, t) {
                    r = this.$isStrVal(r) ? __(r) : (this.$isStrVal(t) ? __(t)
                        : __('The ajax request sent raised an error.'));
                    (f = this.$fn(f)) ? f({message: r}) : this._error(r);
                })
            }, o);
            if (o.contentType == null)
                o.contentType = 'application/' + (o.method == 'post' ? 'json' : 'x-www-form-urlencoded') + '; charset=utf-8';
            this.call('on_ajax', o);
            try { $.ajax(o); } catch(e) {
                (f = this.$fn(f)) ? f(e) : this._error(e.message);
                if (this._err) throw e;
            } finally { this._err = 0; }
            return this;
        }
        get_method(v) { return this._ns + v; }
        request(m, a, s, f) {
            s = this.$fn(s);
            f = this.$fn(f);
            let d = {
                method: m.includes('.') ? m : this.get_method(m),
                callback: this.$fn(function(r) {
                    r = (this.$isBaseObj(r) && r.message) || r;
                    if (!this.$isBaseObj(r) || !r.error) return s && s(r);
                    if (!this.$isBaseObj(r)) r = {};
                    var k = ['list', 'message', 'error', 'self'];
                    let m = r[k[0]] != null ? r[k[0]] : (r[k[1]] != null ? r[k[1]] : (r[k[2]] != null ? r[k[2]] : null));
                    m = this.$isArrVal(m) ? this.$map(m, function(v) { return __(v); }).join('\n') : (this.$isStrVal(m) ? __(m) : '');
                    if (!m.trim().length) m = __('The request sent returned an invalid response.');
                    if (f) r = this.$assign({message: m, list: m.split('\n'), self: 1}, this.$filter(r, function(_, x) { return !k.includes(x); }));
                    f ? f(r) : this._error(m);
                }),
                error: this.$fn(function(r, t) {
                    r = this.$isStrVal(r) ? __(r) : (this.$isStrVal(t) ? __(t) : __('The request sent raised an error.'));
                    f ? f({message: r}) : this._error(r);
                })
            };
            this.$isBaseObj(a) && this.call('on_request', a);
            this.$isBaseObjVal(a) && this.$assign(d, {type: 'POST', args: a});
            try { frappe.call(d); } catch(e) {
                f ? f(e) : this._error(e.message);
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
            e = e.trim().split(' ');
            for (let i = 0, l = e.length, ev; i < l; i++)
                (ev = (rl ? this._real : '') + e[i]) && this._events.list[ev] && this._off(ev, fn);
            return this;
        }
        emit(e) {
            e = e.trim().split(' ');
            for (let a = this.$toArr(arguments, 1), p = Promise.resolve(), i = 0, l = e.length; i < l; i++)
                this._events.list[e[i]] && this._emit(e[i], a, p);
            return this;
        }
        call(e) {
            e = e.trim().split(' ');
            for (let a = this.$toArr(arguments, 1), i = 0, l = e.length; i < l; i++)
                this._events.list[e[i]] && this._emit(e[i], a);
            return this;
        }
        _on(ev, fn, o, s, r) {
            ev = ev.trim().split(' ');
            let rd = [];
            for (let es = this._events, i = 0, l = ev.length, e; i < l; i++) {
                e = (r ? this._real : '') + ev[i];
                e === es.once[0] && this._is_ready && rd.push(es.once[0]);
                es.once.includes(e) && (o = 1);
                !es.list[e] && (es.list[e] = []) && (!r || frappe.realtime.on(e, (es.real[e] = this._rfn(e))));
                es.list[e].push({f: fn, o, s});
            }
            return rd.length ? this.emit(rd.join(' ')) : this;
        }
        _rfn(e) {
            return this.$fn(function(r) {
                (r = (this.$isBaseObj(r) && r.message) || r) && this._emit(e, r != null ? [r] : r, Promise.wait(300));
            });
        }
        _off(e, fn) {
            if (e && fn) this._del(e, fn);
            else if (!e && fn) for (let ev in this._events.list) { this._del(ev); }
            else {
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
            p && p.catch(this.$fn(function(z) { this._error('Events emit', e, a, z.message); }));
            for (let x = 0, i = 0, l = ev.length; i < l; i++) {
                p ? p.then(this.$xtry(ev[i].f, a)) : this.$try(ev[i].f, a);
                !ev[i].o && (ret[x++] = ev[i]);
            }
            !ret.length ? this._off(e) : (this._events.list[e] = ret);
        }
    }
    
    
    var LUR = {
        on(o) {
            for (let k = ['router', 'route'], i = 0, l = k.length; i < l; i++)
                (o._router.obj = frappe[k[i]]) && (i < 1 || (o._router.old = 1));
            this._reg(o, 'on');
            this.get(o);
        },
        off(o) { this._reg(o, 'off'); o._router.obj = o._router.old = null; },
        get(o) {
            let d = ['app'], v;
            try { v = !o._router.old ? frappe.get_route() : (o._router.obj ? o._router.obj.parse() : null); } catch(_) {}
            v = LU.$isArrVal(v) ? LU.$filter(LU.$map(v, function(z) { return (z = cstr(z).trim()).length && !/(\#|\?|\&)$/.test(z) ? z : null; })) : d;
            if (v.length) v[0] = v[0].toLowerCase();
            let r = 0;
            for (let i = 0, l = v.length; i < l; i++)
                if ((!o._router.val || o._router.val.indexOf(v[i]) !== i) && ++r) break;
            if (r) o._router.val = v;
            return r > 0;
        },
        _reg(o, a) {
            o._router.obj && LU.$isFunc(o._router.obj[a]) && o._router.obj[a]('change', o._win.e.change);
        },
    },
    LUF = {
        has_flow(f) { try { return f && !f.is_new() && f.states && !!f.states.get_state(); } catch(_) {} },
        is_field(f) { return f && f.df && !/^((Tab|Section|Column) Break|Table)$/.test(f.df.fieldtype); },
        is_table(f) { return f && f.df && f.df.fieldtype === 'Table'; },
    },
    LUC = {
        get(f, k, g, r, c, d) {
            try {
                f = f.get_field(k);
                if (g || r != null) f = f.grid;
                if (r != null) f = f.get_row(r);
                if (c) f = (r != null && d && f.grid_form.fields_dict[c]) || f.get_field(c);
                return f;
            } catch(_) {}
        },
        reload(f, k, r, c) {
            if (r != null && !c) {
                try { (LU.$isNum(r) || LU.$isStrVal(r)) && (f = this.get(f, k, 1)) && f.refresh_row(r); } catch(_) {}
                return;
            }
            if (r != null && c) {
                if (!LU.$isStrVal(c) || !(f = this.get(f, k, 1, r))) return;
                try {
                    (r = f.on_grid_fields_dict[c]) && r.refresh && r.refresh();
                    (r = f.grid_form && f.grid_form.refresh_field) && r(c);
                } catch(_) {}
                return;
            }
            if (!c) {
                try { LU.$isStrVal(k) && f.refresh_field && f.refresh_field(k); } catch(_) {}
                return;
            }
            if (!LU.$isStrVal(c) || !(f = this.get(f, k, 1)) || !LU.$isArrVal(f.grid_rows)) return;
            try {
                for (let i = 0, l = f.grid_rows, x; i < l; i++) {
                    r = f.grid_rows[i];
                    (x = r.on_grid_fields_dict[c]) && x.refresh && x.refresh();
                    (x = r.grid_form && r.grid_form.refresh_field) && x(c);
                }
            } catch(_) {}
        },
        prop(f, k, g, r, c, p, v) {
            if (LU.$isBaseObj(k)) for (let x in k) { this.prop(f, x, g, r, c, k[x]); }
            else if (LU.$isBaseObj(c)) for (let x in c) { this.prop(f, k, g, r, x, c[x]); }
            else {
                (g || r != null) && (f = this.get(f, k, g, r)) && (k = c);
                let m = r != null ? 'set_field_property' : (g ? 'update_docfield_property' : 'set_df_property');
                try {
                    if (!LU.$isBaseObj(p)) f[m](k, p, v);
                    else for (let x in p) { f[m](k, x, p[x]); }
                    g && r == null && f.debounced_refresh();
                } catch(_) {}
            }
        },
        toggle(f, k, g, r, c, e, i) {
            let tf = this.get(f, k, g, r, c, 1);
            e = e ? 0 : 1;
            if (!tf || !tf.df || cint(tf.df.hidden) || (i && tf.df._ignore) || cint(tf.df.read_only) === e) return;
            this.prop(f, k, g, r, c, 'read_only', e);
            try {
                tf.df.translatable && tf.$wrapper
                && (tf = tf.$wrapper.find('.clearfix .btn-translation')) && tf.hidden(e ? 0 : 1);
            } catch(_) {}
        },
        get_desc(f, k, g, r, c, b) {
            k && (f = this.get(f, k, g, r, c, 1));
            return cstr((f && f.df && ((b && f.df._description) || (!b && f.df.description))) || '');
        },
        desc(f, k, g, r, c, m) {
            let x = 0;
            k && (f = this.get(f, k, g, r, c, 1));
            if (f.df._description == null) f.df._description = f.df.description || '';
            if (!LU.$isStr(m)) m = '';
            try {
                if (m.length && f.set_new_description) ++x && f.set_new_description(m);
                else if (f.set_description) {
                    if (!m.length) { m = f.df._description || ''; delete f.df._description; }
                    ++x && f.set_description(m);
                }
                f.toggle_description && f.toggle_description(m.length > 0);
            } catch(_) {}
            return x;
        },
        status(f, k, g, r, c, m) {
            let v = LU.$isStrVal(m), tf = this.get(f, k, g, r, c, 1), x = 0;
            if ((!v && tf.df.invalid) || (v && !tf.df.invalid))
                try {
                    ++x && ((tf.df.invalid = v ? 1 : 0) || 1) && tf.set_invalid && tf.set_invalid();
                } catch(_) {}
            this.desc(tf, 0, 0, null, 0, m) && x++;
            x && this.reload(f, k, r, c);
        },
    },
    LUT = {
        setup(f, k) {
            cint(k.df.read_only) && (k.df._ignore = 1);
            for (let ds = this._fields(this._grid(f, k.df.fieldname)), i = 0, l = ds.length, d; i < l; i++)
                (d = ds[i]) && cint(d.read_only) && (d._ignore = 1);
        },
        toggle(f, k, e, o, i) {
            let tf = this._grid(f, k, i), x;
            if (!tf) return;
            x = !e || !!tf._;
            x && (!o || !o.add) && this.toggle_add(tf, 0, e);
            x && (!o || !o.del) && this.toggle_del(tf, 0, e);
            x && (!o || !o.edit) && this.toggle_edit(tf, 0, o && o.keep, e);
            x && (!o || !o.sort) && this.toggle_sort(tf, 0, e);
            LUC.reload(f, k);
            x && (!o || !o.del) && this.toggle_check(tf, 0, e);
            if (e && tf._) delete tf._;
        },
        toggle_add(f, k, e) {
            let tf = k ? this._grid(f, k) : f;
            if (!tf) return;
            if (e) {
                (!tf._ || tf._.add != null) && (tf.df.cannot_add_rows = tf._ ? tf._.add : false);
                if (k && tf._) delete tf._.add;
            } else {
                (tf._ = tf._ || {}) && tf._.add == null && (tf._.add = tf.df.cannot_add_rows);
                tf.df.cannot_add_rows = true;
            }
            k && LUC.reload(f, k);
            return 1;
        },
        toggle_del(f, k, e) {
            let tf = k ? this._grid(f, k) : f;
            if (!tf) return;
            if (e) {
                (!tf._ || tf._.del != null) && (tf.df.cannot_delete_rows = tf._ ? tf._.del : false);
                if (k && tf._) delete tf._.del;
            } else {
                (tf._ = tf._ || {}) && tf._.del == null && (tf._.del = tf.df.cannot_delete_rows);
                tf.df.cannot_delete_rows = true;
            }
            k && LUC.reload(f, k);
            k && this.toggle_check(tf, 0, e);
            return 1;
        },
        toggle_edit(f, k, g, e) {
            let tf = k ? this._grid(f, k) : f;
            if (!tf) return;
            if (e) {
                (!tf._ || tf._.edit != null) && (tf.df.in_place_edit = tf._ ? tf._.edit : true);
                tf._ && tf._.grid != null && tf.meta && (tf.meta.editable_grid = tf._.grid);
                (!tf._ || tf._.static != null) && (tf.static_rows = tf._ ? tf._.static : false);
                if (tf._ && tf._.read && tf._.read.length) {
                    for (let ds = this._fields(tf), i = 0, l = ds.length, d; i < l; i++)
                        (d = ds[i]) && !d._ignore && tf._.read.includes(d.fieldname) && (d.read_only = 0);
                }
                if (k && tf._) for (let x = ['edit', 'grid', 'static', 'read'], i = 0; i < 4; i++) { delete tf._[x[i]]; }
                k && LUC.reload(f, k);
                return 1;
            }
            (tf._ = tf._ || {}) && tf._.edit == null && (tf._.edit = tf.df.in_place_edit);
            tf.df.in_place_edit = false;
            tf.meta && tf._.grid == null && (tf._.grid = tf.meta.editable_grid);
            tf.meta && (tf.meta.editable_grid = false);
            tf._.static == null && (tf._.static = tf.static_rows);
            tf.static_rows = true;
            tf._.read == null && (tf._.read = []);
            for (let ds = this._fields(tf), i = 0, x = 0, l = ds.length, d; i < l; i++)
                (d = ds[i]) && !d._ignore && !tf._.read.includes(d.fieldname)
                && (!g || !g.includes(d.fieldname)) && (d.read_only = 1)
                && (tf._.read[x++] = d.fieldname);
            k && LUC.reload(f, k);
            return 1;
        },
        toggle_sort(f, k, e) {
            let tf = k ? this._grid(f, k) : f;
            if (!tf) return;
            if (e) {
                (!tf._ || tf._.sort != null) && (tf.sortable_status = tf._ ? tf._.sort : true);
                if (k && tf._) delete tf._.sort;
            } else {
                (tf._ = tf._ || {}) && tf._.sort == null && (tf._.sort = tf.sortable_status);
                tf.sortable_status = false;
            }
            k && LUC.reload(f, k);
            return 1;
        },
        toggle_check(f, k, e) {
            let tf = k ? this._grid(f, k) : f;
            if (!tf) return;
            if (e) {
                (!tf._ || tf._.check) && tf.toggle_checkboxes(1);
                if (k && tf._) delete tf._.check;
            } else {
                (tf._ = tf._ || {}) && (tf._.check = 1) && tf.toggle_checkboxes(0);
            }
            return 1;
        },
        _grid(f, k, i) {
            return ((!k && (f = f.grid)) || (f = LUC.get(f, k, 1))) && !cint(f.df.hidden) && (!i || !f.df._ignore) && f;
        },
        _fields(f) {
            let ds = [];
            if (LU.$isArrVal(f.grid_rows)) {
                for (let i = 0, l = f.grid_rows.length, r; i < l; i++)
                    (r = f.grid_rows[i]) && LU.$isArrVal(r.docfields) && ds.push.apply(ds, r.docfields);
            }
            LU.$isArrVal(f.docfields) && ds.push.apply(ds, f.docfields);
            return ds;
        },
    };
    
    
    class LevelUp extends LevelUpBase {
        constructor(mod, key, doc, ns) {
            super(mod, key, doc, ns);
            this.$xdef({is_enabled: true});
            this._router = {obj: null, old: 0, val: null};
            this._win = {
                e: {
                    unload: this.$fn(this.destroy),
                    change: this.$fn(function() { !this._win.c && this._win.fn(); }),
                },
                c: 0,
                fn: this.$fn(function() {
                    if (this._win.c || !LUR.get(this)) return;
                    this._win.c++;
                    this.emit('page_change page_clean');
                    this.$timeout(function() { this._win.c--; }, 2000);
                }),
            };
            addEventListener('beforeunload', this._win.e.unload);
            LUR.on(this);
        }
        options(opts) { return this.$static(opts); }
        destroy() {
            this._win.fn.cancel();
            LUR.off(this);
            removeEventListener('beforeunload', this._win.e.unload);
            this.emit('page_clean destroy after_destroy').off(1);
            super.destroy();
        }
        route(i) { return this._router.val[i] || this._router.val[0]; }
        get is_list() { return this.route(0) === 'list'; }
        get is_tree() { return this.route(0) === 'tree'; }
        get is_form() { return this.route(0) === 'form'; }
        get is_self() { return this._doc.test(this.route(1)); }
        is_doctype(v) { return this.route(1) === v; }
        _is_self_view(f) { return this._doc.test((f && f.doctype) || this.route(1)); }
        get_list(f) { return this.$isObjLike((f = f || cur_list)) ? f : null; }
        get_tree(f) { return this.$isObjLike((f = f || cur_tree)) ? f : null; }
        get_form(f) { return this.$isObjLike((f = f || cur_frm)) ? f : null; }
        get app_disabled_note() { return __('{0} app is disabled.', [this._mod]); }
        setup_list(f) {
            if (!this.is_list || !(f = this.get_list(f)) || !this._is_self_view(f)) return this;
            let n = !f[this._tmp];
            if (this._is_enabled) this.enable_list(f);
            else this.disable_list(f, this.app_disabled_note);
            n && this.off('page_clean').once('page_clean', function() { this.enable_list(f); });
            return this;
        }
        enable_list(f) {
            if (!(f = this.get_list(f)) || (f[this._tmp] && !f[this._tmp].disabled)) return this;
            let k = 'toggle_actions_menu_button';
            f[this._tmp] && f[this._tmp][k] && (f[k] = f[this._tmp][k]);
            f.page.clear_inner_toolbar();
            f.set_primary_action();
            delete f[this._tmp];
            return this;
        }
        disable_list(f, m) {
            if (!(f = this.get_list(f)) || (f[this._tmp] && f[this._tmp].disabled)) return this;
            f.page.hide_actions_menu();
            f.page.clear_primary_action();
            f.page.clear_inner_toolbar();
            m && f.page.add_inner_message(m).removeClass('text-muted').addClass('text-danger');
            let k = 'toggle_actions_menu_button';
            !f[this._tmp] && (f[this._tmp] = {});
            (f[this._tmp][k] = f[k]) && (f[k] = function() {}) && (f[this._tmp].disabled = 1);
            return this;
        }
        setup_tree(f) {
            if (!this.is_tree || !(f = this.get_tree(f)) || !this._is_self_view(f)) return this;
            let n = !f[this._tmp];
            if (this._is_enabled) this.enable_tree(f);
            else this.disable_tree(f, this.app_disabled_note);
            n && this.$xdef({tree: f}).off('page_clean').once('page_clean', function() { this.$xdef({tree: null}).enable_tree(f); });
            return this;
        }
        enable_tree(f) {
            if (!(f = this.get_tree(f)) || (f[this._tmp] && !f[this._tmp].disabled)) return this;
            let k = 'can_create';
            f[this._tmp] && f[this._tmp][k] && (f[k] = f[this._tmp][k]);
            f.page.clear_inner_toolbar();
            f.set_primary_action();
            delete f[this._tmp];
            f.refresh();
            return this;
        }
        disable_tree(f, m) {
            if (!(f = this.get_tree(f)) || (f[this._tmp] && f[this._tmp].disabled)) return this;
            f.page.hide_actions_menu();
            f.page.clear_primary_action();
            f.page.clear_inner_toolbar();
            m && f.page.add_inner_message(m).removeClass('text-muted').addClass('text-danger');
            let k = 'can_create';
            !f[this._tmp] && (f[this._tmp] = {});
            (f[this._tmp][k] = f[k]) && (f[k] = false) && (f[this._tmp].disabled = 1);
            f.refresh();
            return this;
        }
        setup_form(f) {
            if (!this.is_form || !(f = this.get_form(f)) || !this._is_self_view(f)) return this;
            let n = !f[this._tmp];
            if (n && this.$isArrVal(f.fields))
                try {
                    for (let i = 0, l = f.fields.length, c; i < l; i++) {
                        if (!(c = f.fields[i])) continue;
                        if (LUF.is_table(c)) LUT.setup(f, c);
                        else if (LUF.is_field(c) && cint(c.df.read_only)) c.df._ignore = 1;
                    }
                } catch(_) {}
            if (this._is_enabled) this.enable_form(f);
            else this.disable_form(f, {message: this.app_disabled_note});
            n && this.off('page_clean').once('page_clean', function() { this.enable_form(f); });
            return this;
        }
        enable_form(f) {
            if (!(f = this.get_form(f)) || (f[this._tmp] && !f[this._tmp].disabled)) return this;
            try {
                if (this.$isArrVal(f.fields))
                    for (let i = 0, l = f.fields.length, c; i < l; i++) {
                        if (!(c = f.fields[i]) || !c.df.fieldname) continue;
                        if (LUF.is_table(c)) LUT.toggle(f, c.df.fieldname, 1, 0, 1);
                        else if (LUF.is_field(c)) LUC.toggle(f, c.df.fieldname, 0, null, 0, 1, 1);
                    }
                LUF.has_flow(f) ? f.page.show_actions_menu() : f.enable_save();
                f.set_intro();
            } catch(e) { this._error('Enable form', e.message, e.stack); }
            finally {
                delete f[this._tmp];
                this.emit('form_enabled', f);
            }
            return this;
        }
        disable_form(f, o) {
            if (!(f = this.get_form(f)) || (f[this._tmp] && f[this._tmp].disabled)) return this;
            o = this.$assign({ignore: []}, o);
            try {
                if (this.$isArrVal(f.fields))
                    for (let i = 0, l = f.fields.length, c; i < l; i++) {
                        if (!(c = f.fields[i]) || !c.df.fieldname || o.ignore.includes(c.df.fieldname)) continue;
                        if (LUF.is_table(c)) LUT.toggle(f, c.df.fieldname, 0, 0, 1);
                        else if (LUF.is_field(c)) LUC.toggle(f, c.df.fieldname, 0, null, 0, 0, 1);
                    }
                LUF.has_flow(f) ? f.page.hide_actions_menu() : f.disable_save();
                if (o.message) f.set_intro(o.message, o.color || 'red');
            } catch(e) { this._error('Disable form', e.message, e.stack); }
            finally {
                (f[this._tmp] || (f[this._tmp] = {})) && (f[this._tmp].disabled = 1);
                this.emit('form_disabled', f);
            }
            return this;
        }
        get_field(f, k) { if ((f = this.get_form(f))) return LUC.get(f, k); }
        get_grid(f, k) { if ((f = this.get_form(f))) return LUC.get(f, k, 1); }
        get_tfield(f, k, c) { if ((f = this.get_form(f))) return LUC.get(f, k, 1, null, c); }
        get_row(f, k, r) { if ((f = this.get_form(f))) return LUC.get(f, k, 1, r); }
        get_rfield(f, k, r, c) { if ((f = this.get_form(f))) return LUC.get(f, k, 1, r, c); }
        get_rmfield(f, k, r, c) { if ((f = this.get_form(f))) return LUC.get(f, k, 1, r, c, 1); }
        reload_field(f, k) {
            (f = this.get_form(f)) && LUC.reload(f, k);
            return this;
        }
        reload_tfield(f, k, c) {
            (f = this.get_form(f)) && LUC.reload(f, k, null, c);
            return this;
        }
        reload_row(f, k, r) {
            (f = this.get_form(f)) && LUC.reload(f, k, r);
            return this;
        }
        reload_rfield(f, k, r, c) {
            (f = this.get_form(f)) && LUC.reload(f, k, r, c);
            return this;
        }
        field_prop(f, k, p, v) {
            (f = this.get_form(f)) && LUC.prop(f, k, 0, null, 0, p, v);
            return this;
        }
        tfield_prop(f, k, c, p, v) {
            (f = this.get_form(f)) && LUC.prop(f, k, 1, null, c, p, v);
            return this;
        }
        rfield_prop(f, k, r, c, p, v) {
            (f = this.get_form(f)) && LUC.prop(f, k, 1, r, c, p, v);
            return this;
        }
        toggle_field(f, k, e) {
            (f = this.get_form(f)) && LUC.toggle(f, k, 0, null, 0, e);
            return this;
        }
        toggle_table(f, k, e, o) {
            (f = this.get_form(f)) && LUT.toggle(f, k, e ? 1 : 0, o);
            return this;
        }
        toggle_tfield(f, k, c, e) {
            (f = this.get_form(f)) && LUC.toggle(f, k, 1, null, c, e);
            return this;
        }
        toggle_rfield(f, k, r, c, e) {
            (f = this.get_form(f)) && LUC.toggle(f, k, 1, r, c, e);
            return this;
        }
        table_add(f, k, e) {
            (f = this.get_form(f)) && LUT.toggle_add(f, k, e ? 1 : 0);
            return this;
        }
        table_edit(f, k, i, e) {
            if (!this.$isArrVal(i)) {
                if (e == null) e = i;
                i = null;
            }
            (f = this.get_form(f)) && LUT.toggle_edit(f, k, i, e ? 1 : 0);
            return this;
        }
        table_del(f, k, e) {
            (f = this.get_form(f)) && LUT.toggle_del(f, k, e ? 1 : 0);
            return this;
        }
        table_sort(f, k, e) {
            (f = this.get_form(f)) && LUT.toggle_sort(f, k, e ? 1 : 0);
            return this;
        }
        field_view(f, k, s) { return this.field_prop(f, k, 'hidden', s ? 0 : 1); }
        tfield_view(f, k, c, s) { return this.tfield_prop(f, k, c, 'hidden', s ? 0 : 1); }
        rfield_view(f, k, r, c, s) { return this.rfield_prop(f, k, r, c, 'hidden', s ? 0 : 1); }
        field_desc(f, k, m) {
            (f = this.get_form(f)) && LUC.desc(f, k, 0, null, 0, m);
            return this;
        }
        tfield_desc(f, k, c, m) {
            (f = this.get_form(f)) && LUC.desc(f, k, 1, null, c, m);
            return this;
        }
        rfield_desc(f, k, r, c, m) {
            (f = this.get_form(f)) && LUC.desc(f, k, 1, r, c, m);
            return this;
        }
        get_field_desc(f, k, b) {
            return ((f = this.get_form(f)) && LUC.get_desc(f, k, 0, null, 0, b)) || '';
        }
        get_tfield_desc(f, k, c, b) {
            return ((f = this.get_form(f)) && LUC.get_desc(f, k, 1, null, c, b)) || '';
        }
        get_rfield_desc(f, k, r, c, b) {
            return ((f = this.get_form(f)) && LUC.get_desc(f, k, 1, r, c, b)) || '';
        }
        field_status(f, k, m) {
            (f = this.get_form(f)) && LUC.status(f, k, 0, null, 0, m);
            return this;
        }
        tfield_status(f, k, c, m) {
            (f = this.get_form(f)) && LUC.status(f, k, 1, null, c, m);
            return this;
        }
        rfield_status(f, k, r, c, m) {
            (f = this.get_form(f)) && LUC.status(f, k, 1, r, c, m);
            return this;
        }
    }


    class Alerts extends LevelUp {
        constructor() {
            super(__('Alerts'), 'alerts', 'Alert', 'alerts.utils');
            this.$xdef({
                id: frappe.utils.get_random(5),
                is_ready: 0,
                is_enabled: 0,
                use_fallback_sync: 0,
                fallback_sync_delay: 5,
            });
            this._dialog = null;
            this._is_init = 0;
            this._is_first = 1;
            this._in_req = 0;
            this._styles = {};
            this._list = [];
            this._seen = [];
            this._mock = null;
            
            this.request('get_settings', null, this._setup);
        }
        get has_alerts() { return this._list.length > 0; }
        get _has_seen() { return this._seen.length > 0; }
        mock() { return (this._mock || (this._mock = new AlertsMock())).show(); }
        show() { return this.has_alerts ? this._render() : this; }
        _setup(opts) {
            this._is_ready = 1;
            this._options(opts);
            this.xon('page_change', function() {
                this._is_enabled && this._init();
            })
            .xreal('status_changed', function(ret, sync) {
                if (!this.$isBaseObj(ret)) return this._error('Invalid status change event data.', ret);
                var old = this._is_enabled;
                this._options(ret);
                if (this._is_enabled !== old) this.emit('change');
                this._is_enabled && !sync && this._init();
                if (!sync) this._queue_sync();
            })
            .xreal('type_changed', function(ret) {
                this._debug('real type_changed', ret);
                if (!this.$isDataObjVal(ret)) return;
                var name = cstr(ret.name);
                if (cstr(ret.action) === 'trash') {
                    delete this._types[name];
                    delete this._styles[name];
                } else {
                    this._types[name] = {
                        name: name,
                        priority: cint(ret.priority),
                        timeout: cint(ret.display_timeout),
                        sound: cstr(ret.display_sound),
                        custom_sound: cstr(ret.custom_display_sound)
                    };
                    if (!this._styles[name])
                        this._styles[name] = new AlertsStyle(this._id, this._slug(name));
                    
                    this._styles[name].build(ret);
                }
            })
            .xreal('show_alert', function(ret) {
                this._debug('real show_alert', ret);
                if (this._is_enabled && this._is_valid(ret)) this._queue(ret);
            });
            this.emit('ready');
            this._is_enabled && this._init();
        }
        _options(opts) {
            this.$xdef(opts);
            this._sync_tm && (this._sync_tm = this.$timeout(this._sync_tm));
            if (this._use_fallback_sync)
                this._sync_delay = this._fallback_sync_delay * 60 * 1000;
        }
        _init() {
            if (this._init) return this.show();
            this._is_init = 1;
            this.$timeout(this._get_alerts, 700);
        }
        _queue_sync() {
            if (!this._use_fallback_sync || !this._is_init || this._sync_tm) return;
            this._sync_tm = this.$timeout(this._get_alerts, this._sync_delay);
        }
        _get_alerts() {
            if (this._in_req) return;
            this._in_req = 1;
            this._sync_tm && (this._sync_tm = this.$timeout(this._sync_tm));
            this.request(
                'sync_alerts',
                {init: this._is_first},
                function(ret) {
                    this._in_req = 0;
                    if (!this.$isBaseObj(ret)) {
                        this._queue_sync();
                        return this._error('Invalid alerts sync data.', ret);
                    }
                    this._is_first = 0;
                    if (this.$isBaseObjVal(ret.system))
                        this.call('alerts_app_status_changed', ret.system, 1);
                    if (!this._is_enabled) return this._queue_sync();
                    if (this.$isBaseObjVal(ret.events))
                        for (var k in ret.events) { this.emit(k, ret.events[k]); }
                    if (this.$isBaseObj(ret.types)) this._build_types(ret.types);
                    if (this.$isArrVal(ret.alerts)) this._queue(ret.alerts);
                    this._queue_sync();
                },
                function(e) {
                    this._in_req = 0;
                    this._queue_sync();
                    this._error(e.self ? e.message : 'Getting user alerts failed.', e.message);
                }
            );
        }
        _get_type(name) { return this._types[name] || {name}; }
        _build_types(data) {
            this._destroy_types();
            for (var k in data) {
                this._types[k] = {
                    name: k,
                    priority: cint(data[k].priority),
                    timeout: cint(data[k].display_timeout),
                    sound: cstr(data[k].display_sound),
                    custom_sound: cstr(data[k].custom_display_sound)
                };
                this._styles[k] = new AlertsStyle(this._id, this._slug(k));
                this._styles[k].build(data[k]);
            }
        }
        _destroy_types() {
            this.$reduce(this._styles, function(o, k) {
                try { o.destroy(); } catch(_) {}
                delete this._types[k];
                delete this._styles[k];
            });
        }
        _is_valid(data) {
            if (!this.$isBaseObjVal(data)) return 0;
            if (this._seen.includes(data.name)) return 0;
            var user = frappe.session.user, score = 0;
            if (this.$isArrVal(data.users) && data.users.includes(user)) score++;
            if (!score && this.$isArrVal(data.roles) && frappe.user.has_role(data.roles)) score++;
            if (!score) return 0;
            if (this.$isArr(data.seen_today) && data.seen_today.includes(user)) return 0;
            var seen_by = this.$isBaseObj(data.seen_by) ? data.seen_by : {},
            seen = seen_by[user] != null ? cint(seen_by[user]) : -1;
            if (cint(data.is_repeatable) < 1 && seen > 0) return 0;
            if (seen >= cint(data.number_of_repeats)) return 0;
            return 1;
        }
        _queue(data) {
            if (this.$isBaseObj(data)) this._list.push(data);
            else if (this.$isArrVal(data)) this._list.push.apply(this._list, data);
            this.has_alerts && this._list.sort(this.$fn(function(a, b) {
                a = this._get_type(a.alert_type).priority || 0;
                b = this._get_type(b.alert_type).priority || 0;
                return cint(b) - cint(a);
            }, this));
            this.show();
        }
        _render() {
            if (this.has_alerts) this._render_dialog();
            else if (this._has_seen) this._process_seen();
            return this;
        }
        _mark_seen() {
            this._dialog && this._seen.push(this._dialog.name);
        }
        _render_dialog() {
            if (!this._dialog) {
                this._dialog = new AlertsDialog(this._id, 'alerts-' + this._id);
                this._rerender = this.$fn(this._render);
                this._remark_seen = this.$fn(this._mark_seen);
            }
            
            var data = this._list.shift(),
            type = this._get_type(data.alert_type);
            this._dialog
                .reset()
                .setName(data.name)
                .setTitle(data.title)
                .setMessage(data.message)
                .setTimeout(type.timeout || 0)
                .setSound(type.sound, type.custom_sound)
                .onShow(this._remark_seen)
                .onHide(this._rerender, 200)
                .render(this._slug(type.name))
                .show();
        }
        _process_seen() {
            var seen = this._seen.splice(0, this._seen.length);
            this.request(
                'sync_seen',
                {names: seen},
                function(ret) {
                    if (ret) return;
                    this._seen = seen;
                    this._error('Marking alerts as seen error.', ret, seen);
                    this._retry_mark_seens();
                },
                function(e) {
                    this._seen = seen;
                    this._error(e.self ? e.message : 'Marking alerts as seen error.', seen, e && e.message);
                    this._retry_mark_seens();
                }
            );
        }
        _retry_mark_seens() {
            if (!this._seen_retry) {
                this._seen_retry = 1;
                this.$timeout(this._process_seen, 2000);
            } else {
                delete this._seen_retry;
                this.error(__('{0} app is currently facing a problem.', [this.module]));
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
                .setTitle(__('Mock Alert'))
                .setMessage(data.message || __('This is a mock alert message.'))
                .setTimeout(data.display_timeout)
                .setSound(data.display_sound, data.custom_display_sound);
            
            if (!data.alert_type) this._dialog.setStyle(data).render();
            else this._dialog.render(this._slug(data.alert_type));
            
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
            this.$getter('name', '', 0, 1);
            this._title = null;
            this._message = null;
            this._timeout = 0;
            this._sound = {loaded: 0, playing: 0, tm: null};
            this._visible = 0;
            
        }
        setName(text) {
            if (this.$isStrVal(text)) this._name = text;
            return this;
        }
        setTitle(text, args) {
            if (this.$isStrVal(text)) this._title = __(text, args);
            return this;
        }
        setMessage(text, args) {
            if (this.$isStrVal(text)) this._message = __(text, args);
            return this;
        }
        setStyle(data) {
            if (!this._style) this._style = new AlertsStyle(this._id, this._class);
            this._style.build(data);
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
            if (file === 'Custom') {
                if (!this.$isStrVal(fallback) || !(/\.(mp3|wav|ogg)$/i).test(fallback)) return this;
                file = frappe.utils.get_file_link(fallback);
            } else file = '/assets/frappe/sounds/' + file.toLowerCase() + '.mp3';
            if (!this._$sound) {
                this._$sound = $('<audio>')
                    .attr({
                        id: 'sound-' + this._id,
                        volume: '0.2',
                        preload: 'auto',
                    })
                    .click(function(e) { try { e.target.play(); } catch(_) {} })
                    .hide()
                    .appendTo('body');
                this._on_play = this.$fn(function() { this._sound.loaded = 1; });
                this._$sound.on('canplaythrough', this._on_play);
            }
            this._$sound.attr('src', file);
            this._$sound[0].load();
            return this;
        }
        beforeShow(fn) {
            this._pre_show = this.$fn(fn);
            return this;
        }
        onShow(fn, delay) {
            if (!this.$isNum(delay) || delay < 1) this._on_show = this.$fn(fn);
            else this._on_show = this.$afn(this.$timeout, [fn, delay]);
            return this;
        }
        onHide(fn, delay) {
            if (!this.$isNum(delay) || delay < 1) this._on_hide = this.$fn(fn);
            else this._on_hide = this.$afn(this.$timeout, [fn, delay]);
            return this;
        }
        render(clss) {
            if (!this._dialog) {
                this._dialog = new frappe.ui.Dialog({});
                this._dialog.onhide = this.$fn(this.stopSound, this);
                this._container = this._dialog.$wrapper.find('.modal-dialog').first();
                this._container.addClass('modal-dialog-centered modal-dialog-scrollable');
                this._body = $('<div class="alerts-message">');
                this._dialog.modal_body.append(this._body);
            }
            if (this._title) this._dialog.set_title(this._title);
            if (!clss || clss !== this._class) {
                this._class = clss || this._def_class;
                this._container.attr('id', this._class);
            }
            this._body.empty();
            this._message && this._body.html(this._message);
            if (this._on_hide) this._dialog.on_hide = this._on_hide;
            if (this._on_show) this._dialog.on_page_show = this._on_show;
            return this;
        }
        show() {
            if (this._visible || !this._dialog) return this;
            this._visible = 1;
            if (this._pre_show) this._pre_show();
            this.playSound();
            this._dialog.show();
            if (this._timeout) this._hide_tm = this.$timeout(function() {
                delete this._hide_tm;
                this.hide();
            }, this._timeout);
            return this;
        }
        hide() {
            if (!this._visible || !this._dialog) return this;
            this._visible = 0;
            this._hide_tm && this.$timeout(this._hide_tm);
            delete this._hide_tm;
            this._dialog.hide();
            return this;
        }
        playSound() {
            if (!this._visible || !this._$sound) return this;
            if (!this._sound.loaded) {
                this._sound.tm = this.$timeout(this.playSound, 200);
            } else {
                this._sound.playing = 1;
                delete this._sound.tm;
                this._$sound.click();
            }
            return this;
        }
        stopSound() {
            if (this._visible || !this._$sound) return this;
            this._sound.tm && this.$timeout(this._sound.tm);
            delete this._sound.tm;
            if (this._sound.playing)
                try { this._$sound[0].stop(); } catch(_) {}
            this._sound.playing = 0;
            return this;
        }
        reset() {
            this.hide();
            this._class = this._def_class;
            this._name = '';
            this._title = null;
            this._message = null;
            this._timeout = 0;
            this._sound.loaded = this._sound.playing = 0;
        }
        destroy() {
            this.reset();
            if (this._dialog) {
                this._body.remove();
                try { this._dialog.$wrapper.modal('dispose'); } catch(_) {}
                try { this._dialog.$wrapper.remove(); } catch(_) {}
            }
            if (this._style) this._style.destroy();
            if (this._$sound) this._$sound.off('canplaythrough', this._on_play).remove();
            super.destroy();
        }
    }
    
    
    class AlertsStyle extends LevelUpCore {
        constructor(id, _class) {
            super();
            this._id = 'style-' + id;
            this._class = _class;
            this._dom = this.$getElem(this._id);
            if (!this._dom) this._dom = this.$load('', {id: this._id});
        }
        build(data) {
            if (!this.$isBaseObjVal(data)) return this;
            var tpl = [
                '$0{background:$1 !important}',
                '$0,$0>.modal-header,$0>.modal-footer{border:1px solid $1 !important}',
                '$0>$1>$2>.modal-title{color:$3 !important}'
                    + '$0>$1>$2>.indicator::before{background:$3 !important}'
                    + '$0>$1>.modal-actions>.btn{color:$3 !important}',
                '$0>$1,$0>$1>.alerts-message{color:$2 !important}'
            ],
            rgx = [/\$0/g, /\$1/g, /\$2/g, /\$3/g, /\$t/g],
            opt = {
                background: [0, [[1]]],
                border: [1, [[1]]],
                title: [2, [[1, '.modal-header'], [2, '.title-section'], [3]]],
                content: [3, [[1, '.modal-body'], [2]]],
                dark_background: [0, [[0, '$t $0'], [1]]],
                dark_border: [1, [[0, '$t $0'], [1]]],
                dark_title: [2, [[0, '$t $0'], [1, '.modal-header'], [2, '.title-section'], [3]]],
                dark_content: [3, [[0, '$t $0'], [1, '.modal-body'], [2]]],
            },
            css = this.$reduce(opt, function(v, k, r) {
                if (this.$isStrVal(data[k]))
                    r.push(this.$reduce(v[1], function(z, i, t) {
                        return t.replace(rgx[z[0]], z[1] || data[k]);
                    }, tpl[v[0]]));
                return r;
            }, []);
            if (!css.length) return this;
            css = css.join("\n")
                .replace(rgx[0], '#' + this._class + '>.modal-content')
                .replace(rgx[4], '[data-theme="dark"]');
            if (this._dom.styleSheet) this._dom.styleSheet.cssText = css;
            else {
                while (this._dom.firstChild)
                    this._dom.removeChild(this._dom.firstChild);
                this._dom.appendChild(document.createTextNode(css));
            }
            return this;
        }
        destroy() {
            this._dom && this._dom.parentNode.removeChild(this._dom);
            super.destroy();
        }
    }
    
    
    $(document).ready(function() {
       if (!frappe || typeof frappe !== 'object') throw new Error('Frappe framework is required.');
        var id = 'core-polyfill';
        function $onload() {
            Promise.wait = function(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); };
            Promise.prototype.timeout = function(ms) {
                return Promise.race([this, Promise.wait(ms).then(function() { throw new Error('Time out'); })]);
            };
        }
        if (
            LU.$isFunc(Promise) && LU.$isFunc(id.trim) && LU.$isFunc(id.includes)
            && LU.$isFunc(id.startsWith) && LU.$isFunc(id.endsWith)
            && LU.$isFunc([].includes) && LU.$isFunc(LU.$isFunc.bind)
        ) $onload();
        else if (LU.$getElem(id)) $onload();
        else LU.$loadJs(
            'https://polyfill.io/v3/polyfill.min.js?features=String.prototype.trim%2CString.prototype.includes%2CString.prototype.startsWith%2CString.prototype.endsWith%2CArray.prototype.includes%2CFunction.prototype.bind%2CPromise',
            {id: id, onload: $onload}
        );
        $.fn.hidden = function(s) { return this.toggleClass('lu-hidden', !!s); };
        $.fn.isHidden = function() { return this.hasClass('lu-hidden'); };
        !LU.$getElem('lu-style') && LU.$load('.lu-hidden { display: none; }', {id: 'lu-style'});
        
        frappe.alerts = new Alerts();
    });
}());
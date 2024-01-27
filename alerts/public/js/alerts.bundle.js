/*
*  Alerts © 2024
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


frappe.provide('frappe.alerts');


class AlertsUtils {
    $type(v) {
        let t = v == null ? (v === void 0 ? 'Undefined' : 'Null')
            : Object.prototype.toString.call(v).slice(8, -1);
        return t === 'Number' && isNaN(v) ? 'NaN' : t;
    }
    $isStr(v) { return this.$type(v) === 'String'; }
    $isFunc(v) { return typeof v === 'function' || /(Function|^Proxy)$/.test(this.$type(v)); }
    $isArr(v) { return v && $.isArray(v); }
    $isObjLike(v) { return v != null && typeof v === 'object'; }
    $isDataObj(v) { return v && $.isPlainObject(v); }
    $isEmptyObj(v) { return !v || $.isEmptyObject(v); }
}


class Alerts extends AlertsUtils {
    constructor() {
        this._id = frappe.utils.get_random(5);
        this._dialog = new AlertsDialog(this._id, 'alert-dialog-' + this._id);
        this._list = [];
        this._mock = null;
        this._events = jQuery({});
        this.is_ready = false;
        this.is_enabled = false;
        this.request(
            'is_enabled',
            null,
            function(ret) {
                this.is_ready = true;
                this.is_enabled = !!ret;
                this._setup();
                this.trigger('ready');
            }
        );
    }
    mock() {
        if (!this._mock) this._mock = new AlertsMock();
        return this._mock;
    }
    show(data) {
        if (this.$isDataObj(data) && !this.$isEmptyObj(data)) data = [data];
        if (!this.$isArr(data) || !data.length) return this;
        Array.prototype.push.apply(this._list, data);
        return this._build();
    }
    path(method) {
        return 'alerts.utils.' + method;
    }
    request(method, args, callback, error, _freeze) {
        if (method.indexOf('.') < 0) method = this.path(method);
        let opts = {
            method: method,
            freeze: _freeze != null ? _freeze : false,
            callback: $.proxy(function(ret) {
                if (ret) ret = ret.message || ret;
                if (ret && !ret.error) {
                    if (callback) callback.call(this, ret);
                    return;
                }
                let message = ret.message || 'The request sent raised an error.';
                if (!error) this.error(message, args);
                else error.call(this, {message: __(message, args)});
            }, this),
            error: $.proxy(function(ret, txt) {
                let message = '';
                if (this.$isStr(ret)) message = ret;
                else if (this.$isStr(txt)) message = txt;
                else message = 'The request sent have failed.';
                if (!error) this.error(message, args);
                else error.call(this, {message: __(message, args)});
            }, this)
        };
        if (args) {
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
        this._change = $.proxy(function(ret) {
            if (ret) ret = ret.message || ret;
            if (!ret || ret.is_enabled == null) return;
            let old = this.is_enabled;
            this.is_enabled = !!ret.is_enabled;
            if (this.is_enabled !== old) {
                if (this.is_enabled)
                    frappe.realtime.on('show_alert', this._realtime);
                else frappe.realtime.off('show_alert', this._realtime);
                this.trigger('change');
            }
        }, this);
        this._realtime = $.proxy(function(ret) {
            if (ret) ret = ret.message || ret;
            if (this._is_valid(ret)) this.show(ret);
        }, this);
        frappe.realtime.on('alerts_app_status_changed', this._change);
        if (this.is_enabled) frappe.realtime.on('show_alert', this._realtime);
    }
    _is_valid(data) {
        if (!data || !this.$isDataObj(data) || this.$isEmptyObj(data)) return false;
        var user = frappe.session.user,
        score = 0;
        if (
            this.$isArr(data.users)
            && data.users.length
            && data.users.indexOf(user) >= 0
        ) score++;
        else if (
            this.$isArr(data.roles)
            && data.roles.length
            && frappe.user.has_role(data.roles)
        ) score++;
        if (!score) return false;
        if (
            this.$isArr(data.seen_today)
            && data.seen_today.indexOf(user) >= 0
        ) return false;
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
        if (!this._list.length) return this;
        
        var data = this._list.shift();
        this._dialog
            .setName(data.name)
            .setTitle(data.title)
            .setMessage(data.message)
            .setType(data.type)
            .onShow($.proxy(function() {
                this.request(
                    'mark_as_seen',
                    {name: this._dialog.getName()},
                    function(ret) {
                        if (!ret) this.error('An error was encountered.');
                    }
                );
            }, this), 200)
            .onHide($.proxy(function() { this._build(); }, this), 200)
            .render()
            .show();
        return this;
    }
    destroy() {
        frappe.realtime.off('show_alert', this._realtime);
        frappe.realtime.off('alerts_app_status_changed', this._change);
        if (this._dialog) this._dialog.destroy();
        if (this._mock) this._mock.destroy();
        this.is_ready = this.is_enabled = false;
        this._dialog = this._list = this._mock = this._change = this._realtime = null;
        return this;
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
            else if (this.$isObjLike(msg))
                try { msg = msg.message; } catch(_) { msg = null; }
            else
                try { msg = String(msg); } catch(_) { msg = null; }
        }
        if (!this.$isStr(msg)) msg = __('Invalid message');
        else if (args) msg = __(msg, args);
        else msg = __(msg);
        if (!this.$isStr(title)) title = def_title;
        let data = {
            title: '[Alerts]: ' + __(title),
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
        if (this.$type(args) === 'Arguments')
            args = Array.prototype.slice.call(args);
        if (!this.$isArr(args) || !args.length) return this;
        let prefix = '[Alerts]';
        if (!this.$isStr(args[0])) args.unshift(prefix);
        else args[0] = prefix + ' ' + args[0];
        console[fn].apply(null, args);
        return this;
    }
    _log() {
        return this._console('log', arguments);
    }
    _error() {
        return this._console('error', arguments);
    }
    trigger(evt, data) {
        this._events.trigger(evt, data);
        return this;
    }
    once(evt, handler) {
        if (evt === 'ready' && this.is_ready)
            handler.call(this);
        else this._events.one(evt, $.bind(function(e, data) {
            handler.call(this, data);
        }, this));
        return this;
    }
    on(evt, handler) {
        if (evt === 'ready' && this.is_ready)
            handler.call(this);
        else this._events.bind(evt, $.bind(function(e, data) {
            handler.call(this, data);
        }, this));
        return this;
    }
    off(evt, handler) {
        this._events.unbind(evt, $.bind(function(e, data) {
            handler.call(this, data);
        }, this));
        return this;
    }
    setup_form(frm) {
        try {
            if (!this.is_enabled) {
                frm._app_disabled = true;
                if (!frm._form_disabled) {
                    this.disable_form(frm);
                    frm.set_intro(__('Alerts app is disabled.'), 'red');
                }
                frm._form_disabled = true;
            } else {
                frm._app_disabled = false;
                if (frm._form_disabled) {
                    this.enable_form(frm);
                    frm.set_intro();
                }
                frm._form_disabled = false;
            }
        } catch(e) {
            this._error('Setup form', e.message, e.stack);
        } finally {
            this.has_error = false;
        }
        return this;
    }
    enable_form(frm) {
        try {
            var fields = null;
            if (this.$isArr(frm._disabled_fields) && frm._disabled_fields.length)
                fields = frm._disabled_fields.splice(0, frm._disabled_fields.length);
            frm.fields.forEach(function(field) {
                if (!fields || fields.indexOf(field.df.fieldname) >= 0)
                    frm.set_df_property(field.df.fieldname, 'read_only', '0');
            });
            frm.enable_save();
        } catch(e) {
            this._error('Enable form', e.message, e.stack);
        } finally {
            this.has_error = false;
        }
        return this;
    }
    disable_form(frm, workflow) {
        try {
            if (!this.$isArr(frm._disabled_fields))
                frm._disabled_fields = [];
            frm.fields.forEach(function(field) {
                if (!cint(field.df.read_only)) {
                    frm._disabled_fields.push(field.df.fieldname);
                    frm.set_df_property(field.df.fieldname, 'read_only', 1);
                }
            });
            frm.disable_save();
        } catch(e) {
            this._error('Disable form', e.message, e.stack);
        } finally {
            this.has_error = false;
        }
        return this;
    }
}


class AlertsDialog extends AlertsUtils {
    constructor(id, _class) {
        this._id = id;
        this._class = _class;
        this.resetData();
        this._style = new AlertsStyle(this._id, this._class);
        this._opts = {};
        this._sound = {loaded: 0, playing: 0, timeout: null};
    }
    setName(text) {
        if (this.$isStr(text) && text.length)
            this._name = text;
        return this;
    }
    getName() {
        return this._name;
    }
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
        this._style && this._style.build(type);
        this.setSize(type.size);
        this.setTimeout(type.display_timeout);
        this.setSound(type.display_sound, type.custom_display_sound);
        return this;
    }
    setSize(size) {
        if (this.$isStr(size) && size.length)
            this._opts.size = size;
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
            .on('canplaythrough', $.proxy(function() {
                this._sound.loaded = 1;
            }, this));
        this.$sound[0].load();
        return this;
    }
    beforeShow(fn) {
        if (this.$isFunc(fn)) this._pre_show = $.proxy(fn, this);
        return this;
    }
    onShow(fn, delay) {
        if (this.$isFunc(fn)) {
            if (cint(delay) < 1) this._on_show = $.proxy(fn, this);
            else this._on_show = $.proxy(function() {
                window.setTimeout($.proxy(fn, this), cint(delay));
            }, this);
        }
        return this;
    }
    onHide(fn, delay) {
        if (this.$isFunc(fn)) {
            if (cint(delay) < 1) this._on_hide = $.proxy(fn, this);
            else this._on_hide = $.proxy(function() {
                window.setTimeout($.proxy(fn, this), cint(delay));
            }, this);
        }
        return this;
    }
    render() {
        if (this._dialog) this.reset();
        this._dialog = new frappe.ui.Dialog(this._opts);
        this._dialog.$wrapper.addClass(this._class);
        if (this._message) this._dialog.set_message(this._message);
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
            window.setTimeout($.proxy(this.hide, this), this._timeout);
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
            this.$sound.get(0).play();
            return this;
        }
        this.stopSound();
        this._sound.timeout = window.setTimeout($.proxy(this.playSound, this), 200);
        return this;
    }
    stopSound() {
        if (this._sound.timeout) window.clearTimeout(this._sound.timeout);
        this._sound.timeout = null;
        if (this.$sound && this._sound.playing)
            this.$sound.get(0).stop();
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
    resetData() {
        this._style = this.$sound = null;
        this._name = this._opts = this._message = null;
        this._dialog = this._timeout = this._sound = null;
        this._pre_show = this._on_show = this._on_hide = null;
    }
    destroy() {
        this.reset();
        this._style && this._style.destroy();
        this.$sound && this.$sound.remove();
        this.resetData();
    }
}


class AlertsMock {
    constructor() {
        this._id = frappe.utils.get_random(5);
        this._dialog = new AlertsDialog(this._id, 'mock-alert-dialog-' + this._id);
    }
    build(data) {
        if (
            this._dialog
            && this._dialog.$isDataObj(data)
            && !this._dialog.$isEmptyObj(data)
        ) {
            this._dialog
                .setTitle(data.title)
                .setMessage('This is a mock alert message.')
                .setType(data)
                .render()
                .show();
        }
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
        this._dialog = null;
    }
}


class AlertsStyle extends AlertsUtils {
    constructor(id, _class) {
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
            css.push('$0{background:$1}'.replace('$0', sel).replace('$1', data.background));
        if (this.$isStr(data.border_color) && data.border_color.length)
            css.push(
                '$0,$0>.modal-header,$0>.modal-footer{border:1px solid $1}'
                .replace(/\$0/g, sel).replace('$1', data.border_color)
            );
        if (this.$isStr(data.title_color) && data.title_color.length)
            css.push(
                ('$0>$1>$2>.modal-title{color:$3}'
                + '$0>$1>$2>.indicator::before{background:$3}'
                + '$0>$1>.modal-actions>.btn{color:$3}')
                .replace(/\$0/g, sel).replace(/\$1/g, '.modal-header')
                .replace(/\$2/g, '.title-section').replace(/\$3/g, data.title_color)
            );
        if (this.$isStr(data.content_color) && data.content_color.length)
            css.push(
                '$0>$1,$0>$1>.modal-message{color:$2}'
                .replace(/\$0/g, sel).replace(/\$1/g, '.modal-body')
                .replace('$2', data.content_color)
            );
        if (css.length) {
            css = css.join("\n");
            if (this._dom.styleSheet) this._dom.styleSheet.cssText = css;
            else this._dom.appendChild(document.createTextNode(css));
        }
        return this;
    }
    destroy() {
        this._dom && this._dom.parentNode.removeChild(this._dom);
        this._id = this._class = this._dom = null;
        return this;
    }
}


$(document).ready(function() {
    frappe.alerts = new Alerts();
    frappe.after_ajax(function() {
        if (
            frappe.boot
            && frappe.boot.alerts
            && frappe.alerts.$isArr(frappe.boot.alerts)
            && frappe.boot.alerts.length
        ) frappe.alerts.show(frappe.boot.alerts);
    });
    window.addEventListener('beforeunload', function() {
        frappe.alerts.destroy();
    });
    $(window).on('hashchange', function() {
        frappe.alerts.destroy();
    });
    window.addEventListener('popstate', function() {
        frappe.alerts.destroy();
    });
});
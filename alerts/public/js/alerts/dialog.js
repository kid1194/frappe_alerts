/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


import {
    isValidString,
    isValidPlainObject,
    isFunction,
    isInteger,
    fn
} from './../utils';
import AlertsStyle from './style.js';


export default class AlertsDialog {
    constructor(id, _class) {
        this._id = id;
        this._class = _class;
        
        this.resetData();
        
        this._style = new AlertsStyle(this._id, this._class);
        this._opts = {};
        this._sound = {loaded: 0, playing: 0, timeout: null};
    }
    setName(text) {
        this._name = isValidString(text) ? text : null;
        return this;
    }
    getName() {
        return this._name;
    }
    setTitle(text, args) {
        this._opts.title = isValidString(text) ? __(text ,args) : null;
        return this;
    }
    setMessage(text, args) {
        this._message = isValidString(text) ? __(text ,args) : null;
        return this;
    }
    setType(type) {
        if (!isValidPlainObject(type)) return this;
        this._style && this._style.build(type);
        this.setSize(type.size);
        this.setTimeout(type.display_timeout);
        this.setSound(type.display_sound, type.custom_display_sound);
        return this;
    }
    setSize(size) {
        this._opts.size = isValidString(size) ? size : null;
        return this;
    }
    setTimeout(sec) {
        sec = cint(sec);
        this._timeout = sec > 0 ? cint(sec * 1000) : null;
        return this;
    }
    setSound(file, fallback) {
        this.stopSound();
        this._sound.loaded = 0;
        if (!isValidString(file) || file === 'None') return this;
        if (file === 'Custom') file = fallback;
        else file = '/assets/frappe/sounds/' + file.toLowerCase() + '.mp3';
        if (!isValidString(file)) return this;
        if (!this.$sound) {
            this.$sound = $('<audio>')
                .attr('id', 'sound-' + this._id)
                .attr('volume', '0.2')
                .attr('preload', 'auto')
                .appendTo($('body'));
        }
        this.$sound
            .off('canplaythrough')
            .attr('src', file)
            .on('canplaythrough', fn(function() {
                this._sound.loaded = 1;
            }, this));
        
        this.$sound.get(0).load();
    }
    beforeShow(func, bind) {
        if (!isFunction(func)) this._pre_show = null;
        else {
            this._pre_show = fn(function() {
                func.call(bind || this, this);
            }, this);
        }
        return this;
    }
    onShow(func, bind, delay) {
        if (!isFunction(func)) this._on_show = null;
        else {
            if (isInteger(bind)) {
                delay = bind;
                bind = null;
            }
            delay = cint(delay) || 0;
            this._on_show = fn(function() {
                window.setTimeout(fn(function() {
                    func.call(bind || this, this);
                }, this), delay);
            }, this);
        }
        return this;
    }
    onHide(func, bind, delay) {
        if (!isFunction(func)) this._on_hide = null;
        else {
            if (isInteger(bind)) {
                delay = bind;
                bind = null;
            }
            delay = cint(delay) || 0;
            this._on_hide = fn(function() {
                window.setTimeout(fn(function() {
                    func.call(bind || this, this);
                }, this), delay);
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
        if (this._timeout) window.setTimeout(fn(this.hide, this), this._timeout);
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
        this._sound.timeout = window.setTimeout(fn(this.playSound, this), 200);
        return this;
    }
    stopSound() {
        if (this._sound.timeout) window.clearTimeout(this._sound.timeout);
        this._sound.timeout = null;
        if (this.$sound && this._sound.playing) {
            this.$sound.get(0).stop();
        }
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
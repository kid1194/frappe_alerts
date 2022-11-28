/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


window.Alerts = (function() {
    class AlertStyle {
        constructor(id, _class) {
            this.id = id;
            this.class = _class;
            this.selector = '.' + this.class + ' > .modal-dialog > .modal-content';
            this.css = [];
            this.dom = null;
        }
        update(data) {
            if (typeof data !== 'string') return;
            this.dom = $(frappe.dom.set_style(data, 'style-' + this.id));
        }
        build(data) {
            if (!$.isPlainObject(data)) return;
            if (data.background) {
                this.css.push(this.selector + ' {background:' + data.background + '}');
            }
            if (data.border_color) {
                let border = '1px solid ' + data.border_color;
                this.css.push(
                    this.selector + ' {border:' + border + '}'
                    + this.selector + ' > .modal-header {border:' + border + '}'
                    + this.selector + ' > .modal-footer {border:' + border + '}'
                );
            }
            if (data.title_color) {
                this.css.push(
                    this.selector
                    + ' > .modal-header > .title-section > .modal-title {'
                    + 'color:' + data.title_color + '}'
                    + this.selector
                    + ' > .modal-header > .title-section > .indicator::before {'
                    + 'background:' + data.title_color + '}'
                    + this.selector
                    + ' > .modal-header > .modal-actions > .btn {'
                    + 'color:' + data.title_color + '}'
                );
            }
            if (data.content_color) {
                this.css.push(
                    this.selector + ' > .modal-body,'
                    + this.selector + ' > .modal-body > .modal-message {'
                    + 'color:' + data.title_color + '}'
                );
            }
            if (this.css.length) {
                this.update(this.css.join(''));
                this.css.splice(0, this.css.length);
            }
        }
        destroy() {
            this.id = null;
            this.class = null;
            this.selector = null;
            this.css.length && this.css.splice(0, this.css.length);
            this.css = null;
            this.dom && this.dom.remove();
            this.dom = null;
        }
    }
    class AlertMock {
        constructor(id) {
            this.class = 'mock-alert';
            this.base = new AlertStyle(id, this.class + '-base');
            this.style = new AlertStyle(id, this.class);
            this.isReady = 0;
        }
        appendTo(dom) {
            if (
                typeof dom !== 'object'
                || dom.nodeType == null
                || this.isReady
            ) return;
            
            this.isReady = 1;
            this.base.update(`
                .${this.class} {
                    position: relative;
                    top: auto;
                    right: auto;
                    left: auto;
                    bottom: auto;
                    display: block;
                    z-index: 1;
                }
            `)
            let mock = frappe.get_modal(
                __('Mock Alert'),
                '<div class="modal-message">'
                    + __('This is a mock alert for testing purposes.')
                + '</div>'
            );
            mock
                .addClass(this.class)
                .removeClass('fade')
                .appendTo(dom);
        }
        css(data) {
            this.style.build(data);
        }
        destroy() {
            this.base.destroy();
            this.style.destroy();
            this.base = null;
            this.style = null;
            this.isReady = 0;
        }
    }
    class Alerts {
        constructor() {
            this.id = frappe.utils.get_random(5);
            this.class = 'alert-dialog-' + this.id;
            this.style = new AlertStyle(this.id, this.class);
            
            this.dialog = null;
            this.$sound = null;
            this.soundLoaded = 0;
            
            this.list = null;
        }
        error(text, args, _throw) {
            if (_throw == null && args === true) {
                _throw = args;
                args = null;
            }
            if (_throw) {
                frappe.throw(__(text, args));
                return this;
            }
            frappe.msgprint({
                title: __('Error'),
                indicator: 'Red',
                message: __(text, args),
            });
        }
        mock(dom) {
            let mock = new AlertMock();
            mock.appendTo(dom);
            return mock;
        }
        show(list) {
            if (!$.isArray(list)) list = [list];
            if (!$.isPlainObject(list[0])) return;
            if (!this.list) this.list = [];
            Array.prototype.push.apply(this.list, list);
            if (!this.dialog) this.build();
        }
        build() {
            if (!this.list.length) {
                this.destroy();
                return;
            }
            
            if (!this.dialog) {
                this.dialog = new frappe.ui.Dialog();
                this.dialog.$wrapper.addClass(this.class);
                this.dialog.onhide = this.fn(function() {
                    this.stopSound();
                    window.setTimeout(this.fn(function() {
                        this.build();
                    }), 200);
                });
            }
            
            let data = this.list.shift();
            
            this.dialog.set_title(__(data.title));
            this.dialog.set_message(__(data.content));
            
            this.style.build(data.type);
            
            this.setSound(data.type);
            this.playSound();
            
            this.dialog.show();
            
            if (cint(data.type.display_timeout) > 0) {
                window.setTimeout(this.fn(function() {
                    this.dialog.hide();
                }), cint(data.type.display_timeout) * 1000);
            }
            
            frappe.call({
                type: 'POST',
                method: 'alerts.utils.alert.mark_as_seen',
                args: {name: data.name},
                callback: function(ret) {
                    if (ret && $.isPlainObject(ret)) ret = ret.message || ret;
                    if (!cint(ret)) {
                        frappe.msgprint({
                            title: __('Error [102]'),
                            indicator: 'Red',
                            message: __('Alerts module has encountered an error.'),
                        });
                    }
                }
            });
        }
        setSound(data) {
            this.soundLoaded = 0;
            if (!data.display_sound) return;
            if (data.display_sound === 'Custom') {
                data.display_sound = data.custom_display_sound;
            } else {
                data.display_sound = data.display_sound.toLowerCase();
                data.display_sound = '/assets/frappe/sounds/' + data.display_sound + '.mp3';
            }
            if (!data.display_sound) return;
            if (!this.$sound) {
                this.$sound = $('<audio volume="0.2" preload="auto"><source src=""></source></audio>')
                    .attr('id', 'sound-' + this.id)
                    .appendTo($('body'));
            }
            this.$sound
                .off('canplaythrough')
                .attr('src', data.display_sound)
                .on('canplaythrough', this.fn(function() {
                    this.soundLoaded = 1;
                }));
            
            this.$sound.get(0).load();
        }
        playSound() {
            this.$sound && this.soundLoaded && this.$sound.get(0).play();
        }
        stopSound() {
            this.$sound && this.$sound.get(0).stop();
        }
        fn(f) {
            var me = this;
            return function() {
                if (this && this !== me) {
                    Array.prototype.push.call(arguments, this);
                }
                return f && f.apply(me, arguments);
            };
        }
        destroy() {
            if (this.dialog) {
                this.dialog.hide();
                this.dialog.$wrapper.modal('destroy');
                this.dialog.$wrapper.remove();
            }
            
            this.style.destroy();
            this.$sound && this.$sound.remove();
            
            this.dialog = null;
            this.style = null;
            this.$sound = null;
            this.soundLoaded = 0;
            
            this.list = null;
        }
    }
    
    return new Alerts();
}());


$(function() {
    frappe.after_ajax(function() {
        frappe.provide('frappe.boot');
        if (
            frappe.boot.alerts
            && $.isArray(frappe.boot.alerts)
            && frappe.boot.alerts.length
        ) Alerts.show(frappe.boot.alerts);
        frappe.socketio.init();
        frappe.realtime.on('show_alert', function(ret) {
            if ($.isPlainObject(ret)) ret = ret.message || ret;
            if ($.isPlainObject(ret) && ret.title) {
                Alerts.show(ret);
            }
        });
    });
});
/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


window.Alerts = (function() {
    class Alerts {
        constructor() {
            this.dialog = null;
            this.$style = null;
            this.$sound = null;
            this.soundLoaded = 0;
            
            this.key = 'alert-dialog-' + frappe.utils.get_random(5);
            this.selector = '.' + this.key + ' > .modal-dialog > .modal-content';
            this.sounds = ['Alert', 'Error', 'Click', 'Cancel', 'Submit'];
            
            this.data = null;
            this.type = null;
            this.css = [];
        }
        mock(parent) {
            if ($(parent).find('.mock-alert').length) return;
            frappe.dom.set_style(`
                .mock-alert {
                    position: relative;
                    top: auto;
                    right: auto;
                    left: auto;
                    bottom: auto;
                    display: block;
                    z-index: 1;
                }
            `);
            let mock_dialog = frappe.get_modal(
                __('Mock Alert'),
                '<div class="modal-message">'
                    + __('This is a mock alert for testing purposes.')
                + '</div>'
            );
            mock_dialog
                .addClass(this.key)
                .addClass('mock-alert')
                .removeClass('fade')
                .appendTo(parent);
        }
        show() {
            if (!frappe.boot.alerts.length) {
                this.destroy();
                return;
            }
            
            if (!this.dialog) {
                this.dialog = new frappe.ui.Dialog();
                this.dialog.$wrapper.addClass(this.key);
                this.dialog.onhide = this.fn(function() {
                    window.setTimeout(this.fn(function() {
                        this.build();
                    }), 300);
                });
            }
            
            this.$style && this.$style.html('');
            
            this.data = frappe.boot.alerts.shift();
            
            this.dialog.set_title(__(this.data.title));
            this.dialog.set_message(__(this.data.content));
            
            this.setType(this.data.type);
            
            if (cint(this.type.alert_timeout) > 0) {
                window.setTimeout(this.fn(function() {
                    this.dialog.hide();
                }), cint(this.type.alert_timeout) * 1000);
            }
            
            this.playSound();
            
            this.dialog.show();
            
            frappe.call({
                type: 'POST',
                method: 'alerts.utils.alert.mark_as_seen',
                args: {name: this.data.name},
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
        setType(data, mock) {
            this.type = data;
            this.setStyle();
            if (!mock) this.setSound();
        }
        setStyle() {
            if (this.type.background) {
                this.css.push(this.selector + ' {background:' + this.type.background + '}');
            }
            if (this.type.border_color) {
                let border = this.type.border_size + 'px solid ' + this.type.border_color;
                this.css.push(
                    this.selector + ' {border:' + border + '}'
                    + this.selector + ' > .modal-header {border:' + border + '}'
                    + this.selector + ' > .modal-footer {border:' + border + '}'
                );
            }
            if (this.type.title_color) {
                this.css.push(
                    this.selector
                    + ' > .modal-header > .title-section > .modal-title {'
                    + 'color:' + this.type.title_color + '}'
                    + this.selector
                    + ' > .modal-header > .title-section > .indicator::before {'
                    + 'background:' + this.type.title_color + '}'
                    + this.selector
                    + ' > .modal-header > .modal-actions > .btn {'
                    + 'color:' + this.type.title_color + '}'
                );
            }
            if (this.type.content_color) {
                this.css.push(
                    this.selector + ' > .modal-body,'
                    + this.selector + ' > .modal-body > .modal-message {'
                    + 'color:' + this.type.title_color + '}'
                );
            }
            if (this.css.length) {
                this.$style = $(frappe.dom.set_style(this.css.join(''), this.key));
                this.css.splice(0, this.css.length);
            }
        }
        setSound() {
            this.soundLoaded = 0;
            if (!this.type.alert_sound) return;
            if (this.sounds.indexOf(this.type.alert_sound) >= 0) {
                this.type.alert_sound = this.type.alert_sound.toLowerCase();
                this.type.alert_sound = '/assets/frappe/sounds/' + this.type.alert_sound + '.mp3';
            } else if (this.type.alert_sound === 'Custom') {
                this.type.alert_sound = this.type.custom_alert_sound;
            }
            if (!this.type.alert_sound) return;
            if (!this.$sound) {
                this.$sound = $('<audio volume="0.2"><source src=""></source></audio>')
                    .attr('id', 'sound-' + this.key)
                    .appendTo($('body'));
            }
            this.$sound
                .off('canplay')
                .attr('src', this.type.alert_sound)
                .on('canplay', this.fn(function() {
                    this.soundLoaded = 1;
                }));
            
            this.$sound.get(0).load();
        }
        playSound() {
            if (this.soundLoaded) {
                this.$sound.get(0).play();
                return;
            }
            window.setTimeout(this.fn(function() {
                this.playSound();
            }), 20);
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
            
            this.$style && this.$style.remove();
            this.$sound && this.$sound.remove();
            
            this.dialog = null;
            this.$style = null;
            this.$sound = null;
            this.soundLoaded = 0;
            
            this.data = null;
            this.type = null;
        }
    }
    
    return new Alerts();
}());


$(function() {
    frappe.after_ajax(function() {
        if (
            frappe.boot.alerts
            && $.isArray(frappe.boot.alerts)
            && frappe.boot.alerts.length
        ) Alerts.show();
    });
});
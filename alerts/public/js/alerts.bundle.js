/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


import {
    isValidArray,
    isValidPlainObject,
    request,
    error
} from './utils';
import AlertsDialog from './alerts/dialog.js';
import AlertsMock from './alerts/mock.js';


class Alerts {
    constructor() {
        this._id = frappe.utils.get_random(5);
        this._dialog = new AlertsDialog(this._id, 'alert-dialog-' + this._id);
        this._list = [];
    }
    mock() {
        return new AlertsMock();
    }
    show(list) {
        if (isValidPlainObject(list)) list = [list];
        if (!isValidArray(list)) return this;
        Array.prototype.push.apply(this._list, list);
        return this._build();
    }
    _build() {
        if (!this._list.length) {
            this.destroy();
            return this;
        }
        
        var data = this._list.shift();
        this._dialog
            .setName(data.name)
            .setTitle(data.title)
            .setMessage(data.message)
            .setType(data.type)
            .onShow(function() {
                request(
                    'alerts.utils.alert.mark_as_seen',
                    {name: this.getName()},
                    function(ret) {
                        if (!cint(ret)) error('Module has encountered an error.');
                    }
                );
            }, 200)
            .onHide(function() { this._build(); }, this, 200)
            .render()
            .show();
        return this;
    }
    destroy() {
        this._dialog && this._dialog.destroy();
        this._dialog = this._list = null;
    }
}


$(function() {
    frappe.Alerts = new Alerts();
    
    frappe.after_ajax(function() {
        if (
            frappe.boot
            && frappe.boot.alerts
            && isValidArray(frappe.boot.alerts)
        ) frappe.Alerts.show(frappe.boot.alerts);
        
        frappe.socketio.init();
        frappe.realtime.on('show_alert', function(ret) {
            if (isValidPlainObject(ret)) ret = ret.message || ret;
            if (isValidPlainObject(ret) && ret.title) {
                frappe.Alerts.show(ret);
            }
        });
    });
});
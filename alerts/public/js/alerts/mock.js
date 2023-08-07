/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


import {
    isValidPlainObject
} from './../utils';
import AlertsDialog from './dialog.js';


export default class AlertsMock {
    constructor() {
        this._id = frappe.utils.get_random(5);
        this._dialog = new AlertsDialog(this._id, 'mock-alert-dialog-' + this._id);
    }
    build(data) {
        if (isValidPlainObject(data) && this._dialog) {
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
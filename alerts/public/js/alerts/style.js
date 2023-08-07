/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


import {
    isValidString,
    isValidPlainObject,
    replace
} from './../utils';


export default class AlertsStyle {
    constructor(id, _class) {
        this._id = 'style-' + id;
        this._class = _class;
        this._dom = document.createElement('style');
        this._dom.id = this._id;
        this._dom.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(this._dom);
    }
    update(css) {
        if (isValidString(css)) {
            if (this._dom.styleSheet) this._dom.styleSheet.cssText = css;
            else this._dom.appendChild(document.createTextNode(css));
        }
        return this;
    }
    build(data) {
        if (!isValidPlainObject(data)) return this;
        var sel = replace('.$0>.modal-dialog>.modal-content', this._class),
        css = [];
        if (isValidString(data.background)) {
            css.push(replace('$0{background:$1}', sel, data.background));
        }
        if (isValidString(data.border_color)) {
            css.push(replace(
                '$0,$0>.modal-header,$0>.modal-footer{border:1px solid $1}',
                sel, data.border_color
            ));
        }
        if (isValidString(data.title_color)) {
            css.push(replace(
                '$0>$1>$2>.modal-title{color:$3}'
                + '$0>$1>$2>.indicator::before{background:$3}'
                + '$0>$1>.modal-actions>.btn{color:$3}',
                sel, '.modal-header', '.title-section', data.title_color
            ));
        }
        if (isValidString(data.content_color)) {
            css.push(replace(
                '$0>$1,$0>$1>.modal-message{color:$2}',
                sel, '.modal-body', data.title_color
            ));
        }
        if (css.length) this.update(css.join(''));
    }
    destroy() {
        this._dom && this._dom.parentNode.removeChild(this._dom);
        this._id = this._class = this._dom = null;
    }
}
/*
*  Alerts © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to LICENSE file
*/


// Helpers
function objectType(v) {
    if (v == null) return v === undefined ? 'Undefined' : 'Null';
    let t = Object.prototype.toString.call(v).slice(8, -1);
    return t === 'Number' && isNaN(v) ? 'NaN' : t;
}
function ofType(v, t) {
    return objectType(v) === t;
}
function ofAny(v, t) {
    return t.split(' ').indexOf(objectType(v)) >= 0;
}
function propertyOf(v, k) {
    return Object.prototype.hasOwnProperty.call(v, k);
}

// Checks
function isObjectLike(v) {
    return v != null && typeof v === 'object';
}
function isObject(v) {
    return isObjectLike(v)
        && isObjectLike(Object.getPrototypeOf(Object(v)) || {})
        && !ofAny(v, 'String Number Boolean Array RegExp Date URL');
}
function isNumber(v) {
    return v != null && ofType(v, 'Number') && !isNaN(v);
}
function isLength(v) {
    return isNumber(v) && v >= 0 && v % 1 == 0 && v <= 9007199254740991;
}
function isInteger(v) {
    return isNumber(v) && v === Number(parseInt(v));
}
function isArrayLike(v) {
    return v != null && !$.isFunction(v) && isObjectLike(v)
    && !$.isWindow(v) && !isInteger(v.nodeType) && isLength(v.length);
}
function isString(v) {
    return v != null && ofType(v, 'String');
}
function isArray(v) {
    return v != null && $.isArray(v);
}
function isPlainObject(v) {
    return v != null && $.isPlainObject(v);
}
//?
function isEmpty(v) {
    if (v == null) return true;
    if (isString(v) || isArray(v)) return !v.length;
    if (isObject(v)) return $.isEmptyObject(v);
    return !v;
}
function isValidString(v) {
    return isString(v) && v.length;
}
function isValidPlainObject(v) {
    return isPlainObject(v) && !$.isEmptyObject(v);
}
function isFunction(v) {
    return v != null && $.isFunction(v);
}
function isValidArray(v) {
    return isArray(v) && v.length;
}

// Data
function each(data, fn, bind) {
    bind = bind || null;
    if (isArrayLike(data)) {
        for (var i = 0, l = data.length; i < l; i++) {
            if (fn.apply(bind, [data[i], i]) === false) return;
        }
    } else if (isObject(data)) {
        for (var k in data) {
            if (fn.apply(bind, [data[k], k]) === false) return;
        }
    }
}

// String
function replace() {
    var args = Array.prototype.slice.call(arguments),
    v = '' + args.shift(),
    a = $.isFunction(v.replaceAll);
    each(args, function(y, i) {
        if (a) v = v.replaceAll('\$' + (i++), '' + y);
        else v = v.replace(new RegExp('\$' + (i++), 'g'), '' + y);
    });
    return v;
}

// Function
function fn(fn, cls) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        if (this != null) args.push(this);
        return isFunction(fn) && fn.apply(cls, args);
    };
}

// Error
function elog() {
    var pre = '[Alerts]: ';
    each(arguments, function(v) {
        if (isString(v)) console.error(pre + v);
        else console.error(pre, v);
    });
}
function error(text, args, _throw) {
    if (_throw == null && args === true) {
        _throw = args;
        args = null;
    }
    text = '[Alerts]: ' + text;
    if (_throw) {
        frappe.throw(__(text, args));
        return;
    }
    frappe.msgprint({
        title: __('Error'),
        indicator: 'Red',
        message: __(text, args),
    });
}

// Call
function request(method, args, success, always) {
    if (args && isFunction(args)) {
        if (isFunction(success)) always = success;
        success = args;
        args = null;
    }
    let data = {type: args != null ? 'POST' : 'GET'};
    if (args != null) {
        if (!isPlainObject(args)) data.args = {'data': args};
        else {
            data.args = args;
            if (args.type && args.args) {
                data.type = args.type;
                data.args = args.args;
            }
        }
    }
    if (isString(method)) {
        data.method = 'frappe_better_attach_control.api.' + method;
    } else if (isArray(method)) {
        data.doc = method[0];
        data.method = method[1];
    } else {
        elog('The method passed is invalid', arguments);
        return;
    }
    data.error = function(e) {
        elog('Call error.', e);
        error('Unable to make the call to {0}', [data.method]);
    };
    if (isFunction(success)) {
        data.callback = function(ret) {
            if (isValidPlainObject(ret)) ret = ret.message || ret;
            try {
                success.call(ret);
            } catch(e) { error(e); }
        };
    }
    if (isFunction(always)) data.always = always;
    try {
        frappe.call(data);
    } catch(e) {
        error(e);
    }
}

// Export
export {
    isValidString,
    isValidPlainObject,
    replace,
    isFunction,
    isInteger,
    isValidArray,
    fn,
    error,
    request
};
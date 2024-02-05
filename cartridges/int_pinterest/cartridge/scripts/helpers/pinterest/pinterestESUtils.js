'use strict';

// substitute for Object.assign() to support ES5 to support compatibility mode >= 18.10
var objAssign = function() {
    if (arguments.length < 1 || arguments[0] === undefined || arguments[0] === null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    var target = arguments[0];
    var output = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
    }
    return output;
}

module.exports = {
    objAssign: objAssign
}
"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _SerializableEntityBase_parseAttempted, _SerializableEntityBase_parsing;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializableEntityBase = void 0;
/**
 * Makes buffer deserialization single-use, including failed attempts.
 * Parser methods must be prototype methods; assigning a parser on the instance
 * after construction replaces its guard. Internal parser delegation is allowed.
 */
class SerializableEntityBase {
    constructor() {
        /** Set in a subclass constructor only if its parsers safely support reuse. */
        this.allowRepeatedFromBuffer = false;
        _SerializableEntityBase_parseAttempted.set(this, false);
        _SerializableEntityBase_parsing.set(this, false);
        Object.defineProperty(this, "allowRepeatedFromBuffer", { enumerable: false });
        for (const name of ["fromBuffer", "fromDataBuffer", "fromBufferOptionalType"]) {
            const parse = this[name];
            if (typeof parse !== "function")
                continue;
            // Capture the most-derived implementation. super calls continue to use
            // prototype methods, so they remain part of the same parsing attempt.
            Object.defineProperty(this, name, {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (...args) {
                    if (__classPrivateFieldGet(this, _SerializableEntityBase_parsing, "f"))
                        return parse.apply(this, args);
                    if (__classPrivateFieldGet(this, _SerializableEntityBase_parseAttempted, "f") && !this.allowRepeatedFromBuffer) {
                        throw new Error("Deserialization already attempted on this instance");
                    }
                    __classPrivateFieldSet(this, _SerializableEntityBase_parseAttempted, true, "f");
                    __classPrivateFieldSet(this, _SerializableEntityBase_parsing, true, "f");
                    try {
                        return parse.apply(this, args);
                    }
                    finally {
                        __classPrivateFieldSet(this, _SerializableEntityBase_parsing, false, "f");
                    }
                }
            });
        }
    }
}
exports.SerializableEntityBase = SerializableEntityBase;
_SerializableEntityBase_parseAttempted = new WeakMap(), _SerializableEntityBase_parsing = new WeakMap();

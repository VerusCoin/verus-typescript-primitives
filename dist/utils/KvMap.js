"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KvMap = void 0;
const CompactAddressObject_1 = require("../vdxf/classes/CompactAddressObject");
/**
 * KvMap<T> is a generic map keyed by CompactIAddressObject, storing values of type T.
 *
 * Internal storage uses hex-encoded CompactIAddressObject.toBuffer() strings as map keys so
 * that TYPE_FQN and TYPE_I_ADDRESS forms that resolve to the same iaddress are still stored
 * distinctly on the wire while being collision-protected at the logical level.
 *
 * Keys whose toIAddress() resolves to the same iaddress are rejected to prevent on-chain
 * collisions (an FQN and a TYPE_I_ADDRESS key can evaluate to the same underlying iaddress).
 */
class KvMap {
    constructor() {
        this._map = new Map();
    }
    static toInternalKey(key) {
        return key.toBuffer().toString('hex');
    }
    static keyFromInternalKey(hexKey) {
        const key = new CompactAddressObject_1.CompactIAddressObject();
        key.fromBuffer(Buffer.from(hexKey, 'hex'));
        return key;
    }
    get size() {
        return this._map.size;
    }
    set(key, value) {
        const internalKey = KvMap.toInternalKey(key);
        if (!this._map.has(internalKey)) {
            const newIAddr = key.toIAddress();
            for (const hexKey of this._map.keys()) {
                const existing = KvMap.keyFromInternalKey(hexKey);
                if (existing.toIAddress() === newIAddr) {
                    throw new Error(`KvMap key collision: a different key already resolves to iaddress ${newIAddr}`);
                }
            }
        }
        this._map.set(internalKey, value);
        return this;
    }
    get(key) {
        return this._map.get(KvMap.toInternalKey(key));
    }
    has(key) {
        return this._map.has(KvMap.toInternalKey(key));
    }
    delete(key) {
        return this._map.delete(KvMap.toInternalKey(key));
    }
    entries() {
        const map = this._map;
        function* gen() {
            for (const [hexKey, value] of map.entries()) {
                yield [KvMap.keyFromInternalKey(hexKey), value];
            }
        }
        return gen();
    }
}
exports.KvMap = KvMap;

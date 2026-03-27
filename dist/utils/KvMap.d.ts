import { CompactIAddressObject } from '../vdxf/classes/CompactAddressObject';
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
export declare class KvMap<T> {
    private _map;
    private static toInternalKey;
    private static keyFromInternalKey;
    get size(): number;
    set(key: CompactIAddressObject, value: T): this;
    get(key: CompactIAddressObject): T | undefined;
    has(key: CompactIAddressObject): boolean;
    delete(key: CompactIAddressObject): boolean;
    private findInternalKeyByAddress;
    getByAddress(iAddress: string): T | undefined;
    hasAddress(iAddress: string): boolean;
    setByAddress(iAddress: string, value: T): this;
    deleteByAddress(iAddress: string): boolean;
    entries(): IterableIterator<[CompactIAddressObject, T]>;
}

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
export class KvMap<T> {
  private _map: Map<string, T> = new Map();

  private static toInternalKey(key: CompactIAddressObject): string {
    return key.toBuffer().toString('hex');
  }

  private static keyFromInternalKey(hexKey: string): CompactIAddressObject {
    const key = new CompactIAddressObject();
    key.fromBuffer(Buffer.from(hexKey, 'hex'));
    return key;
  }

  get size(): number {
    return this._map.size;
  }

  set(key: CompactIAddressObject, value: T): this {
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

  get(key: CompactIAddressObject): T | undefined {
    return this._map.get(KvMap.toInternalKey(key));
  }

  has(key: CompactIAddressObject): boolean {
    return this._map.has(KvMap.toInternalKey(key));
  }

  delete(key: CompactIAddressObject): boolean {
    return this._map.delete(KvMap.toInternalKey(key));
  }

  private findInternalKeyByAddress(iAddress: string): string | undefined {
    for (const hexKey of this._map.keys()) {
      const existing = KvMap.keyFromInternalKey(hexKey);
      if (existing.toIAddress() === iAddress) {
        return hexKey;
      }
    }
    return undefined;
  }

  getByAddress(iAddress: string): T | undefined {
    const hexKey = this.findInternalKeyByAddress(iAddress);
    return hexKey !== undefined ? this._map.get(hexKey) : undefined;
  }

  hasAddress(iAddress: string): boolean {
    return this.findInternalKeyByAddress(iAddress) !== undefined;
  }

  setByAddress(iAddress: string, value: T): this {
    const hexKey = this.findInternalKeyByAddress(iAddress);
    if (hexKey !== undefined) {
      this._map.set(hexKey, value);
    } else {
      const key = CompactIAddressObject.fromAddress(iAddress);
      this._map.set(KvMap.toInternalKey(key), value);
    }
    return this;
  }

  deleteByAddress(iAddress: string): boolean {
    const hexKey = this.findInternalKeyByAddress(iAddress);
    if (hexKey !== undefined) {
      return this._map.delete(hexKey);
    }
    return false;
  }

  entries(): IterableIterator<[CompactIAddressObject, T]> {
    const map = this._map;

    function* gen(): Generator<[CompactIAddressObject, T]> {
      for (const [hexKey, value] of map.entries()) {
        yield [KvMap.keyFromInternalKey(hexKey), value];
      }
    }

    return gen() as IterableIterator<[CompactIAddressObject, T]>;
  }
}

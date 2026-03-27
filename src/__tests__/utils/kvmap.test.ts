import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject';
import { KvMap } from '../../utils/KvMap';

const ADDR_A = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
const ADDR_B = 'iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j';
const ADDR_C = 'i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz';

function keyFromAddr(addr: string): CompactIAddressObject {
  return CompactIAddressObject.fromAddress(addr);
}

describe('KvMap — address-based methods', () => {
  let map: KvMap<string>;

  beforeEach(() => {
    map = new KvMap<string>();
    map.set(keyFromAddr(ADDR_A), 'valueA');
    map.set(keyFromAddr(ADDR_B), 'valueB');
  });

  describe('hasAddress', () => {
    it('returns true for an address that exists in the map', () => {
      expect(map.hasAddress(ADDR_A)).toBe(true);
      expect(map.hasAddress(ADDR_B)).toBe(true);
    });

    it('returns false for an address not in the map', () => {
      expect(map.hasAddress(ADDR_C)).toBe(false);
    });
  });

  describe('getByAddress', () => {
    it('returns the value for a matching address', () => {
      expect(map.getByAddress(ADDR_A)).toBe('valueA');
      expect(map.getByAddress(ADDR_B)).toBe('valueB');
    });

    it('returns undefined for a non-existent address', () => {
      expect(map.getByAddress(ADDR_C)).toBeUndefined();
    });
  });

  describe('setByAddress', () => {
    it('updates the value when the address already exists', () => {
      map.setByAddress(ADDR_A, 'updatedA');
      expect(map.getByAddress(ADDR_A)).toBe('updatedA');
      expect(map.size).toBe(2);
    });

    it('inserts a new entry when the address does not exist', () => {
      map.setByAddress(ADDR_C, 'valueC');
      expect(map.getByAddress(ADDR_C)).toBe('valueC');
      expect(map.size).toBe(3);
    });

    it('returns this for chaining', () => {
      const result = map.setByAddress(ADDR_C, 'valueC');
      expect(result).toBe(map);
    });
  });

  describe('deleteByAddress', () => {
    it('removes an existing entry and returns true', () => {
      expect(map.deleteByAddress(ADDR_A)).toBe(true);
      expect(map.hasAddress(ADDR_A)).toBe(false);
      expect(map.size).toBe(1);
    });

    it('returns false when the address does not exist', () => {
      expect(map.deleteByAddress(ADDR_C)).toBe(false);
      expect(map.size).toBe(2);
    });
  });

  describe('address methods work with keys inserted via set()', () => {
    it('getByAddress finds entries added via set() with CompactIAddressObject', () => {
      const freshMap = new KvMap<number>();
      freshMap.set(keyFromAddr(ADDR_A), 42);

      expect(freshMap.getByAddress(ADDR_A)).toBe(42);
      expect(freshMap.hasAddress(ADDR_A)).toBe(true);
    });

    it('setByAddress updates entries originally added via set()', () => {
      map.setByAddress(ADDR_A, 'overwritten');
      expect(map.get(keyFromAddr(ADDR_A))).toBe('overwritten');
    });

    it('deleteByAddress removes entries originally added via set()', () => {
      map.deleteByAddress(ADDR_B);
      expect(map.has(keyFromAddr(ADDR_B))).toBe(false);
    });
  });
});

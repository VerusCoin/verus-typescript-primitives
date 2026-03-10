import { DEFAULT_VERUS_CHAINID, DEFAULT_VERUS_CHAINNAME, KOMODO_ASSETCHAIN_MAXLEN, NULL_I_ADDR } from "../constants/pbaas";
import { I_ADDR_VERSION, X_ADDR_VERSION } from "../constants/vdxf";
import { hash, hash160 } from "./hash";
import { toLowerCaseCLocale } from "./tolower";

const bs58check = require("bs58check")

export const fromBase58Check = (
  address: string
): { version: number; hash: Buffer } => {
  var payload = bs58check.decode(address);

  // TODO: 4.0.0, move to "toOutputScript"
  if (payload.length < 21) throw new TypeError(address + " is too short");
  if (payload.length > 22) throw new TypeError(address + " is too long");

  var multibyte = payload.length === 22;
  var offset = multibyte ? 2 : 1;

  var version = multibyte ? payload.readUInt16BE(0) : payload[0];
  var hash = payload.slice(offset);

  // Turn hash to buffer with Buffer.from due to strange bug where certain JS engines
  // don't keep hash a buffer
  return { version: version, hash: Buffer.from(hash) };
};

export const toBase58Check = (hash: Buffer, version: number): string => {
  // Zcash adds an extra prefix resulting in a bigger (22 bytes) payload. We identify them Zcash by checking if the
  // version is multibyte (2 bytes instead of 1)
  var multibyte = version > 0xff;
  var size = multibyte ? 22 : 21;
  var offset = multibyte ? 2 : 1;

  var payload = Buffer.allocUnsafe(size);
  multibyte
    ? payload.writeUInt16BE(version, 0)
    : payload.writeUInt8(version, 0);
  hash.copy(payload, offset);

  return bs58check.encode(payload);
};

export const nameAndParentAddrToAddr = (name: string, parentIAddr?: string, version: number = I_ADDR_VERSION): string => {
  let idHash: Buffer;
  const nameBuffer = Buffer.from(toLowerCaseCLocale(name), "utf8");

  if (parentIAddr == null) {
    idHash = hash(nameBuffer);
  } else {
    idHash = hash(nameBuffer);
    idHash = hash(fromBase58Check(parentIAddr).hash, idHash);
  }

  return toBase58Check(hash160(idHash), version);
}

export const nameAndParentAddrToIAddr = (name: string, parentIAddr?: string): string => {
  return nameAndParentAddrToAddr(name, parentIAddr, I_ADDR_VERSION)
}

export const fqnToAddress = (fullyqualifiedname: string, rootSystemName: string = "", version = I_ADDR_VERSION): string => {
  const splitFqnAt = fullyqualifiedname.split("@").filter(x => x.length > 0);

  if (splitFqnAt.length !== 1) throw new Error("Invalid name")

  const cleanFqn = splitFqnAt[0];

  const splitFqnDot = cleanFqn.split('.');

  if (
    toLowerCaseCLocale(splitFqnDot[splitFqnDot.length - 1]) !== toLowerCaseCLocale(rootSystemName) &&
    splitFqnDot[splitFqnDot.length - 1] !== ""
  ) {
    splitFqnDot.push(rootSystemName)
  }

  const name = splitFqnDot.shift();

  let Parent: Buffer;

  for (let i = splitFqnDot.length - 1; i >= 0; i--) {
    let idHash: Buffer;
    const parentName = Buffer.from(toLowerCaseCLocale(splitFqnDot[i]), "utf8");

    if (parentName.length > 0) {
      if (Parent == null) {
        idHash = hash(parentName);
      } else {
        idHash = hash(parentName);
        idHash = hash(Parent, idHash);
      }
  
      Parent = hash160(idHash);
    }
  }

  let idHash: Buffer;
  const nameBuffer = Buffer.from(toLowerCaseCLocale(name), "utf8");

  if (Parent == null) {
    idHash = hash(nameBuffer);
  } else {
    idHash = hash(nameBuffer);
    idHash = hash(Parent, idHash);
  }

  return toBase58Check(hash160(idHash), version);
}

export const fqnToParentFqn = (fullyqualifiedname: string, rootSystemName: string = ""): string | null => {
  const splitFqnAt = fullyqualifiedname.split("@").filter(x => x.length > 0);
  if (splitFqnAt.length !== 1) throw new Error("Invalid name");

  const splitFqnDot = splitFqnAt[0].split('.');

  if (
    toLowerCaseCLocale(splitFqnDot[splitFqnDot.length - 1]) !== toLowerCaseCLocale(rootSystemName) &&
    splitFqnDot[splitFqnDot.length - 1] !== ""
  ) {
    splitFqnDot.push(rootSystemName);
  }

  splitFqnDot.shift();

  const parentSegments = splitFqnDot.filter(s => s.length > 0);
  if (parentSegments.length === 0) return null;

  return parentSegments.join(".");
};

export const fqnToParentAddress = (fullyqualifiedname: string, rootSystemName: string = ""): string | null => {
  const parentFqn = fqnToParentFqn(fullyqualifiedname, rootSystemName);

  return parentFqn ? fqnToAddress(parentFqn + ".", "") : null;
};

export const toIAddress = (fullyqualifiedname: string, rootSystemName: string = ""): string => {
  return fqnToAddress(fullyqualifiedname, rootSystemName, I_ADDR_VERSION)
}

export const toXAddress = (fullyqualifiedname: string, rootSystemName: string = ""): string => {
  return fqnToAddress(fullyqualifiedname, rootSystemName, X_ADDR_VERSION)
}

function trimSpaces(
  name: string,
  removeDuals: boolean
): string {
  // Unicode "dual spaces" — visually space-like but potentially problematic
  const dualSpaces = [
    "\u0020", "\u00A0", "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004",
    "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200A", "\u200C", "\u200D",
    "\u202F", "\u205F", "\u3000"
  ];

  const isDual = (char: string) => dualSpaces.includes(char);
  const chars = [...name];
  const toRemove: number[] = [];
  const allDuals: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (isDual(char)) {
      const wasLastDual = allDuals.length && allDuals[allDuals.length - 1] === i - 1;

      const shouldRemove =
        removeDuals ||
        i === allDuals.length ||
        i === chars.length - 1 ||
        (removeDuals && wasLastDual);

      if (shouldRemove) {
        toRemove.push(i);
      }

      allDuals.push(i);

      // Edge case: chain of duals at the end
      if (
        i > 0 &&
        i === chars.length - 1 &&
        wasLastDual
      ) {
        let toRemoveIdx = toRemove.length - 1;
        let nextDual = 0;

        for (let j = allDuals.length - 1; j >= 0; j--) {
          const idx = allDuals[j];
          if (nextDual && idx !== nextDual - 1) break;

          if (toRemoveIdx < 0 || toRemove[toRemoveIdx] !== idx) {
            toRemove.splice(++toRemoveIdx, 0, idx);
          }

          toRemoveIdx--;
          nextDual = idx;
        }
      }
    }
  }

  // Remove characters from end to start
  for (let i = toRemove.length - 1; i >= 0; i--) {
    chars.splice(toRemove[i], 1);
  }

  return chars.join("");
}

function parseSubNames(
  name: string,
  addVerus?: boolean,
  removeDuals: boolean = false,
  verusChainName: string = DEFAULT_VERUS_CHAINNAME
): { names: string[]; chain: string } {
  const parts = name.split("@");
  if (
    parts.length === 0 ||
    parts.length > 2 ||
    (parts.length > 1 && trimSpaces(parts[1], removeDuals) !== parts[1])
  ) {
    return { names: [], chain: "" };
  }

  let chain = "";
  let explicitChain = false;

  if (parts.length === 2 && parts[1] !== "") {
    chain = parts[1];
    explicitChain = true;
  }

  let retNames = parts[0].split(".");

  // If the name ends with a dot, it's an indicator to not add Verus
  if (retNames[retNames.length - 1] === "") {
    addVerus = false;
    retNames.pop();
  }

  const verusChainNameLc = toLowerCaseCLocale(verusChainName)

  if (addVerus) {
    if (explicitChain) {
      const chainParts = chain.split(".");
      const lastChainPart = toLowerCaseCLocale(chainParts[chainParts.length - 1])

      if (lastChainPart !== "" && lastChainPart !== verusChainNameLc) {
        chainParts.push(verusChainNameLc);
        chain = chainParts.join(".");
      } else if (lastChainPart === "") {
        chainParts.pop();
        chain = chainParts.join(".");
      }
    }

    const lastName = toLowerCaseCLocale(retNames[retNames.length - 1])

    if (lastName !== "" && lastName !== verusChainNameLc) {
      retNames.push(verusChainNameLc);
    } else if (lastName === "") {
      retNames.pop();
    }
  }

  for (let i = 0; i < retNames.length; i++) {
    if (retNames[i].length > KOMODO_ASSETCHAIN_MAXLEN - 1) {
      retNames[i] = retNames[i].slice(0, KOMODO_ASSETCHAIN_MAXLEN - 1);
    }

    if (
      retNames[i].length === 0 ||
      retNames[i] !== trimSpaces(retNames[i], removeDuals)
    ) {
      return { names: [], chain: "" };
    }
  }

  return { names: retNames, chain };
}

function cleanName(
  name: string,
  parent: string | null,
  removeDuals: boolean = false,
  verusChainName: string = DEFAULT_VERUS_CHAINNAME
): { name: string; parent: string } {
  const { names: subNames } = parseSubNames(name, false, removeDuals, verusChainName);

  if (subNames.length === 0) {
    throw new Error("No subnames found in name");
  }

  let newParent = parent ? fromBase58Check(parent).hash : null;

  // Remove "verus" suffix if already handled and parent is not null
  const last = subNames[subNames.length - 1];
  if (
    newParent &&
    subNames.length > 1 &&
    toLowerCaseCLocale(last) === toLowerCaseCLocale(verusChainName)
  ) {
    subNames.pop();
  }

  // Build up the parent hash from right to left
  for (let i = subNames.length - 1; i > 0; i--) {
    const parentNameStr = Buffer.from(toLowerCaseCLocale(subNames[i]), 'utf8');

    let idHash: Buffer;

    if (!newParent) {
      idHash = hash(parentNameStr); // Hash from a string
    } else {
      const combined = hash(parentNameStr); // First hash
      idHash = hash(newParent, combined);  // Combine with parent
    }

    newParent = hash160(idHash); // Get new parent as uint160
  }

  return { name: subNames[0], parent: newParent ? toBase58Check(newParent, I_ADDR_VERSION) : null };
}

function getID(name: string, parent: string, verusChainName: string = DEFAULT_VERUS_CHAINNAME, version: number = I_ADDR_VERSION): string {
  const _cleanName = name === "::" ? { name, parent } : cleanName(name, parent, false, verusChainName);

  if (_cleanName.name.length == 0) return NULL_I_ADDR;

  return nameAndParentAddrToAddr(_cleanName.name, _cleanName.parent, version);
}

export function getDataKey(
  keyName: string,
  nameSpaceID?: string,
  verusChainId: string = DEFAULT_VERUS_CHAINID,
  version: number = I_ADDR_VERSION
): { id: string; namespace: string } {
  let keyCopy = keyName;
  const addressParts = keyName.split(":");

  // If the first part of the address is a namespace, it is followed by a double colon
  // Namespace specifiers have no implicit root
  if (addressParts.length > 2 && addressParts[1] === "") {
    nameSpaceID = toIAddress(addressParts[0]);

    keyName = addressParts.join(":");

    for (let i = 2; i < addressParts.length; i++) {
      keyCopy = i === 2 ? addressParts[i] : keyCopy + ":" + addressParts[i];
    }
  }

  if (!nameSpaceID) {
    nameSpaceID = verusChainId;
  }

  const parent = getID("::", nameSpaceID, undefined, version);
  return { id: getID(keyCopy, parent, undefined, version), namespace: nameSpaceID };
}

export const decodeDestination = (destination: string): Buffer => {

  try {
    const data = fromBase58Check(destination);
    return data.hash;
  
  } catch (e) {
    throw new Error("Invalid destination address: " + destination);
  }
}
 
export const decodeEthDestination = (destination: string): Buffer => {
  if (destination.startsWith("0x")) {
    destination = destination.slice(2);
  }

  if (destination.length !== 40) {
    throw new Error("Invalid Ethereum address: " + destination);
  }

  return Buffer.from(destination, "hex");
}
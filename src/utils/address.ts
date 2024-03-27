import { hash, hash160 } from "./hash";

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

export const toIAddress = (fullyqualifiedname: string, rootSystemName: string = ""): string => {
  const splitFqnAt = fullyqualifiedname.split("@").filter(x => x.length > 0);

  if (splitFqnAt.length !== 1) throw new Error("Invalid name")

  const cleanFqn = splitFqnAt[0];

  const splitFqnDot = cleanFqn.split('.');

  if (splitFqnDot[splitFqnDot.length - 1] !== rootSystemName && 
      splitFqnDot[splitFqnDot.length - 1] !== "") {
    splitFqnDot.push(rootSystemName)
  }

  const name = splitFqnDot.shift();

  let Parent: Buffer;

  for (let i = splitFqnDot.length - 1; i >= 0; i--) {
    let idHash: Buffer;
    const parentName = Buffer.from(splitFqnDot[i].toLowerCase(), "utf8");

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
  const nameBuffer = Buffer.from(name.toLowerCase(), "utf8");

  if (Parent == null) {
    idHash = hash(nameBuffer);
  } else {
    idHash = hash(nameBuffer);
    idHash = hash(Parent, idHash);
  }

  return toBase58Check(hash160(idHash), 102);
}
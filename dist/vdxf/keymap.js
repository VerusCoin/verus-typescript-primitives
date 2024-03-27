"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityVdxfidMap = exports.attestationDataKeys = exports.keymap = void 0;
const keylist = require("./keys");
const AttestationData = require("./classes/IdentityData");
exports.keymap = Object.keys(keylist).reduce((obj, item) => { obj[keylist[item].vdxfid] = keylist[item]; return obj; }, {});
exports.attestationDataKeys = Object.keys(AttestationData).reduce((obj, item) => { obj[AttestationData[item].vdxfid] = AttestationData[item]; return obj; }, {});
exports.IdentityVdxfidMap = AttestationData.IdentityVdxfidMap;

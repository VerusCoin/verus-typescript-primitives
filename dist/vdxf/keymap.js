"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityVdxfidMap = exports.attestationDataKeys = exports.keymap = void 0;
const keylist = require("./keys");
const attestationData = require("../utils/IdentityData");
exports.keymap = Object.keys(keylist)
    .reduce((obj, item) => { obj[keylist[item].vdxfid] = keylist[item]; return obj; }, {});
exports.attestationDataKeys = Object.keys(attestationData)
    .reduce((obj, item) => { obj[attestationData[item].vdxfid] = attestationData[item]; return obj; }, {});
exports.IdentityVdxfidMap = attestationData.IdentityVdxfidMap;

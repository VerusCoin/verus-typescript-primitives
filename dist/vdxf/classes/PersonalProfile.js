"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCategory = void 0;
const __1 = require("..");
class DataCategory extends __1.VDXFObject {
    constructor(vdxfid = "", data, category, details) {
        super(vdxfid);
        this.data = data || [];
        this.category = category || "";
        this.details = details || "";
    }
}
exports.DataCategory = DataCategory;

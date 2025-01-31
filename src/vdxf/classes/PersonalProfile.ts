import { VDXFObject } from "..";

export class DataCategory extends VDXFObject {
  data: Array<string>;
  category: string;
  details: string;
  constructor(vdxfid: string = "", data?: Array<string>, category?: string, details?: string) {
    super(vdxfid);
    this.data = data || [];
    this.category = category || "";
    this.details = details || "";
  }
}
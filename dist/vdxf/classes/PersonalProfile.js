"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalProfileDataStore = exports.defaultPersonalProfileDataTemplate = exports.DataCategory = void 0;
const varuint_1 = require("../../utils/varuint");
const bufferutils_1 = require("../../utils/bufferutils");
const address_1 = require("../../utils/address");
const vdxf_1 = require("../../constants/vdxf");
const __1 = require("..");
const Attestation_1 = require("./Attestation");
const identitykeys = require("../identityDataKeys");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class DataCategory {
    constructor(data, category, vdxfid, details) {
        if (data && data[0] instanceof __1.VDXFObject) {
            this.data = data;
        }
        else if (data) {
            this.data = data.map(key => { return Attestation_1.AttestationDataType.getDataItem(key.vdxfid, null); });
        }
        this.category = category;
        this.vdxfid = vdxfid;
        this.details = details;
    }
}
exports.DataCategory = DataCategory;
class PersonalDataCategory extends DataCategory {
    constructor() {
        super([
            identitykeys.IDENTITYDATA_FIRSTNAME,
            identitykeys.IDENTITYDATA_LASTNAME,
            identitykeys.IDENTITYDATA_MIDDLENAME,
            identitykeys.IDENTITYDATA_DATEOFBIRTH,
            identitykeys.IDENTITYDATA_NATIONALITY
        ], "Personal Details", identitykeys.IDENTITYDATA_PERSONAL_DETAILS.vdxfid, "Name, birthday, nationality");
    }
}
class ContactDataCategory extends DataCategory {
    constructor() {
        super([
            identitykeys.IDENTITYDATA_EMAIL,
            identitykeys.IDENTITYDATA_PHONENUMBER
        ], "Contact", identitykeys.IDENTITYDATA_CONTACT.vdxfid, "Email, phone number");
    }
}
class LocationDataCategory extends DataCategory {
    constructor() {
        super([
            identitykeys.IDENTITYDATA_HOMEADDRESS_STREET1,
            identitykeys.IDENTITYDATA_HOMEADDRESS_STREET2,
            identitykeys.IDENTITYDATA_HOMEADDRESS_CITY,
            identitykeys.IDENTITYDATA_HOMEADDRESS_REGION,
            identitykeys.IDENTITYDATA_HOMEADDRESS_POSTCODE,
            identitykeys.IDENTITYDATA_HOMEADDRESS_COUNTRY,
        ], "Locations", identitykeys.IDENTITYDATA_LOCATIONS.vdxfid, "Tax residency, home address");
    }
}
class BankingDataCategory extends DataCategory {
    constructor() {
        super([
            identitykeys.BANK_ACCOUNT,
            identitykeys.BANK_ACCOUNT_CURRENCY,
            identitykeys.BANK_ACCOUNT_COUNTRY,
            identitykeys.BANK_ACCOUNT_STREET1,
            identitykeys.BANK_ACCOUNT_STREET2,
            identitykeys.BANK_ACCOUNT_CITY,
            identitykeys.BANK_ACCOUNT_REGION,
            identitykeys.BANK_ACCOUNT_POSTALCODE,
            identitykeys.BANK_ACCOUNT_TAXNUMBER,
            identitykeys.BANK_ACCOUNT_TAXCOUNTRY,
            identitykeys.BANK_ACCOUNT_FIRSTNAME,
            identitykeys.BANK_ACCOUNT_LASTNAME,
            identitykeys.BANK_ACCOUNT_PHONENUMBER,
            identitykeys.BANK_ACCOUNT_NUMBER,
            identitykeys.BANK_ACCOUNT_TYPE
        ], "Banking Information", identitykeys.IDENTITYDATA_BANKING_INFORMATION.vdxfid, "Bank accounts");
    }
}
class DocumentsCategory extends DataCategory {
    constructor() {
        super([
            identitykeys.IDENTITYDATA_PASSPORT,
            identitykeys.IDENTITYDATA_DRIVINGLICENCE,
            identitykeys.IDENTITYDATA_RESIDENCEPERMIT,
            identitykeys.IDENTITYDATA_RESIDENTCARD,
            identitykeys.IDENTITYDATA_VISA,
            identitykeys.IDENTITYDATA_IDCARD,
            identitykeys.IDENTITYDATA_SELFIECHECK_IMAGE,
        ], "Documents", identitykeys.IDENTITYDATA_DOCUMENTS_AND_IMAGES.vdxfid, "Passport, ID, driving license");
    }
}
exports.defaultPersonalProfileDataTemplate = [
    new PersonalDataCategory(),
    new ContactDataCategory(),
    new LocationDataCategory(),
    new BankingDataCategory(),
    new DocumentsCategory()
];
class PersonalProfileDataStore extends __1.VDXFObject {
    constructor(data) {
        super(identitykeys.PERSONAL_INFO_OBJECT.vdxfid);
        if (data) {
            this.data = {};
            for (const item of data) {
                this.data[item.category] = item;
            }
        }
        else {
            this.data = {};
            for (const item of exports.defaultPersonalProfileDataTemplate) {
                this.data[item.category] = item;
            }
        }
    }
    dataByteLength() {
        let byteLength = 0;
        byteLength += varuint_1.default.encodingLength(Object.keys(this.data).length);
        for (const [key, value] of Object.entries(this.data)) {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH; // category
            byteLength += varuint_1.default.encodingLength(value.data.length);
            for (const attestation of value.data) {
                byteLength += attestation.toBuffer().length;
            }
        }
        return byteLength;
    }
    toDataBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));
        bufferWriter.writeCompactSize(Object.keys(this.data).length);
        for (const [key, value] of Object.entries(this.data)) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(value.vdxfid).hash);
            bufferWriter.writeCompactSize(value.data.length);
            for (const dataType of value.data) {
                bufferWriter.writeSlice(dataType.toBuffer());
            }
        }
        return bufferWriter.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        const dataLength = reader.readCompactSize();
        if (!this.data) {
            this.data = {};
        }
        for (var i = 0; i < dataLength; i++) {
            const vdxfkey = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            const dataLength = reader.readCompactSize();
            const data = [];
            for (var j = 0; j < dataLength; j++) {
                const attestation = Attestation_1.AttestationDataType.getDataItem((0, address_1.toBase58Check)(reader.buffer.slice(reader.offset, reader.offset + vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION), null);
                reader.offset = attestation.fromBuffer(reader.buffer, reader.offset);
                data.push(attestation);
            }
            const categoryType = Object.entries(this.data).find(([key, value]) => value.vdxfid === vdxfkey);
            this.data[categoryType[1].category].data = data;
        }
        return reader.offset;
    }
    toJson() {
        return {
            data: this.data,
        };
    }
}
exports.PersonalProfileDataStore = PersonalProfileDataStore;

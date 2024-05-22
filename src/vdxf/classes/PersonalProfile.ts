import { VDXFObject } from "..";
import * as identitykeys from '../identityDataKeys';


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

export const defaultPersonalProfileDataTemplate = [
  new DataCategory(
    identitykeys.IDENTITYDATA_PERSONAL_DETAILS.vdxfid,
    [
      identitykeys.IDENTITYDATA_FIRSTNAME.vdxfid,
      identitykeys.IDENTITYDATA_LASTNAME.vdxfid,
      identitykeys.IDENTITYDATA_MIDDLENAME.vdxfid,
      identitykeys.IDENTITYDATA_DATEOFBIRTH.vdxfid,
      identitykeys.IDENTITYDATA_NATIONALITY.vdxfid
    ], 
    "Personal Details",
    "Name, birthday, nationality"
  ),
  new DataCategory(identitykeys.IDENTITYDATA_CONTACT.vdxfid,
      [
      identitykeys.IDENTITYDATA_EMAIL.vdxfid,
      identitykeys.IDENTITYDATA_PHONENUMBER.vdxfid
    ], 
    "Contact",
    "Email, phone number"
  ),
    new DataCategory(identitykeys.IDENTITYDATA_LOCATIONS.vdxfid,
      [
      identitykeys.IDENTITYDATA_HOMEADDRESS_STREET1.vdxfid,
      identitykeys.IDENTITYDATA_HOMEADDRESS_STREET2.vdxfid,
      identitykeys.IDENTITYDATA_HOMEADDRESS_CITY.vdxfid,
      identitykeys.IDENTITYDATA_HOMEADDRESS_REGION.vdxfid,
      identitykeys.IDENTITYDATA_HOMEADDRESS_POSTCODE.vdxfid,
      identitykeys.IDENTITYDATA_HOMEADDRESS_COUNTRY.vdxfid,
    ], 
    "Locations",
    "Tax residency, home address"),
    new DataCategory(identitykeys.IDENTITYDATA_BANKING_INFORMATION.vdxfid,
      [
      identitykeys.BANK_ACCOUNT.vdxfid,
      identitykeys.BANK_ACCOUNT_CURRENCY.vdxfid,
      identitykeys.BANK_ACCOUNT_COUNTRY.vdxfid,
      identitykeys.BANK_ACCOUNT_STREET1.vdxfid,
      identitykeys.BANK_ACCOUNT_STREET2.vdxfid,
      identitykeys.BANK_ACCOUNT_CITY.vdxfid,
      identitykeys.BANK_ACCOUNT_REGION.vdxfid,
      identitykeys.BANK_ACCOUNT_POSTALCODE.vdxfid,
      identitykeys.BANK_ACCOUNT_TAXNUMBER.vdxfid,
      identitykeys.BANK_ACCOUNT_TAXCOUNTRY.vdxfid,
      identitykeys.BANK_ACCOUNT_FIRSTNAME.vdxfid,
      identitykeys.BANK_ACCOUNT_LASTNAME.vdxfid,
      identitykeys.BANK_ACCOUNT_PHONENUMBER.vdxfid,
      identitykeys.BANK_ACCOUNT_NUMBER.vdxfid,
      identitykeys.BANK_ACCOUNT_TYPE.vdxfid
    ], 
    "Banking Information",    
    "Bank accounts"),
    new DataCategory(identitykeys.IDENTITYDATA_DOCUMENTS_AND_IMAGES.vdxfid,
      [
      identitykeys.IDENTITYDATA_PASSPORT.vdxfid,
      identitykeys.IDENTITYDATA_DRIVINGLICENCE.vdxfid,
      identitykeys.IDENTITYDATA_RESIDENCEPERMIT.vdxfid,
      identitykeys.IDENTITYDATA_RESIDENTCARD.vdxfid,
      identitykeys.IDENTITYDATA_VISA.vdxfid,
      identitykeys.IDENTITYDATA_IDCARD.vdxfid,
      identitykeys.IDENTITYDATA_SELFIECHECK_IMAGE.vdxfid,
    ], 
    "Documents",    
    "Passport, ID, driving license"),

]
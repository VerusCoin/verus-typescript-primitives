import * as identitykeys from "../../vdxf";
import {AttestationDataType } from "../../vdxf/classes/Attestation";
import { PersonalProfileDataStore, DataCategory } from "../../vdxf/classes/PersonalProfile";

describe('Create a personal info request', () => {
  test('attestation request with reply', async () => {


    const profileData = new PersonalProfileDataStore();
    // requested data from user.
    const personalDataCategory = new DataCategory([
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_FIRSTNAME.vdxfid, "Fred"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_LASTNAME.vdxfid, "Stones"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_HOMEADDRESS_COUNTRY.vdxfid, "USA"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_DATEOFBIRTH.vdxfid, "01/01/1950"),
    ], "personal", identitykeys.IDENTITYDATA_PERSONAL_DETAILS.vdxfid);

    profileData.data.personal = personalDataCategory;

    const contractDataCategory = profileData.data.contact;

    contractDataCategory.data = [
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_EMAIL.vdxfid, "abc@def.com"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_PHONENUMBER.vdxfid, "123-456-7890")
    ];

    const LocationDataCategory = profileData.data.locations;

    LocationDataCategory.data = [
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_HOMEADDRESS_STREET1.vdxfid, "123 Main St"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_HOMEADDRESS_STREET2.vdxfid, "Cobham"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_HOMEADDRESS_CITY.vdxfid, "Anytown"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_HOMEADDRESS_REGION.vdxfid, "AnyState"),
      AttestationDataType.getDataItem(identitykeys.IDENTITYDATA_HOMEADDRESS_POSTCODE.vdxfid, "12345")
    ];

    const personalDataBuffer = profileData.toDataBuffer();

    const personalData2 = new PersonalProfileDataStore();
    personalData2.fromDataBuffer(personalDataBuffer);

    expect(personalData2.toBuffer().toString('hex')).toEqual(profileData.toBuffer().toString('hex'));
  });

});

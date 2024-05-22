"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTITYDATA_DRIVINGLICENCE_ADDRESS = exports.IDENTITYDATA_DRIVINGLICENCE_DATEOFBIRTH = exports.IDENTITYDATA_DRIVINGLICENCE_ISSUING_REGION = exports.IDENTITYDATA_DRIVINGLICENCE_ISSUING_COUNTRY_MATCHED = exports.IDENTITYDATA_DRIVINGLICENCE_EXPIRATIONDATE = exports.IDENTITYDATA_DRIVINGLICENCE_CATEGORY = exports.IDENTITYDATA_DRIVINGLICENCE_IDNUMBER = exports.IDENTITYDATA_DRIVINGLICENCE_FACE = exports.IDENTITYDATA_DRIVINGLICENCE_CROPPED_BACK = exports.IDENTITYDATA_DRIVINGLICENCE_CROPPED_FRONT = exports.IDENTITYDATA_DRIVINGLICENCE_ORIGINAL_BACK = exports.IDENTITYDATA_DRIVINGLICENCE_ORIGINAL_FRONT = exports.IDENTITYDATA_DRIVINGLICENCE = exports.IDENTITYDATA_APPROVALS_RISKCHECKOK = exports.IDENTITYDATA_APPROVALS_WATCHLIST_OK = exports.IDENTITYDATA_APPROVALS_SELFIECHECKED = exports.IDENTITYDATA_APPROVALS_DOCUMENTSVERIFIED = exports.IDENTITYDATA_APPROVALS_KYCCHECKED = exports.IDENTITYDATA_APPROVALS_VERIFIEDSMS = exports.IDENTITYDATA_APPROVALS_ACCEPTEDTOS = exports.IDENTITYDATA_STATUS = exports.IDENTITYDATA_IDNUMBER_TYPE = exports.IDENTITYDATA_IDNUMBER_VALUE = exports.IDENTITYDATA_HOMEADDRESS_COUNTRY = exports.IDENTITYDATA_HOMEADDRESS_POSTCODE = exports.IDENTITYDATA_HOMEADDRESS_REGION = exports.IDENTITYDATA_HOMEADDRESS_CITY = exports.IDENTITYDATA_HOMEADDRESS_STREET2 = exports.IDENTITYDATA_HOMEADDRESS_STREET1 = exports.IDENTITYDATA_HOMEADDRESS = exports.IDENTITYDATA_LASTNAME = exports.IDENTITYDATA_MIDDLENAME = exports.IDENTITYDATA_FIRSTNAME = exports.IDENTITYDATA_EMAIL = exports.IDENTITYDATA_IPADDRESS = exports.IDENTITYDATA_OVER25 = exports.IDENTITYDATA_OVER21 = exports.IDENTITYDATA_OVER18 = exports.IDENTITYDATA_DATEOFBIRTH = exports.IDENTITYDATA_PHONENUMBER = exports.IDENTITYDATA_TEMPLATEVERSION = exports.IDENTITYDATA_TEMPLATEID = exports.IDENTITYDATA_SHAREABLEURL = exports.IDENTITYDATA_PREVIOUSATTEMPTID = exports.IDENTITYDATA_COMPLETEDAT = exports.IDENTITYDATA_CREATEDAT = exports.IDENTITYDATA_USERID = exports.IDENTITYDATA_ID = exports.IDENTITYDATA_IDENTITY = exports.IDENTITYDATA_ATTESTOR = void 0;
exports.IDENTITYDATA_IDCARD_ADDRESS_POSTCODE = exports.IDENTITYDATA_IDCARD_ADDRESS_REGION = exports.IDENTITYDATA_IDCARD_ADDRESS_CITY = exports.IDENTITYDATA_IDCARD_ADDRESS_STREET1 = exports.IDENTITYDATA_IDCARD_ADDRESS = exports.IDENTITYDATA_IDCARD_DATEOFBIRTH = exports.IDENTITYDATA_IDCARD_ISSUING_REGION = exports.IDENTITYDATA_IDCARD_ISSUING_COUNTRY_MATCHED = exports.IDENTITYDATA_IDCARD_EXPIRATIONDATE = exports.IDENTITYDATA_IDCARD_CATEGORY = exports.IDENTITYDATA_IDCARD_IDNUMBER = exports.IDENTITYDATA_IDCARD_FACE = exports.IDENTITYDATA_IDCARD_CROPPED_BACK = exports.IDENTITYDATA_IDCARD_CROPPED_FRONT = exports.IDENTITYDATA_IDCARD_ORIGINAL_BACK = exports.IDENTITYDATA_IDCARD_ORIGINAL_FRONT = exports.IDENTITYDATA_IDCARD = exports.IDENTITYDATA_EMAIL_DOMAIN_TOPLEVEL_SUSPICIOUS = exports.IDENTITYDATA_EMAIL_DOMAIN_DISPOSABLE = exports.IDENTITYDATA_EMAIL_DOMAIN_CUSTOM = exports.IDENTITYDATA_EMAIL_DOMAIN_FREEPROVIDER = exports.IDENTITYDATA_EMAIL_DOMAIN_REGISTEREDAT = exports.IDENTITYDATA_EMAIL_LASTBREACHEDAT = exports.IDENTITYDATA_EMAIL_FIRSTBREACHEDAT = exports.IDENTITYDATA_EMAIL_BREACHCOUNT = exports.IDENTITYDATA_EMAIL_ISDELIVERABLE = exports.IDENTITYDATA_RISKCHECK_BOTNOTDETECTED = exports.IDENTITYDATA_RISKCHECK_FRAUDRINGOK = exports.IDENTITYDATA_RISKCHECK_USERINTERACTIONS = exports.IDENTITYDATA_RISKCHECK_STATUS = exports.IDENTITYDATA_KYC_AREACODE_MATCHED = exports.IDENTITYDATA_KYC_PHONENUMBER_MATCHED = exports.IDENTITYDATA_KYC_IDNUMBER_MATCHED = exports.IDENTITYDATA_KYC_DATEOFBIRTH_MATCHED = exports.IDENTITYDATA_KYC_NAME_MATCHED = exports.IDENTITYDATA_KYC_TYPE = exports.IDENTITYDATA_KYC_ADDRESS_MATCHED = exports.IDENTITYDATA_KYC_SUCCESS = exports.IDENTITYDATA_SELFIECHECK_DRIVINGLICENCE_MATCH = exports.IDENTITYDATA_SELFIECHECK_VIDEO = exports.IDENTITYDATA_SELFIECHECK_IMAGE = exports.IDENTITYDATA_SELFIECHECK_SUCCESS = exports.IDENTITYDATA_DRIVINGLICENCE_DATEOFBIRTH_MATCHED = exports.IDENTITYDATA_DRIVINGLICENCE_NAME_MATCHED = exports.IDENTITYDATA_DRIVINGLICENCE_MATCHED = exports.IDENTITYDATA_DRIVINGLICENCE_COUNTRY = exports.IDENTITYDATA_DRIVINGLICENCE_POSTCODE = exports.IDENTITYDATA_DRIVINGLICENCE_REGION = exports.IDENTITYDATA_DRIVINGLICENCE_CITY = exports.IDENTITYDATA_DRIVINGLICENCE_STREET1 = void 0;
exports.IDENTITYDATA_RESIDENTCARD_CROPPED_FRONT = exports.IDENTITYDATA_RESIDENTCARD_ORIGINAL_BACK = exports.IDENTITYDATA_RESIDENTCARD_ORIGINAL_FRONT = exports.IDENTITYDATA_RESIDENTCARD = exports.IDENTITYDATA_RESIDENCEPERMIT_DATEOFBIRTHMATCHED = exports.IDENTITYDATA_RESIDENCEPERMIT_NAME_MATCHED = exports.IDENTITYDATA_RESIDENCEPERMIT_DOCUMENTVERIFICATION_MATCHED = exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_COUNTRY = exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_POSTCODE = exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_REGION = exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_CITY = exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_STREET1 = exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS = exports.IDENTITYDATA_RESIDENCEPERMIT_DATEOFBIRTH = exports.IDENTITYDATA_RESIDENCEPERMIT_ISSUING_REGION = exports.IDENTITYDATA_RESIDENCEPERMIT_ISSUING_COUNTRY_MATCHED = exports.IDENTITYDATA_RESIDENCEPERMIT_EXPIRATIONDATE = exports.IDENTITYDATA_RESIDENCEPERMIT_CATEGORY = exports.IDENTITYDATA_RESIDENCEPERMIT_IDNUMBER = exports.IDENTITYDATA_RESIDENCEPERMIT_FACE = exports.IDENTITYDATA_RESIDENCEPERMIT_CROPPED_BACK = exports.IDENTITYDATA_RESIDENCEPERMIT_CROPPED_FRONT = exports.IDENTITYDATA_RESIDENCEPERMIT_ORIGINAL_BACK = exports.IDENTITYDATA_RESIDENCEPERMIT_ORIGINAL_FRONT = exports.IDENTITYDATA_RESIDENCEPERMIT = exports.IDENTITYDATA_PASSPORT_DATEOFBIRTHMATCHED = exports.IDENTITYDATA_PASSPORT_NAME_MATCHED = exports.IDENTITYDATA_PASSPORT_DOCUMENTVERIFICATION_MATCHED = exports.IDENTITYDATA_PASSPORT_ADDRESS_COUNTRY = exports.IDENTITYDATA_PASSPORT_ADDRESS_POSTCODE = exports.IDENTITYDATA_PASSPORT_ADDRESS_REGION = exports.IDENTITYDATA_PASSPORT_ADDRESS_CITY = exports.IDENTITYDATA_PASSPORT_ADDRESS_STREET1 = exports.IDENTITYDATA_PASSPORT_ADDRESS = exports.IDENTITYDATA_PASSPORT_DATEOFBIRTH = exports.IDENTITYDATA_PASSPORT_ISSUING_REGION = exports.IDENTITYDATA_PASSPORT_ISSUING_COUNTRY_MATCHED = exports.IDENTITYDATA_PASSPORT_EXPIRATIONDATE = exports.IDENTITYDATA_PASSPORT_CATEGORY = exports.IDENTITYDATA_PASSPORT_IDNUMBER = exports.IDENTITYDATA_PASSPORT_FACE = exports.IDENTITYDATA_PASSPORT_CROPPED_BACK = exports.IDENTITYDATA_PASSPORT_CROPPED_FRONT = exports.IDENTITYDATA_PASSPORT_ORIGINAL_BACK = exports.IDENTITYDATA_PASSPORT_ORIGINAL_FRONT = exports.IDENTITYDATA_PASSPORT = exports.IDENTITYDATA_IDCARD_DATEOFBIRTHMATCHED = exports.IDENTITYDATA_IDCARD_NAME_MATCHED = exports.IDENTITYDATA_IDCARD_DOCUMENTVERIFICATION_MATCHED = exports.IDENTITYDATA_IDCARD_ADDRESS_COUNTRY = void 0;
exports.IDENTITYDATA_DOCUMENTVERIFICATION_ADDRESS = exports.IDENTITYDATA_DOCUMENTVERIFICATION_DATEOFBIRTH = exports.IDENTITYDATA_DOCUMENTVERIFICATION_ISSUING_REGION = exports.IDENTITYDATA_DOCUMENTVERIFICATION_ISSUINGCOUNTRY = exports.IDENTITYDATA_DOCUMENTVERIFICATION_EXPIRATIONDATE = exports.IDENTITYDATA_DOCUMENTVERIFICATION_CATEGORY = exports.IDENTITYDATA_DOCUMENTVERIFICATION_IDNUMBER = exports.IDENTITYDATA_DOCUMENTVERIFICATION_FACE = exports.IDENTITYDATA_DOCUMENTVERIFICATION_CROPPEDBACK = exports.IDENTITYDATA_DOCUMENTVERIFICATION_CROPPEDFRONT = exports.IDENTITYDATA_DOCUMENTVERIFICATION_ORIGINALBACK = exports.IDENTITYDATA_DOCUMENTVERIFICATION_ORIGINALFRONT = exports.IDENTITYDATA_VISA_DATEOFBIRTHMATCHED = exports.IDENTITYDATA_VISA_NAME_MATCHED = exports.IDENTITYDATA_VISA_DOCUMENTVERIFICATION_MATCHED = exports.IDENTITYDATA_VISA_ADDRESS_COUNTRY = exports.IDENTITYDATA_VISA_ADDRESS_POSTCODE = exports.IDENTITYDATA_VISA_ADDRESS_REGION = exports.IDENTITYDATA_VISA_ADDRESS_CITY = exports.IDENTITYDATA_VISA_ADDRESS_STREET1 = exports.IDENTITYDATA_VISA_ADDRESS = exports.IDENTITYDATA_VISA_DATEOFBIRTH = exports.IDENTITYDATA_VISA_ISSUING_REGION = exports.IDENTITYDATA_VISA_ISSUING_COUNTRY_MATCHED = exports.IDENTITYDATA_VISA_EXPIRATIONDATE = exports.IDENTITYDATA_VISA_CATEGORY = exports.IDENTITYDATA_VISA_IDNUMBER = exports.IDENTITYDATA_VISA_FACE = exports.IDENTITYDATA_VISA_CROPPED_BACK = exports.IDENTITYDATA_VISA_CROPPED_FRONT = exports.IDENTITYDATA_VISA_ORIGINAL_BACK = exports.IDENTITYDATA_VISA_ORIGINAL_FRONT = exports.IDENTITYDATA_VISA = exports.IDENTITYDATA_RESIDENTCARD_DATEOFBIRTHMATCHED = exports.IDENTITYDATA_RESIDENTCARD_NAME_MATCHED = exports.IDENTITYDATA_RESIDENTCARD_DOCUMENTVERIFICATION_MATCHED = exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_COUNTRY = exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_POSTCODE = exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_REGION = exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_CITY = exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_STREET1 = exports.IDENTITYDATA_RESIDENTCARD_ADDRESS = exports.IDENTITYDATA_RESIDENTCARD_DATEOFBIRTH = exports.IDENTITYDATA_RESIDENTCARD_ISSUING_REGION = exports.IDENTITYDATA_RESIDENTCARD_ISSUING_COUNTRY_MATCHED = exports.IDENTITYDATA_RESIDENTCARD_EXPIRATIONDATE = exports.IDENTITYDATA_RESIDENTCARD_CATEGORY = exports.IDENTITYDATA_RESIDENTCARD_IDNUMBER = exports.IDENTITYDATA_RESIDENTCARD_FACE = exports.IDENTITYDATA_RESIDENTCARD_CROPPED_BACK = void 0;
exports.BANK_ACCOUNT_TYPE = exports.BANK_ACCOUNT_NUMBER = exports.ACCOUNT_TYPE = exports.ACCOUNT_NUMBER = exports.BANK_ACCOUNT_PHONENUMBER = exports.BANK_ACCOUNT_LASTNAME = exports.BANK_ACCOUNT_FIRSTNAME = exports.BANK_ACCOUNT_TAXCOUNTRY = exports.BANK_ACCOUNT_TAXNUMBER = exports.BANK_ACCOUNT_POSTALCODE = exports.BANK_ACCOUNT_REGION = exports.BANK_ACCOUNT_CITY = exports.BANK_ACCOUNT_STREET2 = exports.BANK_ACCOUNT_STREET1 = exports.BANK_ACCOUNT_COUNTRY = exports.BANK_ACCOUNT_CURRENCY = exports.BANK_ACCOUNT = exports.FIAT_CURRENCEY = exports.PERSONAL_INFO_OBJECT = exports.IDENTITYDATA_DOCUMENTS_AND_IMAGES = exports.IDENTITYDATA_BANKING_INFORMATION = exports.IDENTITYDATA_LOCATIONS = exports.IDENTITYDATA_CONTACT = exports.IDENTITYDATA_PERSONAL_DETAILS = exports.IDENTITYDATA_NAME = exports.IDENTITYDATA_DOCUMENTVERIFICATION_DATEOFBIRTHMATCHED = exports.IDENTITYDATA_DOCUMENTVERIFICATION_NAME_MATCHED = exports.IDENTITYDATA_DOCUMENTVERIFICATION_MATCHED = exports.IDENTITYDATA_NATIONALITY = exports.IDENTITYDATA_ADDRESS_COUNTRY = exports.IDENTITYDATA_ADDRESS_POSTCODE = exports.IDENTITYDATA_ADDRESS_REGION = exports.IDENTITYDATA_ADDRESS_CITY = exports.IDENTITYDATA_ADDRESS_STREET2 = exports.IDENTITYDATA_ADDRESS_STREET1 = void 0;
exports.IDENTITYDATA_ATTESTOR = {
    "vdxfid": "iNe8VaRBRFDhb6xjZ7WHNWgfM73428GN8B",
    "hash160result": "5e01d5d356d517df57ea0f391c86e11a84663bd2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.attestor"
    }
};
exports.IDENTITYDATA_IDENTITY = {
    "vdxfid": "iFa41TpKfvbjaEnP78BNpSA9KYNgED58ms",
    "hash160result": "63730181dc037834a7b2b9e7fed49863ca1cad84",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.identity"
    }
};
exports.IDENTITYDATA_ID = {
    "vdxfid": "i3uDEe15gH8AN88WjGGwF7gv6jVwJa1Wt5",
    "indexid": "x8jKhSSAXbLpzJ1Yaww6DWDT8PWxAzngtM",
    "hash160result": "17bc967bf757bc093ba3fc1dd9298abb7235ab04",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.id"
    }
};
exports.IDENTITYDATA_USERID = {
    "vdxfid": "iMxzsbP4iptfkxQD4CaYwYNqSRSqw1eqJp",
    "indexid": "xSo7LPp9a97LP8HEutEhuvuNU5Trrjc77z",
    "hash160result": "b6e3f22d3a87fbdffe53d16e1eab779b16d1d4ca",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.userid"
    }
};
exports.IDENTITYDATA_CREATEDAT = {
    "vdxfid": "iNxvB8LET1HNQ2aWqS8RoVj8fcPr1UdcSA",
    "indexid": "xTo2dvmKJKW32CTYh7namtFfhGQrrbP3Rv",
    "hash160result": "dabed2d7a3d4cacbc482ce046dd1be8b6605c9d5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.createdat"
    }
};
exports.IDENTITYDATA_COMPLETEDAT = {
    "vdxfid": "iFtW78dkwZtb4Q9EhBEm4xYMYFxYEvP39D",
    "indexid": "xLicZw4qnt7Fga2GYrtv3M4tZuyZ5zz9CJ",
    "hash160result": "12903d8d58b28acf0dfefd6598b2ed6394622a88",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.completedat"
    }
};
exports.IDENTITYDATA_PREVIOUSATTEMPTID = {
    "vdxfid": "iNVKxjLQJmxyFsPZGufmkb9rh8FoBrcS37",
    "indexid": "xTKSRXmVA6Bdt3Gb8bKviygPinGp7XuZqr",
    "hash160result": "f2154430bfab9e858dbd05f48e379f77dd3a91d0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.previousattemptid"
    }
};
exports.IDENTITYDATA_SHAREABLEURL = {
    "vdxfid": "i9nYbM8arP15YrJYqSLbxgi7iJgYbzPwXR",
    "indexid": "xEcf49ZfhhDkB2Bah7zkw5EejxhZYZ83om",
    "hash160result": "8a81df9444dcd55bf80dfff5e07b4a1fd0353945",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.shareableurl"
    }
};
exports.IDENTITYDATA_TEMPLATEID = {
    "vdxfid": "i5j8xXGKYLBAENLD5CBosWtmB2LnWrxobF",
    "indexid": "xAZFRKhQPePprYDEvsqxquRJCgMoTQzGzL",
    "hash160result": "aefdfe818fd9323496ad29101b9b40e3d0bab318",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.templateid"
    }
};
exports.IDENTITYDATA_TEMPLATEVERSION = {
    "vdxfid": "iQTADnLBxVAxxxAidEUgK8DVeuaaY7w78n",
    "indexid": "xVHGgamGooPdb83kUv8qHWk2gZbbW3CZYi",
    "hash160result": "1b1a410a4258fe91ee0e40904538d649c58418e6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.templateversion"
    }
};
exports.IDENTITYDATA_PHONENUMBER = {
    "vdxfid": "i9ZQ5degEh3wQg5vNm8Tod88bcJBrLs5p3",
    "indexid": "xEPWYS5m61Gc2qxxESncn1efdGKChdypms",
    "hash160result": "c58e0231ddcd85747709016800cc6e796cb2bc42",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.phonenumber"
    }
};
exports.IDENTITYDATA_DATEOFBIRTH = {
    "vdxfid": "iPzSt64gwsqmxcz3Ht7zhMngLC6no6S74K",
    "indexid": "xUpZLtVmoC4Sans59Zn9fkKDMr7oe7NpkD",
    "hash160result": "057c9866c848002e1fac1c419a300369f2310be1",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.dateofbirth"
    }
};
exports.IDENTITYDATA_OVER18 = {
    "vdxfid": "iF8QUrVj4LCSKdF5KFG6axidrUg8RiV65A",
    "indexid": "xKxWwevoueR6wo87AvvFZMFAt8h9EHjvu5",
    "hash160result": "70a65a9b459169a05b34f101ff0631cf0763d37f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.over18"
    }
};
exports.IDENTITYDATA_OVER21 = {
    "vdxfid": "i6E3RQUUX3jt8CkizuLX6ihZHTegCmmbj4",
    "indexid": "xB49tCuZNMxYkNdkrazg57E6K7fh65oniA",
    "hash160result": "6238fac23c82ebadd8f79306558cb8ddc62b2b1e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.over21"
    }
};
exports.IDENTITYDATA_OVER25 = {
    "vdxfid": "iHqnuVSGJAjF4SXqurNB2h3sY7q5raxhDr",
    "indexid": "xNfuNHsM9UwugcQsmY2L15aQZmr6n3MA8x",
    "hash160result": "88c15026283fb46b5a6b3de4f4b5a33a7f69979d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.over25"
    }
};
exports.IDENTITYDATA_IPADDRESS = {
    "vdxfid": "i6HsaWESEEpa1RGPeuksdCQWZ8Svvq7w4e",
    "indexid": "xB7z3JfX5Z3Edb9RWbR2baw3anTwtiKSmr",
    "hash160result": "4fceb989885b50eb19d713f76fe53b62449ee41e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.ipaddress"
    }
};
exports.IDENTITYDATA_EMAIL = {
    "vdxfid": "i8nmFBXnQNFK6HmNM1XHr6xLECPEry44Xr",
    "indexid": "xDcshyxsFgTyiTeQChBSpVUsFrQFg1ph6J",
    "hash160result": "31b2f16b20e9fdc1e11f37d07ba97f5463a54b3a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email"
    }
};
exports.IDENTITYDATA_FIRSTNAME = {
    "vdxfid": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM",
    "indexid": "x96xLcKN7tHHcNWvXiHHDsorgxH1REYzrR",
    "hash160result": "31e7d78d45dd436cd977ac0f9ed03094bd87c208",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.firstname"
    }
};
exports.IDENTITYDATA_MIDDLENAME = {
    "vdxfid": "iB8d3HBPEr3tsxsNoCGxDwfr9teVwugeyK",
    "indexid": "xFxjW5cU6AGZW8kQesw7CLCPBYfWtK6d9G",
    "hash160result": "2044d9008acd28b1795ff04788289d24135efd53",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.middlename"
    }
};
exports.IDENTITYDATA_LASTNAME = {
    "vdxfid": "iHybTrNB1kXRrjsCtJXd6fvBKxepqMpS5Z",
    "indexid": "xNohveoFs4k6UukEjzBn54SiMcfqhV66Vg",
    "hash160result": "3c3fb99f2b33f5c20c890f36fa8cc1ff3d30119f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.lastname"
    }
};
exports.IDENTITYDATA_HOMEADDRESS = {
    "vdxfid": "i6AtrvvqMkzVPQqtEmzn1EbjkzF3CbaM9L",
    "indexid": "xB11KjMvD5DA1aiv6Tevyd8GneG45Q5BLp",
    "hash160result": "f83d7549817e9eda543bf587689c06e814c7921d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    }
};
exports.IDENTITYDATA_HOMEADDRESS_STREET1 = {
    "vdxfid": "iL29rGaWXcww4fwe8Us1kg7Y16XUDgaWFC",
    "indexid": "xQrGK51bNwAbgqpfzAXAj4e52kYV4o2k7S",
    "hash160result": "b898ec5f2c3633b099b4f8332b987d938c4e7db5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_HOMEADDRESS_STREET2 = {
    "vdxfid": "iPfVvVxRkpE8WXKAeCYGTxsdpLa1Eh1KzD",
    "indexid": "xUVcPJPWc8So8hCCVtCRSMQAqzb25YSnPA",
    "hash160result": "8c2235594883052b88799461f306c084b0d475dd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    },
    "bounddata": {
        "vdxfkey": "i3h8D5kGtn6DCVCwPFvbypbFCqfzAhXiD2"
    }
};
exports.IDENTITYDATA_HOMEADDRESS_CITY = {
    "vdxfid": "iFRUFNWPsrDNNLfCWhAqFoUamhwryjx27c",
    "indexid": "xLFaiAwUjAS2zWYENNpzEC17oMxspXLHnY",
    "hash160result": "ea4cad23a3b421b827747769be86b29d699a0d83",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_HOMEADDRESS_REGION = {
    "vdxfid": "iRmhi8Z6STjtt4nE1MWJCgYGrKBGT1dWaB",
    "indexid": "xWbpAvzBHmxZWEfFs3ATB54osyCHLkZ74h",
    "hash160result": "b94c5f0aba29341980e1711c4e6f4ac6cf6a92f4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_HOMEADDRESS_POSTCODE = {
    "vdxfid": "i8XMZQ3NGhEvtRA9e68tShsRgABHdrJYkV",
    "indexid": "xDMU2CUT81TbWb3BVmo3R6PxhpCJZUQwNj",
    "hash160result": "a94d72335f27128bf57a31ac38c6e0e374a26137",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_HOMEADDRESS_COUNTRY = {
    "vdxfid": "iAaJZj9yTRxT1WrYu42YWCeTAuCkeWJnip",
    "indexid": "xFQR2Xb4JkB7dgjakjghUbAzCZDmbcGPTX",
    "hash160result": "15f33d581893957024d128d7fa060ec86fa2e04d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.homeaddress"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_IDNUMBER_VALUE = {
    "vdxfid": "i79FRsacpZYQ9yVFYUK5x6eeUeS1EGNprE",
    "indexid": "xByMtg1hfsm4n9NHQ9yEvVBBWJT24wRXnq",
    "hash160result": "e9b3c40de3185cb462bf8c76f75ba10da53d3b28",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idnumber.value"
    }
};
exports.IDENTITYDATA_IDNUMBER_TYPE = {
    "vdxfid": "iHmUB12ZvCagSnp8RYifzEiVzu6q4EXSx6",
    "indexid": "xNbadoTemWoM4xhAHENpxdF32Z7r2EHU4B",
    "hash160result": "db12844ffbf6244f5506938229916f986f1cc69c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idnumber.type"
    }
};
exports.IDENTITYDATA_STATUS = {
    "vdxfid": "iGDz9GLxDULfhzPJs2hU7MuHoyEzHUr1oA",
    "indexid": "xM46c4n34nZLLAGLiiMd5kRpqdG17kNgXH",
    "hash160result": "424d072b54b489c27a36a8a10ce7d0b738b1d98b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.status"
    }
};
exports.IDENTITYDATA_APPROVALS_ACCEPTEDTOS = {
    "vdxfid": "iAaWyLM18QHXa4WFSoYXNrbWP4DG3fGUqu",
    "indexid": "xFQdS8n5yiWCCEPHJVCgMF83QiEGuAX7Lu",
    "hash160result": "7c0f3d2f6ec35b7702f6e3b394a06877cafdea4d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.acceptedtos"
    }
};
exports.IDENTITYDATA_APPROVALS_VERIFIEDSMS = {
    "vdxfid": "iCjR6fQST9YLLn72B96aHgSjF54v6UXqSf",
    "indexid": "xHZXZTqXJTkzxwz42pkjG4yGGj5vvcnSQq",
    "hash160result": "26bf160fb405c0fad15a9b5c2f602dbd61158a65",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.verifiedsms"
    }
};
exports.IDENTITYDATA_APPROVALS_KYCCHECKED = {
    "vdxfid": "iH9AxMi9qB1RFkZ3HQW11c2xcntwQ21j3M",
    "indexid": "xMyHRA9EgVE5svS596A9yzZVeSuxBAkxdv",
    "hash160result": "22d9177c4b16c2316d85f84a1594903f7bc3e895",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.kycchecked"
    }
};
exports.IDENTITYDATA_APPROVALS_DOCUMENTSVERIFIED = {
    "vdxfid": "iAC86tdUvqwcSwUowKZGG4WPxTzNSwuHCo",
    "indexid": "xF2EZh4ZnAAH57Mqo1DRET2vz81PNz5i7r",
    "hash160result": "c183cce3b8a5360b52a6237a15c43f96e1bfae49",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.documentsverified"
    }
};
exports.IDENTITYDATA_APPROVALS_SELFIECHECKED = {
    "vdxfid": "iFYWGcgSm4jGnDTfNnuk9TzcQmkWAdxpwe",
    "indexid": "xLNcjR7XcNwwQPLhEUZu7rX9SRmX1dHrha",
    "hash160result": "28e13d3434ffeb8045e813da5df34b06cc336284",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.selfiechecked"
    }
};
exports.IDENTITYDATA_APPROVALS_WATCHLIST_OK = {
    "vdxfid": "iFtRaMKJGyaqgpiH4ZXeGZMMR47C1u34Jt",
    "indexid": "xLiY39kP8HoWJzbJvFBoEwstSi8CsZK8Jz",
    "hash160result": "d29c35a645ac1c92fa0506482c37370c609a2688",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.watchlist.ok"
    }
};
exports.IDENTITYDATA_APPROVALS_RISKCHECKOK = {
    "vdxfid": "i4pkwqbNCZj3ZrukRooKDAidLJ2SJt57Tf",
    "indexid": "x9esQe2T3swiC2nnHVTUBZFAMx3TBR2Ew1",
    "hash160result": "4650258cd77d7928a47ee880075592d8a7b9cb0e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.approvals.riskcheckok"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE = {
    "vdxfid": "iQe74mwXJTFv1Bg8MRg7zqBMFUsD6jhTxz",
    "indexid": "xVUDXaNc9mUadMZAD7LGyDhtH8tDzeHFrT",
    "hash160result": "72eaff870cdd9c650afcfed1e379330fd7752ae8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_ORIGINAL_FRONT = {
    "vdxfid": "iSBvWubN2yGHsdj6dGL3vMDjZMU6XSWxyG",
    "indexid": "xX22yi2StHUxVoc8UwzCtjkGb1V7R95hsy",
    "hash160result": "2720c73719ffc070c103fa30689283fc331727f9",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_ORIGINAL_BACK = {
    "vdxfid": "iH81F6cj2Kjf2JzRxXAnc9oMQdGQqdQMzD",
    "indexid": "xMx7hu3osdxKeUsTpCpwaYKtSHHRowL8Sr",
    "hash160result": "e146bb291bd348f94e84910e13c00310b13db095",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_CROPPED_FRONT = {
    "vdxfid": "i87ecHwJRUhAA2WaW9FtVotnEWx3BAt7Y8",
    "indexid": "xCwm56NPGnupnCPcMpv3UCRKGAy43NWsQw",
    "hash160result": "78d9f3f3ccdbf650adb03eb0482273cf51e2e532",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_CROPPED_BACK = {
    "vdxfid": "iAPcY54xD3v1WC7zQatbbQnqJe4A6KUaex",
    "indexid": "xFDizsW34N8g8N12GGYkZoKNLJ5AzeGTf7",
    "hash160result": "b45cb25e26d152c9221f9719d696c18d8c0fdb4b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_FACE = {
    "vdxfid": "i9fwBhdsQduiAWhG99wxXwnCRmRXJrbcG4",
    "indexid": "xEW3eW4xFx8NngaHzqc7WLJjTRSYDHiUc7",
    "hash160result": "834ec04a48c045a0814985a32f02d3125728f943",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_IDNUMBER = {
    "vdxfid": "i5JGvSuGVEb9xgNb9ezTTJ8zucrp75Ac98",
    "indexid": "xA8PPFLMLYoparFd1LecRgfXwGsq32EUV4",
    "hash160result": "26fae70b9b3ea6cb14ca10c9620dc04899faff13",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_CATEGORY = {
    "vdxfid": "i5xXPRL3h45Zf2jErvDwD18DeDzGFRaACg",
    "indexid": "xAndrDm8YNJEHCcGibt6BPekft1H9NjSHE",
    "hash160result": "5d77333ae97ba2324126925bc54e06513adc3b1b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_EXPIRATIONDATE = {
    "vdxfid": "iPUSmAtyyTsYNiDppDK8c4rkUjXyiDTm5D",
    "indexid": "xUJZDyL4pn6Czt6rftyHaTPHWPYzXZS1No",
    "hash160result": "6e6e96148a0314aaeecdfaed9a474150e09d5edb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_ISSUING_COUNTRY_MATCHED = {
    "vdxfid": "iGvEHvVEiQJzUQXacJsPAt5oE5ufWpA5rB",
    "indexid": "xMkLkivKZiXf6aQcTzXY9GcLFjvgMyaUmx",
    "hash160result": "e4fb439a302b423d65dbccee97fdbd6757247693",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_ISSUING_REGION = {
    "vdxfid": "iJL72hPk4rFyEmBfdsHJGBUyKMJRrqcR9t",
    "indexid": "xPADVVppvAUdrw4hVYwTEa1WM1KSjZsjUc",
    "hash160result": "76a99a38988e107e418f24f32d1080f93930f2a2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_DATEOFBIRTH = {
    "vdxfid": "iC88nTf9EzCKt2CnkudSRcu7yxNiA16c9G",
    "indexid": "xGxFFG6E6JQzWC5pcbHbQ1Rf1cPj1kEyFH",
    "hash160result": "f55e5a3f98219f06eb0b4b31a935ff1721e8dd5e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_ADDRESS = {
    "vdxfid": "iK8RX6S9uzcnUoVPeLigNt4Cu156zEpodu",
    "indexid": "xPxXytsEmJqT6yNRW2NqMGajvf67xnbJFY",
    "hash160result": "7fcee36de098accefe0f473da0b06914c9c1b4ab",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_STREET1 = {
    "vdxfid": "iGNX6JaTu92GhPNBpbQkZ9Koro2W35GLjm",
    "indexid": "xMCdZ71YkTEwKZFDgH4uXXrLtT3WwU1hvB",
    "hash160result": "3e225a69f52b9bab5fee67ed7ed5d6c7d6da768d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_CITY = {
    "vdxfid": "i7eLwQmDNfc64xc4Qm7AnSsaa1BwCdhTSK",
    "indexid": "xCUTQDCJDypkh8V6GSmKkqQ7bfCx41No4i",
    "hash160result": "d69209a7ac10320134b836872b7cd7ad10e7bb2d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_REGION = {
    "vdxfid": "iKtdJHgdvUJ4vxSxr86cNcaj8Zq4KCZJJh",
    "indexid": "xQijm67imnWjZ8KzhokmM17GADr5GSTj4A",
    "hash160result": "f88b44fa9b07a70cd77a9831e89e80505fe410b4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_POSTCODE = {
    "vdxfid": "i3oy6rsBBWtJ11ZNHvyFPHERK9BGQtQod1",
    "indexid": "x8e5ZfJG2q6xdBSQ9cdQMfkxLoCHEubx1i",
    "hash160result": "9d7bfbe011ca5889ed8e47a1b2a0320c9654ad03",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_COUNTRY = {
    "vdxfid": "iMZemCqP6BFZzxTA9AG34ghv4HaiFiS6E6",
    "indexid": "xSPmE1GTwVUEd8LBzqvC35ET5wbj7m7HY8",
    "hash160result": "546fdf34874119f799b1f8b0014a6cd467766ac6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_MATCHED = {
    "vdxfid": "i5bAVLDcVEzbs6Awo2REXhHTjx34u9bEGC",
    "indexid": "xARGx8ehLZDGVG3yei5PW5ozmc45h9ZyZa",
    "hash160result": "d85c4cc4be13249bec299fde232bbcf323ae3117",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_NAME_MATCHED = {
    "vdxfid": "i97PqFTkPLKX4R22g27qk7TFdYbLk55fVf",
    "indexid": "xDwWJ3tqEeYBgau4XhmziVynfCcMdnsQJP",
    "hash160result": "f64f980f5bcde38d71bf6dfdde151c4ecaacd13d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv"
    }
};
exports.IDENTITYDATA_DRIVINGLICENCE_DATEOFBIRTH_MATCHED = {
    "vdxfid": "iCkJW6AjbtNLTjf4boPPHXpiujRZa9KSeP",
    "indexid": "xHaQxtbpTCb15uY6TV3YFvMFwPSaWD2Xv2",
    "hash160result": "3261fc33de15f3cedc3a4a4f8c3638144cfeb465",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.drivinglicence"
    },
    "bounddata": {
        "vdxfkey": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb"
    }
};
exports.IDENTITYDATA_SELFIECHECK_SUCCESS = {
    "vdxfid": "i6cbKQVGd1upW3uCQAhvUf7PzFgcoFyH3S",
    "indexid": "xBShnCvMUL8V8DnEFrN5T3dw1uhdgNupLp",
    "hash160result": "c0b5f21d131d3a18be6c3a1b5442197cb4f26e22",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.selfiecheck.success"
    }
};
exports.IDENTITYDATA_SELFIECHECK_IMAGE = {
    "vdxfid": "i9oYuguYwqLhXN1y4afj6vYjaWmzuWtuZU",
    "indexid": "xEdfNVLdo9ZN9XtzvGKt5K5GcAo1jKrFH7",
    "hash160result": "dacb095d88ab704ac181d701a7fcdf20e0e36945",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.selfiecheck.image"
    }
};
exports.IDENTITYDATA_SELFIECHECK_VIDEO = {
    "vdxfid": "iGQGK7d1Wdfq9ERxmNXD5fjH7v5SUHxZ9K",
    "indexid": "xMENmv46MwtVmQJzd4BN44Fp9a6TKf2CyG",
    "hash160result": "5a4b0ee7c8e2f91d641d3e18b35343ee8a59cb8d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.selfiecheck.video"
    }
};
exports.IDENTITYDATA_SELFIECHECK_DRIVINGLICENCE_MATCH = {
    "vdxfid": "iLGaXTpb8baibivmJL2yVvX259ir3tewjx",
    "indexid": "xR6gzGFfyuoPDtooA1h8UK3Z6ojrxc8Jyf",
    "hash160result": "19b7f38204fa54f56f62b7b67275ff4c84ba37b8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.selfiecheck.drivinglicence.match"
    }
};
exports.IDENTITYDATA_KYC_SUCCESS = {
    "vdxfid": "iJbbE37yKagBMCvoYPMnkKd3P6eTTGv1Qd",
    "indexid": "xPRhgqZ4AttqyNoqQ51wii9aQkfUKWhnpJ",
    "hash160result": "1a1bebe6bade7b23cb555a5d1c65f5d2d8f6dfa5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.success"
    }
};
exports.IDENTITYDATA_KYC_ADDRESS_MATCHED = {
    "vdxfid": "iP8T2Li3giM7MCJRMw65tajQ2ydx4kW7m6",
    "indexid": "xTxZV998Y2ZmyNBTDckEryFw4dexvb7HLT",
    "hash160result": "0f7b56de7b92854cffb85f278ca8f7b70a8496d7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.address.matched"
    }
};
exports.IDENTITYDATA_KYC_TYPE = {
    "vdxfid": "iN4C7XtyceBJrNcqAs3dZ3T2DA4vycpUYM",
    "indexid": "xStJaLL4TxPyUYVs2YhnXRyZEp5wrpthtP",
    "hash160result": "79da13c496750b37d4804e85094e5d0b8f47d0cb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.type"
    }
};
exports.IDENTITYDATA_KYC_NAME_MATCHED = {
    "vdxfid": "i69dDR9m6JB8bYvT1PbfsVEKiWPZYNgD1E",
    "indexid": "xAyjgDaqwcPoDioUs5FpqskrkAQaRi64Pv",
    "hash160result": "bf852464c1379ab65e5bb2646bbbb19ee84c551d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.name.matched"
    }
};
exports.IDENTITYDATA_KYC_DATEOFBIRTH_MATCHED = {
    "vdxfid": "iHfdYydzo83X6Y6y66N4n8UvcFTLQSmj9Y",
    "indexid": "xNVk1n55eSGBihyzwn2DkX1TduUMHqN49h",
    "hash160result": "f26bc9aa3851d21c679d521f60722045c571ab9b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.dateofbirth.matched"
    }
};
exports.IDENTITYDATA_KYC_IDNUMBER_MATCHED = {
    "vdxfid": "iJQ5KQrVCkHAKRfmBRa6TuMxW8ZfHKuiMS",
    "indexid": "xPEBnDHa44VpwbYo37EFSHtVXnag7ePNwv",
    "hash160result": "94abb5b38f44545c981134f44db4d6395c6cb2a3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.idnumber.matched"
    }
};
exports.IDENTITYDATA_KYC_PHONENUMBER_MATCHED = {
    "vdxfid": "iBFp1jupLByoSLJaZWz2gg3v2GipUFoADv",
    "indexid": "xG5vUYLuBWCU4WBcRCeBf4aT3vjqNDUWJY",
    "hash160result": "7c59b8b820c001d0b361ca67a99c45677c705955",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.phonenumber.matched"
    }
};
exports.IDENTITYDATA_KYC_AREACODE_MATCHED = {
    "vdxfid": "i7GX7K3sGs227Vf4NEJe3QKxruuUyqFFzp",
    "indexid": "xC6da7Ux8BEgjfY6Duxo1nrVtZvVsySF4F",
    "hash160result": "4ae70956a849099e8fd2bf0a9b5daa8fd43d9b29",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.kyc.areacode.matched"
    }
};
exports.IDENTITYDATA_RISKCHECK_STATUS = {
    "vdxfid": "i3b3wvsNm5JaMUoV21Y7maVx85BJ2B8xTF",
    "indexid": "x8RAQjJTcPXEyegWshCGjy2V9jCJtGhaAq",
    "hash160result": "1de1fb500f5c4594a322e249949bc289d9f73b01",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.riskcheck.status"
    }
};
exports.IDENTITYDATA_RISKCHECK_USERINTERACTIONS = {
    "vdxfid": "iEGi5rmUzAmnfutUCPp2dS34rSEk1DrevE",
    "indexid": "xK6pYfCZqUzTJ5mW45UBbpZbt6FkuN8K7e",
    "hash160result": "b0fef6f09eb8a36672e8b15313574b298f486d76",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.riskcheck.userinteractions"
    }
};
exports.IDENTITYDATA_RISKCHECK_FRAUDRINGOK = {
    "vdxfid": "i8MQDH1wrdWCf5rTRznhC5ijRy188i1kYU",
    "indexid": "xDBWg5T2hwisHFjVHgSrAUFGTd291gaveW",
    "hash160result": "7754803c155ad687f4376285828dcda68db07f35",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.riskcheck.fraudringok"
    }
};
exports.IDENTITYDATA_RISKCHECK_BOTNOTDETECTED = {
    "vdxfid": "iSLcYw9ZcKnYJJTYvJYfk3jo3rjFHHPV7h",
    "indexid": "xXAj1jaeTe1CvULamzCpiSGL5WkG8ZjCka",
    "hash160result": "48835abfcd59557f6325f32773bbaf667bd6cbfa",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.riskcheck.botnotdetected"
    }
};
exports.IDENTITYDATA_EMAIL_ISDELIVERABLE = {
    "vdxfid": "i8P6w5ypyh7byWTYAdTY3vHezomSBSznWB",
    "indexid": "xDDDPtQuq1LGbgLa2K7h2JpC2TnT48N3FF",
    "hash160result": "6b6d001cedc2852156e286c8d63ce4bf0119d235",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.isdeliverable"
    }
};
exports.IDENTITYDATA_EMAIL_BREACHCOUNT = {
    "vdxfid": "iBhchzsBh8zKXhCAquQ5mWPdFAM6mkGvix",
    "indexid": "xGXjAoJGYTCz9s5Chb4EjtvAGpN7gnJjc6",
    "hash160result": "ea91d5cb1ff8532c4e9c847228859e4014d13a5a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.breachcount"
    }
};
exports.IDENTITYDATA_EMAIL_FIRSTBREACHEDAT = {
    "vdxfid": "iKwvVd8mHF7phMqPJVQ32bHpYT7hFG14D8",
    "indexid": "xQn2xRZr8ZLVKXiRAB4BzypMa78i5iPxyd",
    "hash160result": "597919a7c88a513db2c9223f6948ca4f767eb0b4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.firstbreachedat"
    }
};
exports.IDENTITYDATA_EMAIL_LASTBREACHEDAT = {
    "vdxfid": "iNUujoAd6CCR9X4kBQZaV6o9mt3MDqsfHs",
    "indexid": "xTK2CbbhwWR5mgwn36DjTVKgoY4N7JGP5y",
    "hash160result": "ebbc28818ea68e09defb0b67c0a5882e75027dd0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.lastbreachedat"
    }
};
exports.IDENTITYDATA_EMAIL_DOMAIN_REGISTEREDAT = {
    "vdxfid": "i8jTA9VrLRrAmTNwCnQJg93ivmVN5GWcVX",
    "indexid": "xDZZcwvwBk4qPdFy4U4TeXaFxRWNxA1Bqd",
    "hash160result": "d8d1e9bd02ff4c40c805099613567531d04cab39",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.domain.registeredat"
    }
};
exports.IDENTITYDATA_EMAIL_DOMAIN_FREEPROVIDER = {
    "vdxfid": "i8XPHcH1caNn6kQVxFERZG33ATxHfawrSB",
    "indexid": "xDMVkQi6TtbSivHXovtaXeZaC7yJSskirY",
    "hash160result": "a2c3c98d38df08384ed3d863895fd6c1ad136337",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.domain.freeprovider"
    }
};
exports.IDENTITYDATA_EMAIL_DOMAIN_CUSTOM = {
    "vdxfid": "iE7HSAqMXwxtM6XxUDRLMBUUcWniEh9hRk",
    "indexid": "xJwPtyGSPGBYyGQzKu5VKa11eAojBypGax",
    "hash160result": "48b3f1d4988af1dd73b8ccf1e5b547a891f6a474",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.domain.custom"
    }
};
exports.IDENTITYDATA_EMAIL_DOMAIN_DISPOSABLE = {
    "vdxfid": "iBteZWnaYtBLRxQyNutN7eatZZ4ZpCAoin",
    "indexid": "xGim2KDfQCQ148J1EbYX637RbD5aehG6fm",
    "hash160result": "8bb328cc7630490b07742507e6cdb77290f0505c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.domain.disposable"
    }
};
exports.IDENTITYDATA_EMAIL_DOMAIN_TOPLEVEL_SUSPICIOUS = {
    "vdxfid": "iHbaMpJAjVPgroTQYm6xwTqmVUnv4qh5mw",
    "indexid": "xNRgpcjFaocMUyLSQSm7urNJX8ovwS8zbS",
    "hash160result": "c95978851fbb34305351b4c465d7bdf59b1de79a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.email.domain.toplevel.suspicious"
    }
};
exports.IDENTITYDATA_IDCARD = {
    "vdxfid": "iJLpqieejHL8YncTbnhAW7cUTaMsfHdSGL",
    "indexid": "xPAwJX5jabYoAxVVTUMKUW91VENtUTZwau",
    "hash160result": "49b9d595086e85ce8fd4159995bbe350181715a3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    }
};
exports.IDENTITYDATA_IDCARD_ORIGINAL_FRONT = {
    "vdxfid": "iB7XpaW684q2BYjnqveLSKhSG9zwudnS6o",
    "indexid": "xFweHNwAyP3goicphcJVQiDyHp1xo2uuYa",
    "hash160result": "29f714a5b08b68b9046525c6c005a00a4d98c853",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ"
    }
};
exports.IDENTITYDATA_IDCARD_ORIGINAL_BACK = {
    "vdxfid": "iH9K2ZhRcyJWbByyUyWsXh544SVhUSrVFt",
    "indexid": "xMyRVN8WUHXBDMs1LfB2W5bb66WiNi4FtU",
    "hash160result": "24585446879161aed3198273e81ea9a69080ef95",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX"
    }
};
exports.IDENTITYDATA_IDCARD_CROPPED_FRONT = {
    "vdxfid": "iR8r1t4mYfk8xqZmaNDra6TQrUsZjbGiKS",
    "indexid": "xVxxUgVrPyxob1SoS3t1YUywt8tahdr3L4",
    "hash160result": "2bc1abbdc2c25032842bc2354e857939cef599ed",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs"
    }
};
exports.IDENTITYDATA_IDCARD_CROPPED_BACK = {
    "vdxfid": "iSM5GLZ1FvzGDNX62vgUgRQC43iaeKxoHK",
    "indexid": "xXBBj8z67FCvqYQ7tcLdeovj5hjbbVdh5q",
    "hash160result": "56fb7c2a25fc9646e588273ad379ad202e23e2fa",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A"
    }
};
exports.IDENTITYDATA_IDCARD_FACE = {
    "vdxfid": "i51M1ZmuPqEZDcC5KJbz6F9XYVacoyBE2X",
    "indexid": "x9qTUNCzF9TDqn57AzG94dg4a9bdgabnve",
    "hash160result": "77d6aa5baa62d04f8cb7d8fe899bcdebfb51cc10",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM"
    }
};
exports.IDENTITYDATA_IDCARD_IDNUMBER = {
    "vdxfid": "i5bnW5iRQbCtg21NLNybykc6ArhxUwSnVh",
    "indexid": "xARtxt9WFuRZJBtQC4dkx98dCWiyQpWVav",
    "hash160result": "d525af458c62617e95f5fa1b70b6e36e08be4f17",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa"
    }
};
exports.IDENTITYDATA_IDCARD_CATEGORY = {
    "vdxfid": "iESZ7w2LiZbcxEEWaD4BgVr4VKYkMn1dqk",
    "indexid": "xKGfajTRZspHaQ7YRtiLetNbWyZmEdZbq1",
    "hash160result": "36204ef98b988fa4ddad9a94d09bae40c7f54978",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn"
    }
};
exports.IDENTITYDATA_IDCARD_EXPIRATIONDATE = {
    "vdxfid": "i8BCBwaioR3PSSgjRcWGx9RfFUCbVXNYxe",
    "indexid": "xD1Jek1oejG44cZmHJARvXxCH8DcSWVK4B",
    "hash160result": "e2187beb59c4815c0b4926bfa14e5d48657e9133",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj"
    }
};
exports.IDENTITYDATA_IDCARD_ISSUING_COUNTRY_MATCHED = {
    "vdxfid": "i6ubxHFxwzxQU1zmBvLW1oYj6iozy3znSU",
    "indexid": "xBjiR5h3oKB56Bso3bzezC5G8Nq1rhjRiV",
    "hash160result": "96eb5b9e8921784e76c96e272b20f009d68ca625",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX"
    }
};
exports.IDENTITYDATA_IDCARD_ISSUING_REGION = {
    "vdxfid": "i4AFd1rzyfsmgTLgyn472E3gc2VBaw4uFK",
    "indexid": "x8zN5pJ5pz6SJdDiqTiFzcaDdgWCSVW9s9",
    "hash160result": "5d8fc30a870e94f5274d09d6c16e5d8795708307",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL"
    }
};
exports.IDENTITYDATA_IDCARD_DATEOFBIRTH = {
    "vdxfid": "i48Nsi8VjHvSdW9MCB59vVF8AeoCSALbW6",
    "indexid": "x8xVLWZaac97Fg2P3rjJtsmfCJpDMvuw4c",
    "hash160result": "99acfcbf72a37bcfa3ccf9f3d8a60f60a3a92807",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4"
    }
};
exports.IDENTITYDATA_IDCARD_ADDRESS = {
    "vdxfid": "iHQjj4N8axeE24n8RctE8cQtSUdSoTFBMv",
    "indexid": "xNErBroDSGrteEfAHJYP6zwRU8eTdJWVVZ",
    "hash160result": "744a4f4b004c403c1d671053d717a36ecf5bda98",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3"
    }
};
exports.IDENTITYDATA_IDCARD_ADDRESS_STREET1 = {
    "vdxfid": "iKTakiCWF81oLmpY9nQD9pgQttsKyYBEYz",
    "indexid": "xQHhDWdb6SETxwha1U4N8DCwvYtLoHXM2c",
    "hash160result": "c284feffa60f1978b8f8551cbd6724ca795e54af",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_IDCARD_ADDRESS_CITY = {
    "vdxfid": "iEwv5MTy2Dg5atRBc8bSTjMLDHsMLQzVDU",
    "indexid": "xKn2Y9u3sXtkD4JDTpFbS7ssEwtNDGiHDg",
    "hash160result": "bee2235466779e3ea61b5531b3aa396a0984d77d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_IDCARD_ADDRESS_REGION = {
    "vdxfid": "i97JbWvVd6qSRXh8eqjZKG95dj2NeigvWF",
    "indexid": "xDwR4KMaUR473haAWXPiHefcfP3PYf7uVw",
    "hash160result": "4a74b6e17bea7b240dc8acd7f7e4a82fb34dcd3d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_IDCARD_ADDRESS_POSTCODE = {
    "vdxfid": "iLhtE8EXXJ6ATCZ7xJzbvyJKRTYXUX4A7i",
    "indexid": "xRXzgvfcNcJq5NS9ozekuMprT7ZYKa7cdy",
    "hash160result": "556f2f620f185c90906aac53e60810665be700bd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_IDCARD_ADDRESS_COUNTRY = {
    "vdxfid": "iNxc7w91fgHgvRoNsifWYxHMFSJcrCuGss",
    "indexid": "xTniaja6WzWMYbgQjQKfXLotH6Kdg4E8gT",
    "hash160result": "0cab0e442caf58e660f32d2d36f8e64b12f3b9d5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_IDCARD_DOCUMENTVERIFICATION_MATCHED = {
    "vdxfid": "iMHhAMLCDnisJVbZpTzwdAjwQQobVtkP3e",
    "indexid": "xS7od9mH56wXvfUbg9f6bZGUS4pcQztAYY",
    "hash160result": "361025b8f50593f08f332b0cd227ade34dcf65c3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk"
    }
};
exports.IDENTITYDATA_IDCARD_NAME_MATCHED = {
    "vdxfid": "i3duYwSwdrLztnP43wuwiTfH9G5adxpZJm",
    "indexid": "x8U21jt2VAZfWxG5uda6grBpAv6bc21iUD",
    "hash160result": "11c10b7a91af6a813b1cc0f2945a63bf0435c601",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv"
    }
};
exports.IDENTITYDATA_IDCARD_DATEOFBIRTHMATCHED = {
    "vdxfid": "iPFTbFBXsM4df4BkNoMfFoHynxzKKkUqJv",
    "indexid": "xU5a43ccifHJHE4nEV1pEBpWpd1LCCSSq8",
    "hash160result": "ba6a81f6ea53e339ff4d8e2aa5c1d660aee6e9d8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.idcard"
    },
    "bounddata": {
        "vdxfkey": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb"
    }
};
exports.IDENTITYDATA_PASSPORT = {
    "vdxfid": "i8oiYgB9L9WJWGJgpcrm68mvoq4KoTASNL",
    "indexid": "xDdq1UcEBTiy8SBigJWv4XJTqV5LiS8drz",
    "hash160result": "a7e8f210eb00dcc94038864f8c59b8403ccf793a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    }
};
exports.IDENTITYDATA_PASSPORT_ORIGINAL_FRONT = {
    "vdxfid": "iQhPuQoj5PDXpF5XsA26PhnvbvBVHUCgtM",
    "indexid": "xVXWNDEovhSCSQxZiqgFN6KTdaCWDq4RVw",
    "hash160result": "942c2ac1a23d27ab82ea20072a31a3aba9c3c9e8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ"
    }
};
exports.IDENTITYDATA_PASSPORT_ORIGINAL_BACK = {
    "vdxfid": "iHZRBTVpGXBpq1D3JQvB37HwwC81UVaEBt",
    "indexid": "xNPXeFvu7qQVTB65A6aL1VpUxr92J21Y2e",
    "hash160result": "0b0574e283da6e3dd272ca2f7088634d309f7e9a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX"
    }
};
exports.IDENTITYDATA_PASSPORT_CROPPED_FRONT = {
    "vdxfid": "iGsEp6i4xXh4gNizJgWEoiCwZxzPsuPvnJ",
    "indexid": "xMhMGu99oqujJYc2ANAPn6jUbd1Qimj8Dp",
    "hash160result": "c26f63c41583bbf9fb1fb6eb714c87c71054e592",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs"
    }
};
exports.IDENTITYDATA_PASSPORT_CROPPED_BACK = {
    "vdxfid": "iHfLky17R6QTL1tkhN4YzjigfaNKFMXJwg",
    "indexid": "xNVTDmSCGQd7xBmnZ3ihy8FDhEPLApagju",
    "hash160result": "b49b18cb2d18cabafd16b138f6de43b1136d9d9b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A"
    }
};
exports.IDENTITYDATA_PASSPORT_FACE = {
    "vdxfid": "iGvZEAbQPV74x8zimmH857Eyug1YYG6da8",
    "indexid": "xMkfgy2VEoKjaJskdSwH3VmWwL2ZPGWyYL",
    "hash160result": "c1b64e1b1d902fce4bca08951958ae30c3f28593",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM"
    }
};
exports.IDENTITYDATA_PASSPORT_IDNUMBER = {
    "vdxfid": "iRYCG1nfoPiuZFKqbsugCgi317aY2ErtkM",
    "indexid": "xWNJipDkehwaBRCsTZZqB5Ea2mbYowicUR",
    "hash160result": "abd6da27bddaf9e92e6872589a8cb1ae056d04f2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa"
    }
};
exports.IDENTITYDATA_PASSPORT_CATEGORY = {
    "vdxfid": "iPinz8N4RxboKaHvTr4FcJXe9DLojw3bXH",
    "indexid": "xUYuSvo9HGpTwkAxKXiQah4BAsMpZeqQLH",
    "hash160result": "748058a57c693f07b6b69b53a9509086615215de",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn"
    }
};
exports.IDENTITYDATA_PASSPORT_EXPIRATIONDATE = {
    "vdxfid": "iBXSY6Ra3o5jK9QZdnrdttsrnFE6y3H8o9",
    "indexid": "xGMYztreu7JPwKHbVUWnsHQPouF7mXgFAg",
    "hash160result": "5cd8ab62f4b455d520e951243a6e6ac2be2a4e58",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj"
    }
};
exports.IDENTITYDATA_PASSPORT_ISSUING_COUNTRY_MATCHED = {
    "vdxfid": "iLjpTPmDufuH38s9XwatiLA8Wk67a2thc8",
    "indexid": "xRZvvCCJkz7wfJkBPdF3gigfYQ78WXNncA",
    "hash160result": "d53e23bd3ca7de97d1ed41b501d9a1f06b965ebd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX"
    }
};
exports.IDENTITYDATA_PASSPORT_ISSUING_REGION = {
    "vdxfid": "i87HPTEfVQ9HKF8zrNppBEBF8wur6BAGBf",
    "indexid": "xCwPrFfkLiMwwR22i4Uy9chnAbvrufhBnx",
    "hash160result": "3f8308ca4fe693714fdab6fb3871698a5a2bd432",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL"
    }
};
exports.IDENTITYDATA_PASSPORT_DATEOFBIRTH = {
    "vdxfid": "iRe6ZecbVBajvySLEiFxAgMtgZwxBiZY78",
    "indexid": "xWUD2T3gLVoQZ9KN6Pv794tRiDxy6henbx",
    "hash160result": "27a8f2f7695013eef34f4bb36cb9a8eeb92a22f3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4"
    }
};
exports.IDENTITYDATA_PASSPORT_ADDRESS = {
    "vdxfid": "iCMcVHrazgA1N2WpXUmffifER2AhUzD6re",
    "indexid": "xHBix6HfqzNfzCPrPARpe7BmSgBiQSui11",
    "hash160result": "e6bb757f72e329878ff5e7e8409ee9a0bc706a61",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3"
    }
};
exports.IDENTITYDATA_PASSPORT_ADDRESS_STREET1 = {
    "vdxfid": "i79XJcQgvEz247HHaKWxTiyxVVnDboWYqv",
    "indexid": "xBydmQqmmZCggHAKS1B7S7WVX9oEThCnwK",
    "hash160result": "c9f030a041e6460517ff39854d3625f70e7e4828",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_PASSPORT_ADDRESS_CITY = {
    "vdxfid": "iBM6AvLwRcHKHMwDjPmVts1VxKQYHAmFHA",
    "indexid": "xGBCdin2GvVyuXpFb5ResFY2yyRZDWy6sS",
    "hash160result": "78068da24f1196cf7bcb7e45d3f2bd90e8015956",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_PASSPORT_ADDRESS_REGION = {
    "vdxfid": "iKBAveavEwQG28SE4eRUGY5ZqaSLNrCnM1",
    "indexid": "xQ1HPT216FcveJKFvL5dEvc6sETMKCokvR",
    "hash160result": "14ad7b91cee4646af2d5625fa0d5eeea8ed239ac",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_PASSPORT_ADDRESS_POSTCODE = {
    "vdxfid": "iDZEoefPi6Q6WjWseS5LMYwk4PXVzU8Yfd",
    "indexid": "xJPMGT6UZQcm8uPuW7jVKwUH63YWskMh6F",
    "hash160result": "16150338c79c92a5469e14079ef0eb9d0e75956e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_PASSPORT_ADDRESS_COUNTRY = {
    "vdxfid": "iNAWV5t3VpZc9mGxRxqHo8qBo5mRDmYNzh",
    "indexid": "xSzcwtK8M8nGmw9zHeVSmXMipjnS4TfbaT",
    "hash160result": "64016ff1aa45d5a017a351c87751052b721c02cd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_PASSPORT_DOCUMENTVERIFICATION_MATCHED = {
    "vdxfid": "iRstHEJfNZfPvmcDUGMyqD6fLvfKvv9ZNr",
    "indexid": "xWhzk2jkDst4YwVFKx28obdCNagLpBSeTi",
    "hash160result": "ea0746c22573d01b7aa023e40381f655a9bcbdf5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk"
    }
};
exports.IDENTITYDATA_PASSPORT_NAME_MATCHED = {
    "vdxfid": "iNQ1CWDT7So5agryapjXpo2nhxto4w6yM8",
    "indexid": "xTE7fJeXxm1kCrk1SWPgoBZKjcuoypYrZa",
    "hash160result": "5e8b3b606e58d88fb46e055728ff0a8eeb7c8fcf",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv"
    }
};
exports.IDENTITYDATA_PASSPORT_DATEOFBIRTHMATCHED = {
    "vdxfid": "iHExwXrJTrVLTS5okNNtp9BMRoTbwBNBQu",
    "indexid": "xN55QLHPKAi15bxqc433nXhtTTUcpv6xtK",
    "hash160result": "3f79d48090f69366e7e78b5765b14565fb3a0197",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.passport"
    },
    "bounddata": {
        "vdxfkey": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT = {
    "vdxfid": "iJzdKZ1ppXjnrbasWGH24nWtNchKTFE6oM",
    "indexid": "xPpjnMSufqxTUmTuMwwB3B3RQGiLRSe3a7",
    "hash160result": "eb1a88f1148f3f3798bd9f08a5b88a50bf473baa",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ORIGINAL_FRONT = {
    "vdxfid": "iCAHvT9dB52QoCHuHYuYJ2BBkytUndvMVj",
    "indexid": "xGzQPFai2PF5RNAw9EZhGQhinduVgDqt5Q",
    "hash160result": "e191b50000a4d871b4a310f3360dd8cad35d465f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ORIGINAL_BACK = {
    "vdxfid": "iE6M2Mibzrrneg3cZFbNrXHf9D9FMgBqx9",
    "indexid": "xJvTVA9grB5TGqveQwFXpupCAsAGBbcCJR",
    "hash160result": "9233dcff0e38f245836911eef94c4bb7238b7774",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_CROPPED_FRONT = {
    "vdxfid": "i91nujduYeu8scMbSkJj1iZuH5VSh3Z5rW",
    "indexid": "xDquNY4zPy7oVnEdJRxsz76SJjWTcVNPwS",
    "hash160result": "28ec50fb17556fceea921d0a90d822987471c23c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_CROPPED_BACK = {
    "vdxfid": "iLpNisoTSTZ8LLHtkPJ9HSxVu84QW1a98Z",
    "indexid": "xReVBgEYHmmnxWAvc4xJFqV2vn5RR6aiTG",
    "hash160result": "03f3ca2aa3bcdbc2c7b60d18913ae869c02f3bbe",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_FACE = {
    "vdxfid": "iG9jwZT4PBKWSbm7o5zCWNKZkACyGCCZY3",
    "indexid": "xLyrQMt9EVYB4me9emeMUkr6mpDz9wW5M5",
    "hash160result": "75cd40bd50a7df36d91334c5e7087f9b602c0c8b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_IDNUMBER = {
    "vdxfid": "iFSUa91mA9uok8XL71HNkK5m8xvBKEiMBn",
    "indexid": "xLGb2wSr1U8UNJQMxgwXihcJAcwCCmAsFQ",
    "hash160result": "3463196fb71b581b22c2355dca63d8ce0b4a3e83",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_CATEGORY = {
    "vdxfid": "iJ7wb2r93YaLrXkLdKWgAs5nmowgE7Feth",
    "indexid": "xNx43qHDtro1UhdNV1Aq9FcKoTxh6YYiWp",
    "hash160result": "5eb69e44059f8c65fdc0f132bffe26ba8c50a5a0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_EXPIRATIONDATE = {
    "vdxfid": "iFTmB8nRz1e1LWy6VZy69z13JJDqSjGYzu",
    "indexid": "xLHsdwDWqKrfxgr8MFdF8NXaKxErHmHoJn",
    "hash160result": "4c0ea69b915ce91fecf6f82b5993835ea4907c83",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ISSUING_COUNTRY_MATCHED = {
    "vdxfid": "iDycAmsF8RoSfDCqt8GKwfLdajJEejPYBF",
    "indexid": "xJoidaJKyk27HP5sjovUv3sAcPKFUR4Skz",
    "hash160result": "198ee70ddf1dae654a868ee39d83015a37463173",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ISSUING_REGION = {
    "vdxfid": "iLZnhoDnggyo9LGiyS8xvEovkSn1yRuRjz",
    "indexid": "xRPuAbesY1CTmW9kq7o7tdLTn6o2m96TLY",
    "hash160result": "f969f7afa0599e431674b2e76bc4ee5f3cf778bb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_DATEOFBIRTH = {
    "vdxfid": "iMPmaDAiNuaqfSNV9SbCuaYG2TCvPNU495",
    "indexid": "xSDt31boEDoWHcFX18FMsy4o47DwGgmFbq",
    "hash160result": "93ab89f3abe5db79de5fb960f9362b02ecfc8bc4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS = {
    "vdxfid": "i5pghYvnurAvtbyT69Lt1wBk9NTQNYfWt5",
    "indexid": "xAeoAMMsmAPbWmrUwq12zKiHB2URHSXqA1",
    "hash160result": "43aa306c8ff55fc646a7a1bb0e0171576c4ec019",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_STREET1 = {
    "vdxfid": "iC3BuU53cL5hXRnnezmmToKvUZxyQb1AUs",
    "indexid": "xGsJNGW8TeJN9bfpWgRvSBrTWDyzMRUX1Q",
    "hash160result": "64d4d3dd9f6acbd72f13a717572302109c6eee5d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_CITY = {
    "vdxfid": "iHv1BkzjJgJcwsBHJCeGTgcUHmoCmGE5py",
    "indexid": "xNk7eZRp9zXHa34K9tJRS591KRpDa69BBJ",
    "hash160result": "6d9fbcb4cd86e46dfbf806c13f951108c253639e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_REGION = {
    "vdxfid": "iKEHZjtgcCRd67iRsA93J7yphxvRUYdZig",
    "indexid": "xQ4Q2YKmTWeHiHbTiqoCGWWMjcwSPM6wn6",
    "hash160result": "6c5f8b7989f6210f50d9d270c170cae9dd9cd0ac",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_POSTCODE = {
    "vdxfid": "i7niNaE598TEVhfaf78do5rhKX6gXgdqAC",
    "indexid": "xCcpqNf9zSfu7sYcWnnnmUPEMB7hMATGYv",
    "hash160result": "ca2d0134ac28a0f46363ea91b036fc78531f512f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_ADDRESS_COUNTRY = {
    "vdxfid": "i7sePTAMwZ5hVQvdgjfWr9mCg4G8YDvwcx",
    "indexid": "xChkrFbSnsJN7aofYRKfpYHjhiH9PqemVR",
    "hash160result": "2ffeb2e22fb423ede8ad0127d39be36133e03f30",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_DOCUMENTVERIFICATION_MATCHED = {
    "vdxfid": "iGRk3K3N3Nr4gvVWL2aKdzfjP54ZNvpVaT",
    "indexid": "xMFrW7USth4jK6NYBiEUcPCGQj5aM9U9ed",
    "hash160result": "316ae15a805987678066399eb21d162759e9128e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_NAME_MATCHED = {
    "vdxfid": "iPJhtbfg9yL4ydMLXfgb1XUqm4zvtcS3c7",
    "indexid": "xU8pMQ6m1HYjboENPMLjyv1Nnj1wmqZv7q",
    "hash160result": "52e2b8b282867a147bd6ce097359606cd91587d9",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv"
    }
};
exports.IDENTITYDATA_RESIDENCEPERMIT_DATEOFBIRTHMATCHED = {
    "vdxfid": "iBZWkQDNUV46RpDHi3CMn78ENBcQj4RVUp",
    "indexid": "xGPdDCeTKoGm3z6KZirWkVemPqdRgTRtbw",
    "hash160result": "197dbc7ddf5795a60bb0bf037c8b846cda83b258",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residencepermit"
    },
    "bounddata": {
        "vdxfkey": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb"
    }
};
exports.IDENTITYDATA_RESIDENTCARD = {
    "vdxfid": "iRZk3qsYq1ac6H53v3cSWhqx8VqUoMxpuK",
    "indexid": "xWPrWeJdgKoGiSx5mjGbV6NVA9rVgyJnaL",
    "hash160result": "b804f8f1b6006c80b18d5cda0fbcc39900614ff2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ORIGINAL_FRONT = {
    "vdxfid": "iHqGf5Yq5MTjS3vJS4GmfPkU2unJVFMLXs",
    "indexid": "xNfP7syuvfgQ4DoLHjvvdnH14ZoKPe8ZfA",
    "hash160result": "3ee1ac34db24100dbcd7ab1d0c110fc674297e9d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ORIGINAL_BACK = {
    "vdxfid": "iQAb2ZQ7Z5tZXiiASNpuXYWGGA9ZNTho6m",
    "indexid": "xUzhVMqCQQ7E9tbCJ4V4Vw2oHpAaA2pxef",
    "hash160result": "cf0888932dddd9da9a7e8008dc7e3dfe9a27f6e2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_CROPPED_FRONT = {
    "vdxfid": "iCAq6xmjVDq3an2yRkws3xmLfXmDfm6TK5",
    "indexid": "xGzwZmCpLY3iCwv1HSc22MHshBnEaVnkU7",
    "hash160result": "6e067b98f82fc5d158a11c57e86fd5583165605f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_CROPPED_BACK = {
    "vdxfid": "i5DMa83PXnoc3VaaDBvwUPqtXQS3VkJM65",
    "indexid": "xA3U2vUUP72GffTc4sb6SnNRZ4T4Qptiiu",
    "hash160result": "79ad91be4e21e9065c557d16d530bd53c5c71113",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_FACE = {
    "vdxfid": "iMkREmUUamd78MP7GeP1wtFteRGoWEAgFj",
    "indexid": "xSaXhZuZS5qmkXG98L3AvGnRg5HpLnMLTA",
    "hash160result": "a8daf37e1cd1ccc4edbf4f0ee3b193f588bf73c8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_IDNUMBER = {
    "vdxfid": "iGYqQVqehuhYb95knMeydLdtoEzGAFJU9e",
    "indexid": "xMNwsJGjZDvDDJxne3K8bjARpu1H4ShUgH",
    "hash160result": "c9b041ee41a77909c6aee95418d9e5244d4d6a8f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_CATEGORY = {
    "vdxfid": "iMxE22zmptXB8ShHsSypWSqXLmEficJVug",
    "indexid": "xSnLUqRrgCjqkcaKj8dyUqN4NRFgaJT7cn",
    "hash160result": "5b6369f617841495baaeb8b396b6bf87c75fafca",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_EXPIRATIONDATE = {
    "vdxfid": "iFeEkx5dNqs9RmYnyBNnMJpigdVo75MA3Q",
    "indexid": "xLUMDkWiEA5p3wRpps2wKhMFiHWp59WJtb",
    "hash160result": "53ab24af7c986998582d42d98d4e7b4ef1bf7785",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ISSUING_COUNTRY_MATCHED = {
    "vdxfid": "iHHLQuEx2sQ5FHm8cHs2eW5YFKBu42QyT4",
    "indexid": "xN7Sshg2tBcjsTeATyXBctc5GyCuutBKAi",
    "hash160result": "c233566af8cb4d2bec45de1b6314a8c373fc7397",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ISSUING_REGION = {
    "vdxfid": "iQSeWkZJbBknqaAvrVk8UpzXcbDcD3JwZK",
    "indexid": "xVGkyYzPSVyTTk3xiBQHTDX4eFEd6nwER3",
    "hash160result": "f46eda08f73c5415674385dafb8f913a5ab8ffe5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_DATEOFBIRTH = {
    "vdxfid": "iL3JyAfGXCDqotYbGTsC6Et9pe4x9zqKft",
    "indexid": "xQsRRy6MNWSWS4Rd89XM4dQgrJ5y4pBTXB",
    "hash160result": "ebc0dd42cc2bbf62c504fb64e7b6d29ebb55b5b5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ADDRESS = {
    "vdxfid": "iBU6zckdwpwkR9BbFPVKNEf5X7b8TWERYR",
    "indexid": "xGJDTRBio9AR3K4d759ULdBcYmc9QPsq2R",
    "hash160result": "921d0bf97b612e9de3294054e4a25e4c0c9bac57",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_STREET1 = {
    "vdxfid": "i47Wp3Wt9Bib7KB6oSxm8QtQxmAqwxZV18",
    "indexid": "x8wdGqwxzVwFjV48f8cv6oQwzRBrs4rtgB",
    "hash160result": "4f18b96b75ce0af53a288a0e382c54df3adffe06",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_CITY = {
    "vdxfid": "iRNzrpZ74Wm6wMMFh5VeUzR2NBfa9R3UTo",
    "indexid": "xWD7KczBupymZXEHYm9oTNwZPqgb5cJGDD",
    "hash160result": "149842d5588eaf9a77f40e4b63520c09832a47f0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_REGION = {
    "vdxfid": "iHAW2LhviXqcVdMsPTcap9khj6rfrfBKRu",
    "indexid": "xMzcV991Zr4H7oEuF9GjnYHEkksgoPXYFo",
    "hash160result": "c7cd6053d9cd2a7e4482f46366202e87e7182996",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_POSTCODE = {
    "vdxfid": "i9R5Y1NexqRDP3ztWox1qCPVEVZvbAS7Yx",
    "indexid": "xEFBzoojp9dt1DsvNVcAoav2G9awPo2kkY",
    "hash160result": "2ccf68aa3d77e0d0a30ef4bdae990b6a72e32941",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_ADDRESS_COUNTRY = {
    "vdxfid": "iAZGARqg4GFG8SdjuKe9Zkf9SNqS2fqqop",
    "indexid": "xFPNdEGkuaTvkcWmm1JJY9BgU2rSwXWCNA",
    "hash160result": "21c3b6b680c00fc148910e6684737549b636ae4d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_DOCUMENTVERIFICATION_MATCHED = {
    "vdxfid": "iQvbQZ6EQmkESfrgtXhCJ8Vszu1oC9f5rt",
    "indexid": "xVkhsMXKG5xu4qjikDMMGX2R2Z2p3yR8MD",
    "hash160result": "817d1a8d17b92516bccc8e026fbf4d8e09c648eb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_NAME_MATCHED = {
    "vdxfid": "iNdqmEoGr2zr9eDPmPS99nHJQcK8c61SWR",
    "indexid": "xTTxE3EMhMDWmp6Rd56J8AoqSGL9Yay9KW",
    "hash160result": "13cc257f9ae7a639ce00b049198336b15a6f2dd2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv"
    }
};
exports.IDENTITYDATA_RESIDENTCARD_DATEOFBIRTHMATCHED = {
    "vdxfid": "iL3YRkmngkLVsPa1xwAdWcb5NEjiZdCLbB",
    "indexid": "xQsetZCsY4ZAVZT3pcpnV17cPtkjSpUs5B",
    "hash160result": "800f1e6739db010a4edc9ed45e4d2422c591c0b5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.residentcard"
    },
    "bounddata": {
        "vdxfkey": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb"
    }
};
exports.IDENTITYDATA_VISA = {
    "vdxfid": "iATKs43yLjHHyCcLmVtZt2gGZF5PaTvxfy",
    "indexid": "xFHSKrV4C3VxbNVNdBYirRCoau6QSwcyaF",
    "hash160result": "f3240ba891b8ed340bc5f8ca9f7c6e3391ce8e4c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    }
};
exports.IDENTITYDATA_VISA_ORIGINAL_FRONT = {
    "vdxfid": "iSQ98EpyqS26vDxLz2sPkSLfHitiSE5W66",
    "indexid": "xXEFb3G4gkEmYPqNqiXYipsCKNujJTbHCP",
    "hash160result": "f7bb12de360a562c66b20e49714fdf7c979b76fb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ"
    }
};
exports.IDENTITYDATA_VISA_ORIGINAL_BACK = {
    "vdxfid": "iP7hjj56oH2Xozpw6sPAx4tmXzdCqCGc8P",
    "indexid": "xTwpCXWBebFCSAhxxZ3KvTRJZeeDgSAny1",
    "hash160result": "d52e97ed89ccb3d384cee2509a0bf1aacf6172d7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX"
    }
};
exports.IDENTITYDATA_VISA_CROPPED_FRONT = {
    "vdxfid": "i5GYu5sBm2sJh1trhe7ry2J3h5vq5jtBi5",
    "indexid": "xA6fMtJGcM5yKBmtZKn1wQpaijwquAGHpb",
    "hash160result": "9f1a97f4206a3d10c987d982c6093c31c67bac13",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs"
    }
};
exports.IDENTITYDATA_VISA_CROPPED_BACK = {
    "vdxfid": "iQRrKSZCi8oURCVTPdvFcNXARXq8BUmEPQ",
    "indexid": "xVFxnEzHZT293NNVFKaQam3hTBr9B2SPr8",
    "hash160result": "91705b953ea6a6824096763e55bd7ff89128d9e5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A"
    }
};
exports.IDENTITYDATA_VISA_FACE = {
    "vdxfid": "i5HD9vjKw9soTjAC4GwfKnEvEFVMuRU1Tt",
    "indexid": "xA7KcjAQnU6U5u3DuxbpJAmTFuWNhv9uYv",
    "hash160result": "9b92d6ae6541357cea0bb018f616586dfc6acc13",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM"
    }
};
exports.IDENTITYDATA_VISA_IDNUMBER = {
    "vdxfid": "i7m6YfgMd7iELn25uZ36oA9sScTHdwHe1Z",
    "indexid": "xCbD1U7SURvtxwu7mEhFmYgQUGUJaGUuzV",
    "hash160result": "54d2d2bdfe71c96efe3d5630159f55c0e6cc022f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa"
    }
};
exports.IDENTITYDATA_VISA_CATEGORY = {
    "vdxfid": "i5ADnmaWGg9VJhYueJwd5kFmSgxuhLxHrQ",
    "indexid": "x9zLFa1b7zN9vsRwVzbn48nJULyvfSeNuC",
    "hash160result": "c1a982a1a03c643bdace28189b80be6353097a12",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn"
    }
};
exports.IDENTITYDATA_VISA_EXPIRATIONDATE = {
    "vdxfid": "iAdCPpmiY4W1Mkb7vQNTiR38HFBMuwMcEe",
    "indexid": "xFTJrdCoPNifyvU9n62cgoZfJuCNkyMTYH",
    "hash160result": "a14a1b7acddd65bc3b403b8d080a982738bb6c4e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj"
    }
};
exports.IDENTITYDATA_VISA_ISSUING_COUNTRY_MATCHED = {
    "vdxfid": "iRRYUVK9WZodGM15oJCrZgdXV6PaLZoxFC",
    "indexid": "xWFewHkEMt2HtWt7eys1Y5A4WkQbHjGMmc",
    "hash160result": "22ddef78469b09e9352e948b16fec0978a63c2f0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX"
    }
};
exports.IDENTITYDATA_VISA_ISSUING_REGION = {
    "vdxfid": "iE5fNZUT4G8ZnR1BbJTNCgc54FUFwqeUcp",
    "indexid": "xJumqMuXuaMEQatDSz7XB58c5uVGrJL3e3",
    "hash160result": "d7dd15c309c0ae09f5a7293b4b0cf15ca7715674",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL"
    }
};
exports.IDENTITYDATA_VISA_DATEOFBIRTH = {
    "vdxfid": "iF8CRZfCthVVm2VoxyfjMcmXw5x2EReAMv",
    "indexid": "xKxJtN6Hk1iAPCNqpfKtL1J4xjy396V6v7",
    "hash160result": "908c870f1f57ea5cd8aae089feb5f4f98752c97f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4"
    }
};
exports.IDENTITYDATA_VISA_ADDRESS = {
    "vdxfid": "i53bAJPm5Dvbhovj671RVzkZq9Lej8M8iw",
    "indexid": "x9shd6pqvY9GKyokwnfaUPH6roMfesuo4U",
    "hash160result": "b3f7110b2359782dc7df5a12c740a275e9f63811",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3"
    }
};
exports.IDENTITYDATA_VISA_ADDRESS_STREET1 = {
    "vdxfid": "iGpueUZCzRG6YVL5xZVV56sjpK39wXm3T6",
    "indexid": "xMf27GzHqjUmAfD7pF9e3VQGqy4Ao4VwBi",
    "hash160result": "e32af4b6f696c06f289e9d19674a31ad5f7f7492",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.IDENTITYDATA_VISA_ADDRESS_CITY = {
    "vdxfid": "iNRkLpudpDSAZtoyxSLAV6qp143Vny58dF",
    "indexid": "xTFrodLifXeqC4h1p7zKTVNM2i4WdCQiTz",
    "hash160result": "7a9966496c47f9b145e785c9fd76fbc515ebe3cf",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.IDENTITYDATA_VISA_ADDRESS_REGION = {
    "vdxfid": "iR5syE1ENGxcDwcUXrvDnYT8jfXTF9RWLU",
    "indexid": "xVuzS2SKDbBGr7VWPYaNkvyfmKYU7gkeus",
    "hash160result": "1646f77db041fe2fd10d01a7afffc9cdf4570aed",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.IDENTITYDATA_VISA_ADDRESS_POSTCODE = {
    "vdxfid": "i4MPAfFeCJGDuXgKsyDLRJgcam4ukpEo28",
    "indexid": "x9BVdTgj3cUtXhZMjesVPhD9cR5vg2V94k",
    "hash160result": "ceab8e1f6f76178916d73d6671e8767269509e09",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.IDENTITYDATA_VISA_ADDRESS_COUNTRY = {
    "vdxfid": "iPnjFJpqiiBQ7D6797hNoVmbNJMydCZdgj",
    "indexid": "xUcqi7Fva2Q4jNy8zoMXmtJ8PxNzWUqNgK",
    "hash160result": "1e10864c861d5eda424d0e6ecf1ae20977ddd3de",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.IDENTITYDATA_VISA_DOCUMENTVERIFICATION_MATCHED = {
    "vdxfid": "iKiQKkypr3B5NEHvPBg2sNEHeZcrZy3dL1",
    "indexid": "xQYWnZQuhMPjzQAxEsLBqkkpgDdsNiGwfo",
    "hash160result": "b36c238b24223f6a4652f6301bf5dfa5dae621b2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk"
    }
};
exports.IDENTITYDATA_VISA_NAME_MATCHED = {
    "vdxfid": "iKDJ8c248aZMWkKSFuVypNt4GVrZ91oArN",
    "indexid": "xQ3QbQT8ytn28vCU7bA8nmQbJ9sa3AvkmG",
    "hash160result": "96b725305bec875c2f0fb3028def34a277aba0ac",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv"
    }
};
exports.IDENTITYDATA_VISA_DATEOFBIRTHMATCHED = {
    "vdxfid": "i9o1iuJJTwfTCuJzCT6yw1X41SbEwJk1DC",
    "indexid": "xEd8BhjPKFt7q5C248m8uQ3b36cFn4BGH7",
    "hash160result": "e6f5f12e63f6b86c4dc1f4185ed6c89d7edb4f45",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.visa"
    },
    "bounddata": {
        "vdxfkey": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_ORIGINALFRONT = {
    "vdxfid": "iBrpt78Mdrqcc1RHwPWKYBALbNTC4cwdJQ",
    "indexid": "xGgwLuZSVB4HEBJKo5AUWZgsd2UCxbFCCA",
    "hash160result": "734505c8a36a53d58aedfc18f8f0c9e312b9f85b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.originalfront"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_ORIGINALBACK = {
    "vdxfid": "iNRCZp7JBDHbpKQ2Vhc6TK97hUSRPG4jaX",
    "indexid": "xTFK2cYP2XWGSVH4MPGFRhfej8TSGxUzFR",
    "hash160result": "fc576cd9799270c2e432da7b5481254c9864c9cf",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.originalback"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_CROPPEDFRONT = {
    "vdxfid": "iK822dFQwW2Y5tdpSpxQtHQemf47HoFxqs",
    "indexid": "xPx8VRgVnpFCi4WrJWcZrfwBoK58CsfaGo",
    "hash160result": "6b2cc84a0df71c4b1920d5332ecde7cdd625a1ab",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.croppedfront"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_CROPPEDBACK = {
    "vdxfid": "iCvxKVHbnbwHGZDTaGofeyyJLjsGBSZr7A",
    "indexid": "xHm4nHigdv9wtj6VRxTpdNVqNPtH2yr1Kb",
    "hash160result": "edcfcebea370f151dc72c13a34b972dd9fb8b867",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.croppedback"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_FACE = {
    "vdxfid": "iPrxPJC6NbzWnkNyLSvwa8AVrwJWBUV9mM",
    "indexid": "xUh4r6dBDvDBQvG1C8b6YWh2tbKX74nCWP",
    "hash160result": "d65b41ab8d8c667a46921b860342f471eb7ea0df",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.face"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_IDNUMBER = {
    "vdxfid": "iJdUp47SVEzGEHCvoRyix2xufRsAeWSyxa",
    "indexid": "xPTbGrYXLZCvrT5xf7dsvRVSh5tBU3pzip",
    "hash160result": "34ad72308593579994ebe622e284a67044713ba6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.idnumber"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_CATEGORY = {
    "vdxfid": "i9MqRfXPAiYwv9q4iSjTtXquNCCZ1GgECn",
    "indexid": "xEBwtTxU22mcYKi6a8PcrvNSPrDZtQ5nSL",
    "hash160result": "6d03e9b13582f7069c52d73f7f55881dd9dc8c40",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.category"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_EXPIRATIONDATE = {
    "vdxfid": "iNgDKviLAeeV65eBztuduckUMDE2erB7jj",
    "indexid": "xTWKnj9R1xs9iFXDraZnt1H1NsF3UEb4Kf",
    "hash160result": "6ecad210f102677f2d2d75a0929fb3676c44a0d2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.expirationdate"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_ISSUINGCOUNTRY = {
    "vdxfid": "iFgXmTd9Wi2sqZyPqaoejdHG2sMaJWLrEX",
    "indexid": "xLWeEG4EN2FYTjrRhGToi1oo4XNbE2QwRu",
    "hash160result": "c0e0b8f43025cc9574486117135e4c8fa8c7e685",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.issuingcountry"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_ISSUING_REGION = {
    "vdxfid": "iByfEUF2bHSmBbiDoBu42a4HKTKbDvPGbL",
    "indexid": "xGomhGg7SbfRombFesZCzxapM7Lc5aQFa4",
    "hash160result": "1ff5e3f915ccb6616cbc04e0b51961f98694435d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.issuingregion"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_DATEOFBIRTH = {
    "vdxfid": "iQhjETQvSkadciDPy69QZNy3hSczWQ4iu4",
    "indexid": "xVXqhFr1J4oJEt6RpmoZXmVaj6e1NWsjoF",
    "hash160result": "38b824222653effa835ea81b8bf2397b18e6d9e8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.dateofbirth"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_ADDRESS = {
    "vdxfid": "iGebr2v1TgkWvsyLjs1dQ5SqffqKL8rNm3",
    "indexid": "xMUiJqM6JzyBZ3rNbYfnNTyNhKrLEbbAy6",
    "hash160result": "c1e17b8a68c7238fc479638a4ea90a09887a8190",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.address"
    }
};
exports.IDENTITYDATA_ADDRESS_STREET1 = {
    "vdxfid": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj",
    "indexid": "xNUFncPpokjWp66awDFYo1m4UPLA8ubaiB",
    "hash160result": "b66f8fe85cc09f7df77e3a0af34bb10b3a77639b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.address.street1"
    }
};
exports.IDENTITYDATA_ADDRESS_STREET2 = {
    "vdxfid": "i3h8D5kGtn6DCVCwPFvbypbFCqfzAhXiD2",
    "indexid": "x8XEftBMk6Jspf5yEwakxD7nEVh12MU6qD",
    "hash160result": "c156ac2c6f101631e348f95b6fca8ad063056202",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.address.street2"
    }
};
exports.IDENTITYDATA_ADDRESS_CITY = {
    "vdxfid": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD",
    "indexid": "xM76PTRnxBRkvg1i4D1PKocd4n3RqY3CFe",
    "hash160result": "b03fee48a0694abcf0e26aeee63386a538c26a8c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.address.city"
    }
};
exports.IDENTITYDATA_ADDRESS_REGION = {
    "vdxfid": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x",
    "indexid": "xCkRVkwGGxUE335WrtVKzFEV4EZ3XYsk9g",
    "hash160result": "b838dcdca8dd93524a9bbeb4a551d41be3f7c030",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.address.region"
    }
};
exports.IDENTITYDATA_ADDRESS_POSTCODE = {
    "vdxfid": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC",
    "indexid": "xVQLwJNgMdU7oRYzDBi9Qj5sPwC4vbkTUi",
    "hash160result": "2ee05285375ce5e909eb31e5c08d042231fb6ee7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.address.postcode"
    }
};
exports.IDENTITYDATA_ADDRESS_COUNTRY = {
    "vdxfid": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK",
    "indexid": "xTi8RLedRrhDrkgbcdyrpPZmtNvpSJTWGw",
    "hash160result": "fafe1c0c79889407ed4172586eb02bf3c6c4dbd4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.address.country"
    }
};
exports.IDENTITYDATA_NATIONALITY = {
    "vdxfid": "iDKfQZ4c568VzuikNenCNKffhx3f5pMNvi",
    "indexid": "xJ9msMVgvQMAd5bnELSMLiCCjc4g2ZP2rB",
    "hash160result": "a44ddb762301e0b405741f9b50dae55a9a2b046c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.nationality"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_MATCHED = {
    "vdxfid": "iJTvN7XURWKFabj9tzvRJxmctcAMk3D9Hk",
    "indexid": "xPJ2puxZGpXvCmcBkgaaHMJ9vGBNfo83vX",
    "hash160result": "5dfba519a35dbb63e0a12e071b47b4b2f99c6ca4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.matched"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_NAME_MATCHED = {
    "vdxfid": "iKCFQYZudPChh6jypSpcgENoQb5WeX5wHv",
    "indexid": "xQ2MsLzzUhRNKGd1g8UmecuLSF6XcYynDa",
    "hash160result": "0d02d8dce6be6e0b4c87efdac286f3739efa6dac",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.name.matched"
    }
};
exports.IDENTITYDATA_DOCUMENTVERIFICATION_DATEOFBIRTHMATCHED = {
    "vdxfid": "iMUfUShqVwWrGSx6HvZcDJwHywiLW5Zusb",
    "indexid": "xSJmwF8vMFjWtcq89cDmBhTq1bjMRkFKEg",
    "hash160result": "3467c9e6461d44959372367130363b01ebf978c5",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documentverification.dateofbirthmatched"
    }
};
exports.IDENTITYDATA_NAME = {
    "vdxfid": "iNtCaMhqbpwGubHkaepi9mhVFg8jPj2Sk4",
    "indexid": "xTiK3A8vT99wXmAnSLUs8AE2HL9kKfRmzC",
    "hash160result": "272c6f542e769f1006ee6db29be51ddbbaa1e4d4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.name"
    }
};
exports.IDENTITYDATA_PERSONAL_DETAILS = {
    "vdxfid": "iDeQpqFQNNxQaTGDJd762poXE9eCBNEELD",
    "indexid": "xJUXHdgVDhB5Cd9FAJmF1DL4FofD5W44Wa",
    "hash160result": "78d7089e964a3f6e6ae0233346554555d3e68f6f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.personaldetails"
    }
};
exports.IDENTITYDATA_CONTACT = {
    "vdxfid": "iPHGUT7FpBbUjBKoPiuwTCzVFtcbQfkrs4",
    "indexid": "xU7NwFYLfVp9MMCqFQa6RbX2HYdcGVBu6v",
    "hash160result": "cef7d037aa9c9342008cc13ea0173610f17341d9",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.contactdetails"
    }
};
exports.IDENTITYDATA_LOCATIONS = {
    "vdxfid": "iREAoeQFDuJA751i86EBWmDthRuZoGEKBi",
    "indexid": "xW4HGSqL5DWpjEtjymtLV9kRj5vaeyFTX7",
    "hash160result": "e89b7bc01f7fececa737c5451a6889006bb99bee",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.locationdetails"
    }
};
exports.IDENTITYDATA_BANKING_INFORMATION = {
    "vdxfid": "iJPS5WjFmKhjJjNxA2m2CJUus8swyBSTWy",
    "indexid": "xPDYYKALcdvPvuFz1iRBAh1StntxrcEUeM",
    "hash160result": "1a79f042ce08168d0dcaf4b1062eb1e3525693a3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankingdetails"
    }
};
exports.IDENTITYDATA_DOCUMENTS_AND_IMAGES = {
    "vdxfid": "iDqUNrjpcHvenVoJUzkWxeo93txZJLRMsY",
    "indexid": "xJfaqfAuTc9KQfgLLgQfw3Kg5Yya97dwwF",
    "hash160result": "b93a86e345efacfa4cdd5ab1a07f41da4371a771",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.documents"
    }
};
exports.PERSONAL_INFO_OBJECT = {
    "vdxfid": "i6BFmbneE8TJHego8AkeX1iYMbQ4KXHLr9",
    "indexid": "xB1NEQDj5SfxupZpyrQoVQF5PFR5Foqja6",
    "hash160result": "50b7fa643e4b024ffbcaabd40403d22e1a3ba41d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.personalinfo"
    }
};
exports.FIAT_CURRENCEY = {
    "vdxfid": "i8sgE4s24ZZE9ts4MiYbWpng419T8a5yfW",
    "indexid": "xDhngsJ6usmtn4k6DQCkVDKD5fATwqdYBr",
    "hash160result": "f24235e62affcb4c57faecc6d0e3b3893889393b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.fiatcurrency"
    }
};
exports.BANK_ACCOUNT = {
    "vdxfid": "i7QCof7PM8unmLKefzRKokd6oHtkRN5NK4",
    "indexid": "xCEKGTYUCT8TPWCgXg5Un99dpwumKZ9uek",
    "hash160result": "c34f89a8cd8b6a32848632597ea0bd111c4a0f2b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    }
};
exports.BANK_ACCOUNT_CURRENCY = {
    "vdxfid": "iJdQpLtdyAgiRfoJstY8utsY5wEQZdM91y",
    "indexid": "xPTXH9KipUuP3qgLjaCHtHQ57bFRREieor",
    "hash160result": "2d60e910979af52ce62167b5ec5224858a1b38a6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "i8sgE4s24ZZE9ts4MiYbWpng419T8a5yfW"
    }
};
exports.BANK_ACCOUNT_COUNTRY = {
    "vdxfid": "iLcX5aezEdeeX63ZAk1fzh1qBVc5gr3hyT",
    "indexid": "xRSdYP655wsK9Fvb2Rfpy5YND9d6Z9EL9o",
    "hash160result": "0939ad4a2dcb7c1030a2f4efd046a818c92bfdbb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iNt1xYDYaYUZEaoZkxKhr13EriuoWiwcxK"
    }
};
exports.BANK_ACCOUNT_STREET1 = {
    "vdxfid": "iDzy4tzp8CQqG4fh4qwyhjeM1EDgZvauwy",
    "indexid": "xJq5XhRtyWdVtEYivXc8g8At2tEhSpargH",
    "hash160result": "93a2d4461521cffba345fe384c86561fb5227373",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iHe9KoxjxSWrBvDZ5XbPpdEXSjK9DoWALj"
    }
};
exports.BANK_ACCOUNT_STREET2 = {
    "vdxfid": "iMf5baQkrp6EuacyScGu3vQ7EHt4vSiUsz",
    "indexid": "xSVC4Nqqi8JuXkW1JHw42JveFwu5qj1Gkv",
    "hash160result": "d3da8b39e046268d93d25d6b9f780950d04571c7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "i3h8D5kGtn6DCVCwPFvbypbFCqfzAhXiD2"
    }
};
exports.BANK_ACCOUNT_CITY = {
    "vdxfid": "iBgQ4ev7sBd1FodofzgyfEriHWQw6phnwm",
    "indexid": "xGWWXTMCiVqfsyWqXgM8ddPFKARx1ok9eq",
    "hash160result": "aad5a1798ce03abfbe5166989f9bade19fd8ff59",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iGGyvezi6sD6JW8gCXMEMR66382QvEPXHD"
    }
};
exports.BANK_ACCOUNT_REGION = {
    "vdxfid": "iE2HNu3NkhUpFanwjq7z3K14pSKCVh2Yku",
    "indexid": "xJrPqhUTc1hUskfybWn91hXbr6LDLwguv5",
    "hash160result": "f8b4b7681f399f4ce6f77b16a3034cd014d6b273",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "i7vK2xWBReFZQsCV1CqB1rhx2aY2eGyo9x"
    }
};
exports.BANK_ACCOUNT_POSTALCODE = {
    "vdxfid": "iEnvTt4zt1iXttDpDCcqvfNYhbReBSeGoa",
    "indexid": "xKd2vgW5jKwCX46r4tGzu3u5jFSf33Qv7t",
    "hash160result": "23439436b34068051f5dfdaf133ae7ada918247c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iQaEUVwbWKFTBFfxMW3zSLZLNHB43r15qC"
    }
};
exports.BANK_ACCOUNT_TAXNUMBER = {
    "vdxfid": "iLZMhFEyg2BysiG8eQabdeGYLpNRzWUvVG",
    "indexid": "xRPUA3g4XLQeVt9AW6Ekc2o5NUPSxw2wvq",
    "hash160result": "fa32239bcdc55780096b55ce3e7ae9ddc01664bb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.taxnumber"
    }
};
exports.BANK_ACCOUNT_TAXCOUNTRY = {
    "vdxfid": "iNfhYoUGzruHxihV5dYSYnsruD4STZaKvF",
    "indexid": "xTVp1buMrB7xataWwKCbXBQPvs5TN85VEX",
    "hash160result": "c0728dd8a0644b69a990c7cddc133a8aeb6887d2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.taxcountry"
    }
};
exports.BANK_ACCOUNT_FIRSTNAME = {
    "vdxfid": "iLaKzdEJgoztyM5f9YnLoGBPQYpq3d6FxF",
    "indexid": "xRQSTRfPY8DZbWxh1ESVmehvSCqqw8EGSr",
    "hash160result": "25041a54186ca5d8c277e7a1a498c33fe01593bb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "i4GqsotHGa4czCdtg2d8FVHKfJFzVyBPrM"
    }
};
exports.BANK_ACCOUNT_LASTNAME = {
    "vdxfid": "iR2fNBYnQDAgfU2BxvC7c4CJQPRY7LXAzm",
    "indexid": "xVrmpyysFXPMHduDpbrGaSiqS3SYznwXmR",
    "hash160result": "c4b8f6772ae63a6265c814ebf1637f6902936eec",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iHybTrNB1kXRrjsCtJXd6fvBKxepqMpS5Z"
    }
};
exports.BANK_ACCOUNT_PHONENUMBER = {
    "vdxfid": "iNNkwqvht83J1HZyopGaqVXKMAzTQkj9zM",
    "indexid": "xTCsQeMnjSFxdTT1fVvjot3rNq1UHrb19r",
    "hash160result": "95d0bc46ca38214dcca8220507da3295a52c53cf",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "i9ZQ5degEh3wQg5vNm8Tod88bcJBrLs5p3"
    }
};
exports.ACCOUNT_NUMBER = {
    "vdxfid": "iS6TbNSaquK5uDZemFF9DLP6K6ZciN6TBd",
    "indexid": "xWva4AsfhDXkXPSgcvuJBiudLkadg3ZHt5",
    "hash160result": "8b15e73e57238a3dc6bcb31b368328495e891ef8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.accountnumber"
    }
};
exports.ACCOUNT_TYPE = {
    "vdxfid": "iNdRtUasuiojMC2sw35Nbs4W6hq7o8bWqY",
    "indexid": "xTTYMH1xm32PyMuunijXaFb38Mr8ipmsky",
    "hash160result": "b1d14abf13ce26753676953ec88c00ad448119d2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.accounttype"
    }
};
exports.BANK_ACCOUNT_NUMBER = {
    "vdxfid": "i64P8QWcucELMgrq1uxY7uKCq3eymRcwaQ",
    "indexid": "xAtVbCwhkvSzyrjrsbch6Hqjrhfzdz82YM",
    "hash160result": "240b1dd30e88528bc9307d3158ccb5fb3d76571c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iS6TbNSaquK5uDZemFF9DLP6K6ZciN6TBd"
    }
};
exports.BANK_ACCOUNT_TYPE = {
    "vdxfid": "iLMsPy8GhsGSNDzXDpZ8SEcymJfgGrLUVj",
    "indexid": "xRByrmZMZBV6zPsZ5WDHQd9Wnxgh8bD1RJ",
    "hash160result": "faf99925bc81dc052b9deb8c3321965633e437b9",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identitydata.bankaccount"
    },
    "bounddata": {
        "vdxfkey": "iNdRtUasuiojMC2sw35Nbs4W6hq7o8bWqY"
    }
};

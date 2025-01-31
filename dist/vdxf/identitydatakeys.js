"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTITY_DRIVINGLICENCE_FACE = exports.IDENTITY_DRIVINGLICENCE_CROPPEDBACK = exports.IDENTITY_DRIVINGLICENCE_CROPPEDFRONT = exports.IDENTITY_DRIVINGLICENCE_ORIGINALBACK = exports.IDENTITY_DRIVINGLICENCE_ORIGINALFRONT = exports.IDENTITY_DRIVINGLICENCE = exports.IDENTITY_VERIFICATION_APPROVALS_STATUS = exports.IDENTITY_VERIFICATION_APPROVALS_RISKCHECKOK = exports.IDENTITY_VERIFICATION_APPROVALS_WATCHLISTOK = exports.IDENTITY_VERIFICATION_APPROVALS_SELFIECHECKED = exports.IDENTITY_VERIFICATION_APPROVALS_DOCUMENTSVERIFIED = exports.IDENTITY_VERIFICATION_APPROVALS_KYCCHECKED = exports.IDENTITY_VERIFICATION_APPROVALS_VERIFIEDSMS = exports.IDENTITY_VERIFICATION_APPROVALS_ACCEPTEDTOS = exports.IDENTITY_VERIFICATION_APPROVALS = exports.IDENTITY_VERIFICATION_STATUS = exports.IDENTITY_IDNUMBER_TYPE = exports.IDENTITY_IDNUMBER_VALUE = exports.IDENTITY_HOMEADDRESS_COUNTRY = exports.IDENTITY_HOMEADDRESS_POSTCODE = exports.IDENTITY_HOMEADDRESS_REGION = exports.IDENTITY_HOMEADDRESS_CITY = exports.IDENTITY_HOMEADDRESS_STREET2 = exports.IDENTITY_HOMEADDRESS_STREET1 = exports.IDENTITY_HOMEADDRESS = exports.IDENTITY_WEIGHT = exports.IDENTITY_ETHNICITY = exports.IDENTITY_EYECOLOR = exports.IDENTITY_HEIGHT = exports.IDENTITY_GENDER = exports.IDENTITY_LASTNAME = exports.IDENTITY_MIDDLENAME = exports.IDENTITY_FIRSTNAME = exports.IDENTITY_NATIONALITY = exports.IDENTITY_EMAIL = exports.IDENTITY_ACCOUNT_REQUESTING_IPADDRESS = exports.IDENTITY_OVER25 = exports.IDENTITY_OVER21 = exports.IDENTITY_OVER18 = exports.IDENTITY_DATEOFBIRTH = exports.IDENTITY_PHONENUMBER = exports.IDENTITY_ACCOUNT_STATUS = exports.IDENTITY_ACCOUNT_TEMPLATEVERSION = exports.IDENTITY_ACCOUNT_TEMPLATEID = exports.IDENTITY_ACCOUNT_SHAREABLEURL = exports.IDENTITY_ACCOUNT_PREVIOUSATTEMPTID = exports.IDENTITY_ACCOUNT_COMPLETEDAT = exports.IDENTITY_ACCOUNT_CREATEDAT = exports.IDENTITY_ACCOUNT_USERID = exports.IDENTITY_ACCOUNT_ID = void 0;
exports.IDENTITY_RESIDENCEPERMIT_ISSUINGREGION = exports.IDENTITY_RESIDENCEPERMIT_ISSUINGCOUNTRY = exports.IDENTITY_RESIDENCEPERMIT_EXPIRATIONDATE = exports.IDENTITY_RESIDENCEPERMIT_CATEGORY = exports.IDENTITY_RESIDENCEPERMIT_IDNUMBER = exports.IDENTITY_RESIDENCEPERMIT_FACE = exports.IDENTITY_RESIDENCEPERMIT_CROPPEDBACK = exports.IDENTITY_RESIDENCEPERMIT_CROPPEDFRONT = exports.IDENTITY_RESIDENCEPERMIT_ORIGINALBACK = exports.IDENTITY_RESIDENCEPERMIT_ORIGINALFRONT = exports.IDENTITY_RESIDENCEPERMIT = exports.IDENTITY_PASSPORT_ADDRESS_COUNTRY = exports.IDENTITY_PASSPORT_ADDRESS_POSTCODE = exports.IDENTITY_PASSPORT_ADDRESS_REGION = exports.IDENTITY_PASSPORT_ADDRESS_CITY = exports.IDENTITY_PASSPORT_ADDRESS_STREET1 = exports.IDENTITY_PASSPORT_DATEOFBIRTH = exports.IDENTITY_PASSPORT_ISSUINGREGION = exports.IDENTITY_PASSPORT_ISSUINGCOUNTRY = exports.IDENTITY_PASSPORT_EXPIRATIONDATE = exports.IDENTITY_PASSPORT_CATEGORY = exports.IDENTITY_PASSPORT_IDNUMBER = exports.IDENTITY_PASSPORT_FACE = exports.IDENTITY_PASSPORT_CROPPEDBACK = exports.IDENTITY_PASSPORT_CROPPEDFRONT = exports.IDENTITY_PASSPORT_ORIGINALBACK = exports.IDENTITY_PASSPORT_ORIGINALFRONT = exports.IDENTITY_PASSPORT = exports.IDENTITY_EMAIL_DOMAIN_TOPLEVEL_SUSPICIOUS = exports.IDENTITY_EMAIL_DOMAIN_DISPOSABLE = exports.IDENTITY_EMAIL_DOMAIN_CUSTOM = exports.IDENTITY_EMAIL_DOMAIN_FREEPROVIDER = exports.IDENTITY_EMAIL_DOMAIN_REGISTEREDAT = exports.IDENTITY_EMAIL_LASTBREACHEDAT = exports.IDENTITY_EMAIL_FIRSTBREACHEDAT = exports.IDENTITY_EMAIL_BREACHCOUNT = exports.IDENTITY_EMAIL_ISDELIVERABLE = exports.IDENTITY_SELFIECHECK_VIDEO = exports.IDENTITY_SELFIECHECK_IMAGE = exports.IDENTITY_DRIVINGLICENCE_ADDRESS_COUNTRY = exports.IDENTITY_DRIVINGLICENCE_ADDRESS_POSTCODE = exports.IDENTITY_DRIVINGLICENCE_ADDRESS_REGION = exports.IDENTITY_DRIVINGLICENCE_ADDRESS_CITY = exports.IDENTITY_DRIVINGLICENCE_ADDRESS_STREET1 = exports.IDENTITY_DRIVINGLICENCE_DATEOFBIRTH = exports.IDENTITY_DRIVINGLICENCE_ISSUINGREGION = exports.IDENTITY_DRIVINGLICENCE_ISSUINGCOUNTRY = exports.IDENTITY_DRIVINGLICENCE_EXPIRATIONDATE = exports.IDENTITY_DRIVINGLICENCE_CATEGORY = exports.IDENTITY_DRIVINGLICENCE_IDNUMBER = void 0;
exports.IDENTITY_VISA_EXPIRATIONDATE = exports.IDENTITY_VISA_CATEGORY = exports.IDENTITY_VISA_IDNUMBER = exports.IDENTITY_VISA_FACE = exports.IDENTITY_VISA_CROPPEDBACK = exports.IDENTITY_VISA_CROPPEDFRONT = exports.IDENTITY_VISA_ORIGINALBACK = exports.IDENTITY_VISA_ORIGINALFRONT = exports.IDENTITY_VISA = exports.IDENTITY_IDCARD_ADDRESS_COUNTRY = exports.IDENTITY_IDCARD_ADDRESS_POSTCODE = exports.IDENTITY_IDCARD_ADDRESS_REGION = exports.IDENTITY_IDCARD_ADDRESS_CITY = exports.IDENTITY_IDCARD_ADDRESS_STREET1 = exports.IDENTITY_IDCARD_DATEOFBIRTH = exports.IDENTITY_IDCARD_ISSUINGREGION = exports.IDENTITY_IDCARD_ISSUINGCOUNTRY = exports.IDENTITY_IDCARD_EXPIRATIONDATE = exports.IDENTITY_IDCARD_CATEGORY = exports.IDENTITY_IDCARD_IDNUMBER = exports.IDENTITY_IDCARD_FACE = exports.IDENTITY_IDCARD_CROPPEDBACK = exports.IDENTITY_IDCARD_CROPPEDFRONT = exports.IDENTITY_IDCARD_ORIGINALBACK = exports.IDENTITY_IDCARD_ORIGINALFRONT = exports.IDENTITY_IDCARD = exports.IDENTITY_RESIDENTCARD_ADDRESS_COUNTRY = exports.IDENTITY_RESIDENTCARD_ADDRESS_POSTCODE = exports.IDENTITY_RESIDENTCARD_ADDRESS_REGION = exports.IDENTITY_RESIDENTCARD_ADDRESS_CITY = exports.IDENTITY_RESIDENTCARD_ADDRESS_STREET1 = exports.IDENTITY_RESIDENTCARD_DATEOFBIRTH = exports.IDENTITY_RESIDENTCARD_ISSUINGREGION = exports.IDENTITY_RESIDENTCARD_ISSUINGCOUNTRY = exports.IDENTITY_RESIDENTCARD_EXPIRATIONDATE = exports.IDENTITY_RESIDENTCARD_CATEGORY = exports.IDENTITY_RESIDENTCARD_IDNUMBER = exports.IDENTITY_RESIDENTCARD_FACE = exports.IDENTITY_RESIDENTCARD_CROPPEDBACK = exports.IDENTITY_RESIDENTCARD_CROPPEDFRONT = exports.IDENTITY_RESIDENTCARD_ORIGINALBACK = exports.IDENTITY_RESIDENTCARD_ORIGINALFRONT = exports.IDENTITY_RESIDENTCARD = exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_COUNTRY = exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_POSTCODE = exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_REGION = exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_CITY = exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_STREET1 = exports.IDENTITY_RESIDENCEPERMIT_ADDRESS = exports.IDENTITY_RESIDENCEPERMIT_DATEOFBIRTH = void 0;
exports.IDENTITY_ATTESTATION_RECIPIENT = exports.IDENTITY_ATTESTOR = exports.IDENTITY_RESIDENCECARD = exports.IDENTITY_DOCUMENTS_PASSPORT = exports.IDENTITY_BANKINGDETAILS_SORTCODE = exports.IDENTITY_BANKINGDETAILS_TYPE = exports.IDENTITY_BANKINGDETAILS_NUMBER = exports.IDENTITY_BANKINGDETAILS_PHONENUMBER = exports.IDENTITY_BANKINGDETAILS_LASTNAME = exports.IDENTITY_BANKINGDETAILS_FIRSTNAME = exports.IDENTITY_BANKINGDETAILS_TAXCOUNTRY = exports.IDENTITY_BANKINGDETAILS_TAXNUMBER = exports.IDENTITY_BANKINGDETAILS_POSTALCODE = exports.IDENTITY_BANKINGDETAILS_REGION = exports.IDENTITY_BANKINGDETAILS_CITY = exports.IDENTITY_BANKINGDETAILS_STREET2 = exports.IDENTITY_BANKINGDETAILS_STREET1 = exports.IDENTITY_BANKINGDETAILS_COUNTRY = exports.IDENTITY_BANKINGDETAILS_CURRENCY = exports.IDENTITY_BANKACCOUNT = exports.IDENTITY_DOCUMENTS = exports.IDENTITY_BANKINGDETAILS = exports.IDENTITY_LOCATION = exports.IDENTITY_CONTACTDETAILS = exports.IDENTITY_PERSONALDETAILS = exports.IDENTITY_VISA_ADDRESS_COUNTRY = exports.IDENTITY_VISA_ADDRESS_POSTCODE = exports.IDENTITY_VISA_ADDRESS_REGION = exports.IDENTITY_VISA_ADDRESS_CITY = exports.IDENTITY_VISA_ADDRESS_STREET1 = exports.IDENTITY_VISA_DATEOFBIRTH = exports.IDENTITY_VISA_ISSUINGREGION = exports.IDENTITY_VISA_ISSUINGCOUNTRY = void 0;
exports.IDENTITY_ACCOUNT_ID = {
    "vdxfid": "i5Xgd7Aqds922eE8FDBUsKHSgiig39AnfS",
    "indexid": "xAMo5ubvVBMgep7A6tqdqhoyiNjgq3j1ci",
    "hash160result": "4c5e79bf46593fe959cb1918422eaa8fc82b8916",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.id"
    }
};
exports.IDENTITY_ACCOUNT_USERID = {
    "vdxfid": "iNKVUvr5GzdCHgybMauK11DdZZUyWE3pe3",
    "indexid": "xT9bwjHA8JqrurrdDGZTyPkAbDVzR53C2o",
    "hash160result": "93b62bfd8c861ac7a5aa3d3d9f618ccd8c04b5ce",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.userid"
    }
};
exports.IDENTITY_ACCOUNT_CREATEDAT = {
    "vdxfid": "i42uTbJmVBcPacY3Ak1g95LBg5rBBntQby",
    "indexid": "x8s1vPjrLVq4CnR52Rfq7TrihjsBzxAEic",
    "hash160result": "c40b12b14582c976e67a2e5992b0fdf67fb21f06",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.createdat"
    }
};
exports.IDENTITY_ACCOUNT_COMPLETEDAT = {
    "vdxfid": "iRJTZj7osY5EYA7pd7K3UcJVAApkvodDjZ",
    "indexid": "xW8a2XYtirHuAKzrUnyCSzq2BpqmpCnnHQ",
    "hash160result": "c568b6e1f734f5dc9b754e5932ebdb63f2606bef",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.completedat"
    }
};
exports.IDENTITY_ACCOUNT_PREVIOUSATTEMPTID = {
    "vdxfid": "iGU6RCWyjU1sscCPLN77XhTESJ21JCTNxF",
    "indexid": "xMJCszx4anEYVn5RC3mGW5ymTx32EBfaqs",
    "hash160result": "50c2b12bb483802d14beae3c6b7454c6ecc0848e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.previousattemptid"
    }
};
exports.IDENTITY_ACCOUNT_SHAREABLEURL = {
    "vdxfid": "i92YkV3FVGZfp5Ep3j1sfQUgqUS37M9v82",
    "indexid": "xDrfDHULLanLSF7quQg2do1Ds8T3yGCRw3",
    "hash160result": "52e9f990e5e89cc1088acd29a2fda0ef140ae73c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.shareableurl"
    }
};
exports.IDENTITY_ACCOUNT_TEMPLATEID = {
    "vdxfid": "iL5diuVsHAG5DLVeyc8XYdEXR6fFro5G7s",
    "indexid": "xQukBhvx8UUjqWNgqHngX1m4SkgGhnybh1",
    "hash160result": "37ef653fe6685fca132d77834384702f6cd225b6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.templateid"
    }
};
exports.IDENTITY_ACCOUNT_TEMPLATEVERSION = {
    "vdxfid": "i7eBZNzKrgFov6c2Sx2QecyEmPq2Mc4BGe",
    "indexid": "xCUJ2BRQhzUUYGV4JdgZd1Vmo3r39BsUym",
    "hash160result": "e6e490ce8bfde333ab0374880ea0efbb9c12b42d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.templateversion"
    }
};
exports.IDENTITY_ACCOUNT_STATUS = {
    "vdxfid": "iJf3EbihEtdEpJjbQ6PgUaL3GxDgZRzSWk",
    "indexid": "xPV9hQ9n6CquSUcdFn3qSxraJcEhVfWa72",
    "hash160result": "d6fc5578c2fbed3251f3aa250c73b58386ec86a6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.status"
    }
};
exports.IDENTITY_PHONENUMBER = {
    "vdxfid": "iAQY8o4HwupzcJAw9aBtFwgrvWZGQStkge",
    "indexid": "xFEebbVNoE3fEU3y1Fr3ELDPxAaHE7V2kN",
    "hash160result": "32bc2c7919f626c39679630ee4d6d6d07bcd074c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.phonenumber"
    }
};
exports.IDENTITY_DATEOFBIRTH = {
    "vdxfid": "iSZsa7C4esogN3W6fBngUHR6GvSmt7We4j",
    "indexid": "xXPz2ud9WC2LzDP8WsSqSfwdJaTnqpHdND",
    "hash160result": "ab74371e952a27f615b079d3c084b38b98c84dfd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.dateofbirth"
    }
};
exports.IDENTITY_OVER18 = {
    "vdxfid": "iHPD8vB7jhtbuqPkUqzheqcZdfAfHUFVzM",
    "indexid": "xNDKbicCb27GY1GnLXerdE96fKBg9tLUDT",
    "hash160result": "28139ce1eae370e76f749066f778466597689098",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.over18"
    }
};
exports.IDENTITY_OVER21 = {
    "vdxfid": "iAXYYrZaipc4DAmAKXUFYZxavsf6uBJqaj",
    "indexid": "xFMf1ezfa8piqLeCBD8QWxV7xXg7mxMc1Z",
    "hash160result": "7a1fee70ace1c048c0a93c120a8a4c5f890f5b4d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.over21"
    }
};
exports.IDENTITY_OVER25 = {
    "vdxfid": "iDuForPTZFeFBAgDX1HyrP3d6of7wzrRaS",
    "indexid": "xJjNGepYQZruoLZFNgx8pmaA8Tg8qSfnzM",
    "hash160result": "2a1e6fa6913ea3659dcaf1c5bc20a96e399d5e72",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.over25"
    }
};
exports.IDENTITY_ACCOUNT_REQUESTING_IPADDRESS = {
    "vdxfid": "i4uE1EvnDbq9WGhF5UbBr6fbxNLsgk1eZ3",
    "indexid": "x9jLU3Ms4v3p8SaGwAFLpVC8z2MtYJTVwp",
    "hash160result": "05a3aa58192812972a2c4e4184af7bb5fbf9a30f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.account.requesting.ipaddress"
    }
};
exports.IDENTITY_EMAIL = {
    "vdxfid": "iJ4pq4DCymfbu8SAuXyNhasLeSHFNKPr23",
    "indexid": "xNtwHreHq5tGXJKCmDdXfyPsg6JGHUY6X1",
    "hash160result": "15a8095b6298bbff5147060d9a6363a9df6c0ea0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email"
    }
};
exports.IDENTITY_NATIONALITY = {
    "vdxfid": "iEUYNTkw6kFhZWto7vyTpQqtdRL7eoKZY2",
    "indexid": "xKJeqGC1x4UNBgmpycdcnoNRf5M8btexbt",
    "hash160result": "db935713b90281d6aefe5e7b33e5b660962aaa78",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.nationality"
    }
};
exports.IDENTITY_FIRSTNAME = {
    "vdxfid": "iLB8SG7ErJtTYcG1f4w9RLuMJPpAsjFkiL",
    "indexid": "xR1Eu4YKhd78An93WkbJPjRtL3qBprmMno",
    "hash160result": "0bab76359b70b37c858399c2a3776939c5de2fb7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.firstname"
    }
};
exports.IDENTITY_MIDDLENAME = {
    "vdxfid": "iHG6ALRUPyRcgJMsPqBmvUCZxe4PrMfgej",
    "indexid": "xN6Cd8rZFHeHJUEuFWqvtrj6zJ5QjX94j5",
    "hash160result": "b98bd82034ec86ae5538313c9f5501c086ac3797",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.middlename"
    }
};
exports.IDENTITY_LASTNAME = {
    "vdxfid": "iKRmfy4xgjWQyPdXYie6dJezRXF4aKdbHB",
    "indexid": "xQFt8mW3Y3j5bZWZQQJFbhBXTBG5S4vdaZ",
    "hash160result": "6b597e0c05d1430566b7b17a59da683fb4a6fcae",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.lastname"
    }
};
exports.IDENTITY_GENDER = {
    "vdxfid": "iShgSBdiYDQnVwgNcDnSbNYHGU6CTwBDb1",
    "indexid": "xXXntz4oPXdT87ZQTuSbZm4pJ87DGEgHpG",
    "hash160result": "3baee594e927d47b641c7cf3927ab3229dd0c7fe",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.gender"
    }
};
exports.IDENTITY_HEIGHT = {
    "vdxfid": "iLmLmsFMTUm4dd2iMuMe4xaMC8VSZN9soP",
    "indexid": "xRbTEfgSJnyjFnukDb1o3M6tDnWTSUiii7",
    "hash160result": "e80652253fa52b95cd9ea5ff43d51642ea4fa8bd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.height"
    }
};
exports.IDENTITY_EYECOLOR = {
    "vdxfid": "iRo2XT8tcMtLTpuPJ6V5WxbnVWa2CrcdsJ",
    "indexid": "xWd8zFZyTg715znR9n9EVM8KXAb328xGbZ",
    "hash160result": "c60fdfcc04173f273aa92a3b1844964b368ad2f4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.eyecolor"
    }
};
exports.IDENTITY_ETHNICITY = {
    "vdxfid": "i9jHPJokwnLoCQ83P6jqezCcEZUD1g34B9",
    "indexid": "xEZPr7Eqo6ZTpa15EnPzdNj9GDVDsfToki",
    "hash160result": "0476d568a9cf949bc8b6d84dc73e38cf85449b44",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.ethnicity"
    }
};
exports.IDENTITY_WEIGHT = {
    "vdxfid": "iMzGK44r6SNkzi3N3AmcZBtuysPvgYiRiT",
    "indexid": "xSpNmrVvwkbRcsvPtrRmXaRT1XQwXFe2Ut",
    "hash160result": "8abe0e94cb1ff345f1351720acc8eefed91e12cb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.weight"
    }
};
exports.IDENTITY_HOMEADDRESS = {
    "vdxfid": "i9A1fD5sVwFFXzEmCJWSRDqN94PXp9oNaS",
    "indexid": "xDz881WxMFTvAA7o3zAbPcMuAiQYiT4Vnc",
    "hash160result": "072a3abed3a353e001288074d9426285e569503e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress"
    }
};
exports.IDENTITY_HOMEADDRESS_STREET1 = {
    "vdxfid": "i5BJAwQbrP4Bht8gUpoqSrovuBwfRc6jiv",
    "indexid": "xA1QdjqghhGrL41iLWTzRFLTvqxgNsVzXY",
    "hash160result": "ff22b196e64c9388daab76a57bcaea50491cae12",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress.street1"
    }
};
exports.IDENTITY_HOMEADDRESS_STREET2 = {
    "vdxfid": "iMx71C14hrBoWD3yyhYChmhJEw4Kqw1zj4",
    "indexid": "xSnDTzS9ZAQU8Nw1qPCMgADqGb5Lgqb4zw",
    "hash160result": "efdda473a6a9e98cd91b02d36bfeb5dec784a9ca",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress.street2"
    }
};
exports.IDENTITY_HOMEADDRESS_CITY = {
    "vdxfid": "i75ZpW5T6wgQEMVxyvqHT9ZaV4fjsQ7kws",
    "indexid": "xBugHJWXxFu4rXNzqcVSRY67WigkoCUEUQ",
    "hash160result": "fcae40d5d327f13dc0e0c1e80f3db212a4ed8827",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress.city"
    }
};
exports.IDENTITY_HOMEADDRESS_REGION = {
    "vdxfid": "iRkYck3JowdFWmrM6VUAS8Wtpmxds2fLXS",
    "indexid": "xWaf5YUPfFqv8wjNxB8KQX3RrRyenbioh5",
    "hash160result": "fa06b90a547658a3efc3cd1797d6b3cd30695af4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress.region"
    }
};
exports.IDENTITY_HOMEADDRESS_POSTCODE = {
    "vdxfid": "iAL2FRG8PVi18fN8MatjXhV1YkuZr7PM4T",
    "indexid": "xFA8iDhDEovfkqFADGYtW61YaQvahtrhJA",
    "hash160result": "b4f4c3a08fdcf32209482fa3d8c7b01201312d4b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress.postcode"
    }
};
exports.IDENTITY_HOMEADDRESS_COUNTRY = {
    "vdxfid": "iABYGvas6uUDk9ejCkfCVLvE9PPJXgyCKX",
    "indexid": "xF1ejj1wxDgtNKXm4SKMTjSmB3QKL8LhQG",
    "hash160result": "bafb2cb6d5cc86478622feb8a00097d71d839249",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.homeaddress.country"
    }
};
exports.IDENTITY_IDNUMBER_VALUE = {
    "vdxfid": "iQrnvbCNWMaG6PjTmeXzrcuAXKsMzmNJWA",
    "indexid": "xVguPPdTMfnviZcVdLC9q1RhYytNuZ3ToS",
    "hash160result": "72cf52b2f6b4f68173c933fb046e892870b990ea",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idnumber.value"
    }
};
exports.IDENTITY_IDNUMBER_TYPE = {
    "vdxfid": "iSSZX5yUdQh7zLf1gUewH5rVfbXtSq2c4s",
    "indexid": "xXGfytQZUiuncWY3YAK6FUP2hFYuQ4yYwW",
    "hash160result": "2807f356d687b4c6208ce0379b31043c7fcdebfb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idnumber.type"
    }
};
exports.IDENTITY_VERIFICATION_STATUS = {
    "vdxfid": "i8MhqW3ejupmV1M5UyhyhG13dkS8A7g7zg",
    "indexid": "xDBpJJUjbE3S7BE7LfN8feXafQT92YQZPm",
    "hash160result": "47f2864de74ffe01ccb7eeabf0f2d848e3668e35",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.status"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS = {
    "vdxfid": "iBMkZtqC9yqVrFL4GfYtXckFpYAhRkE2mj",
    "indexid": "xGBs2hGH1J4AURD68MD3W1GnrCBiJ3nRgG",
    "hash160result": "a98801de1ba5ff5e571dbdde50519483140f7956",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_ACCEPTEDTOS = {
    "vdxfid": "iH32QkXBKyWEJD6kh9HJ4KMfeiWfPWoHEh",
    "indexid": "xMs8sYxGBHitvNynYpwT2htCgNXgHt6VAW",
    "hash160result": "bbe4c09ae069561d3c14b04e3b7b96c98622bf94",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.acceptedtos"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_VERIFIEDSMS = {
    "vdxfid": "iPgyMDFQ9QMNrqc3ckEBEubDNwLnvubUdW",
    "indexid": "xUX5p1gUzia3V1V5URtLDJ7kQbMosPsVj8",
    "hash160result": "72853b66aa158531e1f15b9ff075199a1224bddd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.verifiedsms"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_KYCCHECKED = {
    "vdxfid": "iRnbiA4dAPbeuB6KQN2donBHP9mKUHHFZf",
    "indexid": "xWciAxVi1hpKXLyMG3gnnAhpQonLQapWPv",
    "hash160result": "c6114ffec250b746bde117903b930d9a34d3bdf4",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.kycchecked"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_DOCUMENTSVERIFIED = {
    "vdxfid": "iBjML9DHV67MBQyMEHVTSoJPhU8DNeWRTE",
    "indexid": "xGZTnweNLQL1oarP5y9cRBpvj89EGt5VSm",
    "hash160result": "0a93883010769ff783be5ced074ecfa50dd08e5a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.documentsverified"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_SELFIECHECKED = {
    "vdxfid": "iKgeFKoy6WMx9MoEjig5vHoXbyxVFBPWDN",
    "indexid": "xQWki8F3wpacmXgGbQLEtgL4ddyWC8UZLv",
    "hash160result": "6a044306ef77ce9896ffcd26ee40174651b1ccb1",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.selfiechecked"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_WATCHLISTOK = {
    "vdxfid": "iFDB1qKYSrWMRaMCWX6hNGE8HVXB1cNtJu",
    "indexid": "xL3HUdkdJAj23kEENCkrLekfK9YBymnLrX",
    "hash160result": "e691a2d2af30df6ee21f0eb805a98e11d539ba80",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.watchlistok"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_RISKCHECKOK = {
    "vdxfid": "i9dva492S7vQphjLiK2UaS7JikZKs5TQsB",
    "indexid": "xEU32ra7HS95SscNZzgdYpdqkQaLjnzcyC",
    "hash160result": "6ffdbee07124450d29698724573bd6ab07d09743",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.riskcheckok"
    }
};
exports.IDENTITY_VERIFICATION_APPROVALS_STATUS = {
    "vdxfid": "iKhGUcTH4ZQ7uiy933m8f1GbwSLcwJW8ev",
    "indexid": "xQXNwQtMuscnXtrAtjRHdPo8y6MdomjAXM",
    "hash160result": "00612f17d9cedc346fcd139c0c5b56e666efeab1",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.verification.approvals.status"
    }
};
exports.IDENTITY_DRIVINGLICENCE = {
    "vdxfid": "iMYQw33ryywcNyQDjFjiVvFm2kAwG85poV",
    "indexid": "xSNXPqUwqJAH19HFawPsUJnJ4QBxCATPNx",
    "hash160result": "e2857ddcc4f3301c354a00d1376558a75e802ec6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ORIGINALFRONT = {
    "vdxfid": "i3fq6ET2dL8CxC3BJzdYTpUsjEsQaKP7bX",
    "indexid": "x8VwZ2t7UeLsaMvDAgHhSD1QkttRPYndPW",
    "hash160result": "26bab54e1f760b1abb888229a38a5179cc502302",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.originalfront"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ORIGINALBACK = {
    "vdxfid": "i7LTNZvJmm5LjAwMWuryb52yKt7txaV5FW",
    "indexid": "xCAZqNMPd5J1MLpPNbX8ZTZWMY8unxdAfs",
    "hash160result": "c7b3e9a70908fafc8de3e81f6ac2e0c131c9592a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.originalback"
    }
};
exports.IDENTITY_DRIVINGLICENCE_CROPPEDFRONT = {
    "vdxfid": "i8KsL3JJgbJyuqEyEbu5KZkDBFvHscLoM6",
    "indexid": "xD9ynqjPXuXeY1816HZEHxGkCuwJoHBx54",
    "hash160result": "7b28226a4f3eaae379cddbc84d037cfe587e3535",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.croppedfront"
    }
};
exports.IDENTITY_DRIVINGLICENCE_CROPPEDBACK = {
    "vdxfid": "iRwumhx12vtT8CkspBLmKQY8WZywurxVXo",
    "indexid": "xWn2EWP5tF77kNdufrzvHo4fYDzxhjXyZz",
    "hash160result": "0b6edf21bfe119173b3fffab6118d79a39a580f6",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.croppedback"
    }
};
exports.IDENTITY_DRIVINGLICENCE_FACE = {
    "vdxfid": "i5i7U4EAbgPzhCRebtbmoZt6pTyqGqP8jj",
    "indexid": "xAYDvrfFSzcfKNJgTaFvmxQdr7zr6oGgFh",
    "hash160result": "1f47647bf3e71f0c1c2638c99e6a42e6bf118218",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.face"
    }
};
exports.IDENTITY_DRIVINGLICENCE_IDNUMBER = {
    "vdxfid": "iBCA8b4zS5ygVgTFqxabke7BBFs92dhcXQ",
    "indexid": "xG2GbPW5HQCM7rLHheEkj2diCut9vgFhM2",
    "hash160result": "fcf0571278bd1afce6d93f0a99f41437bb91a854",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.idnumber"
    }
};
exports.IDENTITY_DRIVINGLICENCE_CATEGORY = {
    "vdxfid": "i5Cm95DZa6FPP66bA6aFfoYL2jaojetHMp",
    "indexid": "xA2sbseeRQU41Fyd1nEQeC4s4Pbpf63xB4",
    "hash160result": "3b91fccdf59d99b21e442441b89abb31bf09f512",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.category"
    }
};
exports.IDENTITY_DRIVINGLICENCE_EXPIRATIONDATE = {
    "vdxfid": "iJvGpPoP1uUkUqn9bAchLyfaGWyy8JGQoX",
    "indexid": "xPkPHCETsDhR71fBSrGrKNC7JAzz17RsLk",
    "hash160result": "96aee63b3c6094a4d9edbc04b63a8e45688068a9",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.expirationdate"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ISSUINGCOUNTRY = {
    "vdxfid": "iBsNEqysX64cQAjiRHHL1msd7LxroGM6Mb",
    "indexid": "xGhUheQxNQHH2LckGxwUzAQA8zysfnKDSU",
    "hash160result": "f2f24dd2383538493d21ff0aca77c7cd1fe6125c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.issuingcountry"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ISSUINGREGION = {
    "vdxfid": "i6gZSDYpK9inexaeFQDSk9GuAmew1ymMFo",
    "indexid": "xBWfu1yuATwTH8Tg75sbiXoSCRfwsxQzeR",
    "hash160result": "67f4fd5c49250912aecf1eb8ab17f29d590a2f23",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.issuingregion"
    }
};
exports.IDENTITY_DRIVINGLICENCE_DATEOFBIRTH = {
    "vdxfid": "iChWUsL1NQwDqcwXbFGxHiCegfquGPyadv",
    "indexid": "xHXcwfm6Dj9tTnpZSvw7G6jBiKrvBUhwaw",
    "hash160result": "3c7bd13bcdb54368e7590a9f2da5b201b7be2d65",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.dateofbirth"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ADDRESS_STREET1 = {
    "vdxfid": "i9xaEvSQ537wuYgcVPRgG3zop9bVzeDTBw",
    "indexid": "xEnghisUvMLcXiZeM55qESXLqocWsv6zmJ",
    "hash160result": "48dd1caf84c1a49209ca44064846dc4ad0be1e47",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.address.street1"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ADDRESS_CITY = {
    "vdxfid": "i6XMEh3jrxzdyoVYoNWhRSncR9oWSnmikd",
    "indexid": "xBMThVUpiHDJbyNaf4ArPqK9SopXGndEyv",
    "hash160result": "c1f3612774870d1f12320bff317e7790211d7121",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.address.city"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ADDRESS_REGION = {
    "vdxfid": "i7sPBSqerD23RAqfN167aYePjfC8LL34UA",
    "indexid": "xChVeFGjhXEi3LihDgkGYwAvmKD9CsNunu",
    "hash160result": "991d24c053cb59a816e161fe3af2f40a7f2e3330",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.address.region"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ADDRESS_POSTCODE = {
    "vdxfid": "i9eHAmpeA3tmpsVeG5EkHuVfALFrmpzLqM",
    "indexid": "xEUPdaFj1N7ST3Ng7ktuGJ2CBzGsZbja5V",
    "hash160result": "f5905bbdf2eb60b24ccf6851716cc0efe801a943",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.address.postcode"
    }
};
exports.IDENTITY_DRIVINGLICENCE_ADDRESS_COUNTRY = {
    "vdxfid": "i3xAMYBKLVdK89kuheXhTjuJTAxozmypj3",
    "indexid": "x8nGpLcQBoqykKdwZLBrS8RqUpypqVUEV5",
    "hash160result": "459844e00df4387514f31f182a88f7e13b0d3a05",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.drivinglicence.address.country"
    }
};
exports.IDENTITY_SELFIECHECK_IMAGE = {
    "vdxfid": "iC22PxGqY7Mx3YT9kNrW1d11JNyGL56N8e",
    "indexid": "xGr8rkhvPRacfiLBc4Wez1XYL2zHDDbJgD",
    "hash160result": "c52d0023cce8c847a5097b6898f867651914b65d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.selfiecheck.image"
    }
};
exports.IDENTITY_SELFIECHECK_VIDEO = {
    "vdxfid": "iLfnRYzcdQXR6am8rZk7xNtTUbLZo5NLG6",
    "indexid": "xRVttMRhUik5ikeAiFQGvmQzWFMajwrVzX",
    "hash160result": "ac0674f6d656d434e0b5b310daaaed554c3a9bbc",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.selfiecheck.video"
    }
};
exports.IDENTITY_EMAIL_ISDELIVERABLE = {
    "vdxfid": "iN5Tdse8NSwuW6A4ZavHbHoDyD8aVjn1Ky",
    "indexid": "xSua6g5DDmAa8G36RGaSZgKkzs9bSnFbCX",
    "hash160result": "8194ee01a0bc66dca2af9ba7c3bba4a24da70dcc",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.isdeliverable"
    }
};
exports.IDENTITY_EMAIL_BREACHCOUNT = {
    "vdxfid": "iDy1YKGhzVjAiMiuAvFDqxQbmLRhLEjwPo",
    "indexid": "xJo817hnqowqLXbw2buNpLw8nzSiAygHhx",
    "hash160result": "8144d2d8cafd733bb03847166be8493d275e1473",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.breachcount"
    }
};
exports.IDENTITY_EMAIL_FIRSTBREACHEDAT = {
    "vdxfid": "i3eSGR4wrLk5djHsnT18dDHrJBFSBBxVST",
    "indexid": "x8UYjDW2hexkFuAue8fHbbpPKqGT4mjAzH",
    "hash160result": "df796054181f57d3b61d655d604d42d6c6d8df01",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.firstbreachedat"
    }
};
exports.IDENTITY_EMAIL_LASTBREACHEDAT = {
    "vdxfid": "iCuZWBzmxCoFcRFjXYFgC6g4jT7kzxvhew",
    "indexid": "xHjfxzRroX1vEb8mPDuqAVCbm78ms8Hkhd",
    "hash160result": "d1b421db4c835cfa67b491342c31f89283427567",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.lastbreachedat"
    }
};
exports.IDENTITY_EMAIL_DOMAIN_REGISTEREDAT = {
    "vdxfid": "iGxV4SBRZMk5qWrQEKgUS4RoqzpDmyBEpC",
    "indexid": "xMnbXEcWQfxkTgjS61LdQSxLseqEcTADNA",
    "hash160result": "e195ef220f8e71bfa7bef160291ecaa0164de393",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.domain.registeredat"
    }
};
exports.IDENTITY_EMAIL_DOMAIN_FREEPROVIDER = {
    "vdxfid": "iLUfvKcg92CYo3BvCuRf5o844d44kGLhJL",
    "indexid": "xRJnP83kzLRDRD4x4b5p4Beb6H55fetTy7",
    "hash160result": "0b0f213c88a1b0df6cd01721955b1d0c103981ba",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.domain.freeprovider"
    }
};
exports.IDENTITY_EMAIL_DOMAIN_CUSTOM = {
    "vdxfid": "i4FSBFpQ6Ccjiy2g61GrxhBppv1jDDh6on",
    "indexid": "x95Ye4FUwWqQM8uhwgw1w5iMra2k7F1Lfz",
    "hash160result": "bea1175185aeaf256aa7f04795b2c8d0c8547e08",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.domain.custom"
    }
};
exports.IDENTITY_EMAIL_DOMAIN_DISPOSABLE = {
    "vdxfid": "i52PJxRyjKAEkmQFd2oGYgZV3pcsQUcD1T",
    "indexid": "x9rVmks4adNuNwHHUiTRX5625UdtJPBQ1w",
    "hash160result": "3adf98cb5cc90a074a52a651c50f67f5f0a7fe10",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.domain.disposable"
    }
};
exports.IDENTITY_EMAIL_DOMAIN_TOPLEVEL_SUSPICIOUS = {
    "vdxfid": "iCtAZWinafiyf4tmvPxFkKNn5KxayXTPSV",
    "indexid": "xHiH2K9sRyweHEmon5cQihuK6yybre797b",
    "hash160result": "85477eb8148562614c396ca64fc7563637b13167",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.email.domain.toplevel.suspicious"
    }
};
exports.IDENTITY_PASSPORT = {
    "vdxfid": "iKgbqmZ4Ks9SPNQGj5PZ5TgXomYG4CtaXv",
    "indexid": "xQWiJZz9BBN71YHJam3i3rD4qRZH1sbLHD",
    "hash160result": "775f52820102c994e30a29b1828b064421afcab1",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport"
    }
};
exports.IDENTITY_PASSPORT_ORIGINALFRONT = {
    "vdxfid": "iCwT1mHdci9wooC6Q8mtx8QssXzwiL4hxp",
    "indexid": "xHmZUZiiU2NcRy58FpS3vWwQuC1xdM48mW",
    "hash160result": "25023e23a25ba4daa7ac0a9c96180f5e90acd067",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.originalfront"
    }
};
exports.IDENTITY_PASSPORT_ORIGINALBACK = {
    "vdxfid": "iDXKJaroNRKr9GZfLFvH7LttJQaXqGoSrc",
    "indexid": "xJMRmPHtDjYWmSShBwaS5jRRL4bYmTdC9J",
    "hash160result": "21734b0f37ec51dd77bdab8c10065cf67b61386e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.originalback"
    }
};
exports.IDENTITY_PASSPORT_CROPPEDFRONT = {
    "vdxfid": "i4cr6CxCYDHUDjc6UoMsDVAZoNep6Meuyi",
    "indexid": "x9SxZ1PHPXW8quV8LV22Bsh6q2fpxtJ6Zd",
    "hash160result": "274c241806d31576a57a074cc2f6b4c624078b0c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.croppedfront"
    }
};
exports.IDENTITY_PASSPORT_CROPPEDBACK = {
    "vdxfid": "i6wA2ttX7vcxBXmrdmGEa44NZEFBZWoRYa",
    "indexid": "xBmGVhKbyEqcohetVSvPYSauatGCUYDMs2",
    "hash160result": "f56f1db46ddebc99f3c8954fc8bf1d26a9bef125",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.croppedback"
    }
};
exports.IDENTITY_PASSPORT_FACE = {
    "vdxfid": "iLCbvnyU4V3XeMz18CXAG5MCtjb2FjpcZX",
    "indexid": "xR2iPbQYuoGCGXs2ytBKETsjvPc35DNZDm",
    "hash160result": "26f7dc9d524f84a21c8a9e3f2dc5149f3a3c77b7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.face"
    }
};
exports.IDENTITY_PASSPORT_IDNUMBER = {
    "vdxfid": "iDYih1jmCA1oexyxZ1PQFL5ewyciqoQ2rw",
    "indexid": "xJNq9pAr3UEUH8rzQh3ZDicByddjgKM4vN",
    "hash160result": "c8a25af227fc07e260119b370da0eae2a9517c6e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.idnumber"
    }
};
exports.IDENTITY_PASSPORT_CATEGORY = {
    "vdxfid": "iMtpUJYWZmnnSJyJcshHRdWJZMhZVZZifT",
    "indexid": "xSivw6ybR61T4UrLUZMSQ22qb1iaQux7BU",
    "hash160result": "84a9f125285d7e93a1e676ed48e3fbe459780aca",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.category"
    }
};
exports.IDENTITY_PASSPORT_EXPIRATIONDATE = {
    "vdxfid": "i98TaZ3wTh3qRw2ufeunVY2MD5eKwoamGE",
    "indexid": "xDxa3MV2K1GW46uwXLZwTvYtEjfLspcYEK",
    "hash160result": "07727b480c654d59cb611ed01715e254eb37053e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.expirationdate"
    }
};
exports.IDENTITY_PASSPORT_ISSUINGCOUNTRY = {
    "vdxfid": "iRHGM2GEYeRUuHKSG1wENVA16bdyVRxchn",
    "indexid": "xW7NophKPxe9XTCU7hbPLsgY8FezLKmJHi",
    "hash160result": "4798dee337b16fc22d26748fb0803738f99831ef",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.issuingcountry"
    }
};
exports.IDENTITY_PASSPORT_ISSUINGREGION = {
    "vdxfid": "i6Ay9VdcZjGrJur5SNyhBDZWzxGmo7qUmW",
    "indexid": "xB15cJ4hR3VWw5j7J4dr9c642cHnbq2nm9",
    "hash160result": "f3d9b605096f4c816de7d72c597fee07e75a961d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.issuingregion"
    }
};
exports.IDENTITY_PASSPORT_DATEOFBIRTH = {
    "vdxfid": "iAjG8DwYfKxt9affJy6CUBDDFK5jaeHRLJ",
    "indexid": "xFZNb2NdWeBYmkYhAekMSZjkGy6kWqAqyd",
    "hash160result": "73eb23619d178f495a24b41aaf6aac107357924f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.dateofbirth"
    }
};
exports.IDENTITY_PASSPORT_ADDRESS_STREET1 = {
    "vdxfid": "i7HPJNB16V5pws8xSq4a8pHF29Mcg6sUyy",
    "indexid": "xC7VmAc5woJVa31zJWij7Con3oNdXuBysY",
    "hash160result": "c28625c4dfc12d3cdd85f8c7272e87a57523c529",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.address.street1"
    }
};
exports.IDENTITY_PASSPORT_ADDRESS_CITY = {
    "vdxfid": "iFSLsk21VvWSWLg9a4XFTB3kEN8bLnTB7c",
    "indexid": "xLGTLYT6MEj78WZBRkBQRZaHG29cBfjnYu",
    "hash160result": "c06884e75232e86de75c6ccbd5605a3352dd3783",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.address.city"
    }
};
exports.IDENTITY_PASSPORT_ADDRESS_REGION = {
    "vdxfid": "iFNoUQhExFEYTgrqgy7x22Q6URM7ek9L3J",
    "indexid": "xLCuwD8KoZTD5rjsYen6zQvdW5N8Z4oGqf",
    "hash160result": "7b7baa6d0d788f434536aa472c57d9de40678c82",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.address.region"
    }
};
exports.IDENTITY_PASSPORT_ADDRESS_POSTCODE = {
    "vdxfid": "iS4SakGdB4ek1Q1QAitXUwFEk1RVyi3rLY",
    "indexid": "xWtZ3Yhi2NsQdZtS2QYgTKmmmfSWrxdFKY",
    "hash160result": "4457551bc48db37393f5ec3ec3d0cf6766dcbcf7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.address.postcode"
    }
};
exports.IDENTITY_PASSPORT_ADDRESS_COUNTRY = {
    "vdxfid": "iB9w9GgcJdGTt3ZuM2pm5qpDBA3UaJdcvj",
    "indexid": "xFz3c57h9wV8WDSwCiUv4ELkCp4VNyPHLr",
    "hash160result": "dd93bcbecc805e5b1606efafa1ecab6b33e53c54",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.passport.address.country"
    }
};
exports.IDENTITY_RESIDENCEPERMIT = {
    "vdxfid": "i8WZetqKFn98rHRZGvAvPuzPyrJeyUMjfb",
    "indexid": "xDLg7hGQ76MoUTJb8bq5NJWw1WKftQg9VL",
    "hash160result": "712ef00d9937eb4ade0fd3e627c2df1d99503b37",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ORIGINALFRONT = {
    "vdxfid": "iC5NrmPgKckxBjKv7v9HjUMytm4jRtEBgZ",
    "indexid": "xGuVKZpmAvycouCwyboShrtWvR5kNYzWoH",
    "hash160result": "639ed2ef9da2f5e75fe63e1ccf83d1b54e68585e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.originalfront"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ORIGINALBACK = {
    "vdxfid": "iLTPvrZi8HNALuVmYeAWnSnLdZ5GsAAUcx",
    "indexid": "xRHWPeznybapy5NoQKpfkqJsfD6HmQW5eW",
    "hash160result": "94d200a22dbdfa7ba47d1970c21eacb65f7543ba",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.originalback"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_CROPPEDFRONT = {
    "vdxfid": "i6T3rairykWA5vVEtQqptjp5RBRhTCmsBS",
    "indexid": "xBHAKP9wq4ipi6NGk6Vys8LcSqSiKAMKZU",
    "hash160result": "14136815f288a4b6426c7f4ab6b28221dcf0a020",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.croppedfront"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_CROPPEDBACK = {
    "vdxfid": "iHssgpjB2gsusjjLH36N3KqUQqz7JPXumA",
    "indexid": "xNhz9dAFt16aVucN8ikX1iN1SW18D7SNDP",
    "hash160result": "ce3cae77f2010009817f1e01de52ce8a493cfc9d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.croppedback"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_FACE = {
    "vdxfid": "iNVvVYKcKuredXKvctn5uQxp3kNXoJrwNb",
    "indexid": "xTL2xLkhBE5KFhCxUaSEsoVM5QPYfELeHf",
    "hash160result": "4dd17db50d569a63cc892d78850ac9de1d0eaed0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.face"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_IDNUMBER = {
    "vdxfid": "iMxygBvDFftAnmUCjVLh21etV5v4wt9zdk",
    "indexid": "xSo68zMJ6z6qQwMEbAzqzQBRWjw5u6Tm63",
    "hash160result": "ab544471e583d6a11245bb971e3ee1ef5ed1d3ca",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.idnumber"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_CATEGORY = {
    "vdxfid": "iGbMb21an69VE6iTH2iRtRFKCEUZPJHTwU",
    "indexid": "xMRU3pSfdQN9rGbV8iNaromrDtVaCufAXu",
    "hash160result": "ae9031bab1ee600e10aa16ec1d4c13def953e48f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.category"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_EXPIRATIONDATE = {
    "vdxfid": "iJ48ALemxyMV6DYzeuRMe8Fn78iMZdjSXZ",
    "indexid": "xNtEd95rpHa9iPS2Wb5WcWnK8njNXD9HEH",
    "hash160result": "d3083b08621d6ff5dc3f7f9cace34f944d7aec9f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.expirationdate"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ISSUINGCOUNTRY = {
    "vdxfid": "i7UhTp4gruQwtkC1bi4RxE4wUAsro6n9Ym",
    "indexid": "xCJovcVmiDdcWv53TPiavcbUVptsgMKzdL",
    "hash160result": "75e37dc8957c8c6765c60962804d446b2de0e82b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.issuingcountry"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ISSUINGREGION = {
    "vdxfid": "iERBNWk2tyaGJ2w8P1kM88Mdj5WA9qFzbv",
    "indexid": "xKFHqKB7kHnvvCpAEhQW6WtAkjXAymjqXM",
    "hash160result": "788165581de37b5473c2f127d387f3d7a8630778",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.issuingregion"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_DATEOFBIRTH = {
    "vdxfid": "iM62dN7LSHWDuetPi6qAewG6bzYwFrcqBN",
    "indexid": "xRv96AYRHbitXpmRZnVKdKnddeZxAivvFE",
    "hash160result": "e2533190e4822ab51c5b2029039fbb0d431131c1",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.dateofbirth"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ADDRESS = {
    "vdxfid": "iCA8P2rVs5DjtzQpXEnPJcG4KBs79C9EpL",
    "indexid": "xGzEqqHaiPSQXAHrNvSYGznbLqt83gLGV5",
    "hash160result": "2c7264a72e1d7937da951620039e48a0c8663e5f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.address"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_STREET1 = {
    "vdxfid": "iMuY2CbmQpCFzodGBtqxogmTb5dYfNbCJa",
    "indexid": "xSjeV12rG8QvcyWJ3aW7n5HzcjeZaxtGwr",
    "hash160result": "444cbb0dc6f471ecb2261dc7d6731cd97e272dca",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.address.street1"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_CITY = {
    "vdxfid": "iRckJ1VkfYazfVHWJuA9iXTth83ZYp8znz",
    "indexid": "xWSrkovqWrofHfAYAapJguzRin4aPEqHJK",
    "hash160result": "73e22f5d24515103052ab165736a0198a7d4e0f2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.address.city"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_REGION = {
    "vdxfid": "iBpH337NTJSLjSxbBWuu2wBLu12k4JVGk4",
    "indexid": "xGePVqYTJcf1Mcqd3Ca41Khsvf3kyxtNXH",
    "hash160result": "2f7b3040cf60259ee4bf6dfc93a4de42ab4e7d5b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.address.region"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_POSTCODE = {
    "vdxfid": "iGKi47jtg6CumKYSUBj57drgLNGzhJY3Gj",
    "indexid": "xM9pWvAyXQRaPVRUKsPE62PDN2J1Zp4d6b",
    "hash160result": "db85ea63848a6ad2c3a0e82bb29e215c00c2ee8c",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.address.postcode"
    }
};
exports.IDENTITY_RESIDENCEPERMIT_ADDRESS_COUNTRY = {
    "vdxfid": "i8KD9CUn7Su4YT44WhbD8HYA1K425cFCqM",
    "indexid": "xD9Kbzurxm7jAcw6NPFN6g4h2y531jRanx",
    "hash160result": "75970ae74cd40419dc78ecef7be22c5ee09d1535",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencepermit.address.country"
    }
};
exports.IDENTITY_RESIDENTCARD = {
    "vdxfid": "iKkJFFtbxRMJutjoruW47Mc1sCfdGYQrC9",
    "indexid": "xQaQi4KgojZyY4cqibAD5k8Ytrge9jwt3u",
    "hash160result": "2b737a5733b91d305dcf07d9e75797740da97db2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard"
    }
};
exports.IDENTITY_RESIDENTCARD_ORIGINALFRONT = {
    "vdxfid": "iNMJhZ3wie5U2SRF7WSFTpjJo6B6RSTR4t",
    "indexid": "xTBRAMV2ZxJ8ecJGyC6QSDFqpkC7KTFMbW",
    "hash160result": "e440d2d8bab46633691a12e7bed0ea785bd90ccf",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.originalfront"
    }
};
exports.IDENTITY_RESIDENTCARD_ORIGINALBACK = {
    "vdxfid": "i4pAk8J5ec2wn55VattFRr7PyN4J2L13HJ",
    "indexid": "x9eHCvjAVvFcQExXSaYQQEdw125Jz84d8u",
    "hash160result": "9fa70ca8b49eab8c3e704f78f0e0ae1bc52caf0e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.originalback"
    }
};
exports.IDENTITY_RESIDENTCARD_CROPPEDFRONT = {
    "vdxfid": "iLnx7NDcAWtb9uWicdgSaiwco56TywMh5w",
    "indexid": "xRd4aAeh1q7Fn5PkUKLbZ7U9pj7UvU8v2V",
    "hash160result": "fa7347c3517552a028890dacaf889a6ead39f6bd",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.croppedfront"
    }
};
exports.IDENTITY_RESIDENTCARD_CROPPEDBACK = {
    "vdxfid": "i8WjL22L4UeaCDKZuj8R4Uub6zurTPdaLv",
    "indexid": "xDLqnpTQunsEpPCbmQna2sS88evsLJL51v",
    "hash160result": "b5134fe72682aa4f0dc645ceb73421dc07644337",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.croppedback"
    }
};
exports.IDENTITY_RESIDENTCARD_FACE = {
    "vdxfid": "i6dGShbLY2ppZnXSyfvdtdGFkCxBQd2r9Y",
    "indexid": "xBTNuW2RPM3VBxQUqMans1nnmryCFH4rRD",
    "hash160result": "25a41b37f64414a2477c5c0d1a139d64ce9b8f22",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.face"
    }
};
exports.IDENTITY_RESIDENTCARD_IDNUMBER = {
    "vdxfid": "iKFkbwDcQRXjapZcZAXsaMXjgER9CZbwZx",
    "indexid": "xQ5s4jehFjkQCzSeQrC2Yk4GhtSA2GbM4B",
    "hash160result": "e30d9a01765325e02ca22f60335d4bdb499917ad",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.idnumber"
    }
};
exports.IDENTITY_RESIDENTCARD_CATEGORY = {
    "vdxfid": "i46Fgc8ev9zAkjikjHWreqSXkMRpFr5Lsi",
    "indexid": "x8vN9QZjmUCqNubnayB1dDy4n1SqAqg4vn",
    "hash160result": "c0039a4929d081eec1d1f5ca3040e19bded3c106",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.category"
    }
};
exports.IDENTITY_RESIDENTCARD_EXPIRATIONDATE = {
    "vdxfid": "iBA1oFvDABKqbu9i61AEGy1m5fFHdCWkpy",
    "indexid": "xFz8G4MJ1VYWE52jwgpPFMYJ7KGJUd6Y4b",
    "hash160result": "0866dd99514f509c9ad4584b3f570515f4c74054",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.expirationdate"
    }
};
exports.IDENTITY_RESIDENTCARD_ISSUINGCOUNTRY = {
    "vdxfid": "iHBgD199BSEQWREtiW8dP259DX4qg6KjkM",
    "indexid": "xN1nfoaE2kT58b7vaBnnMQbgFB5rWuKCtd",
    "hash160result": "ef88ffb14a8b66dacc690351fa9c3d35a8036296",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.issuingcountry"
    }
};
exports.IDENTITY_RESIDENTCARD_ISSUINGREGION = {
    "vdxfid": "i6jygVNjzZUFEXVgtzWxXpBYf5rwjXF92J",
    "indexid": "xBa69HopqsgurhNikgB7WCi5gjsxbi12z3",
    "hash160result": "dc31e031328cfe3697527e046a52cc372687d423",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.issuingregion"
    }
};
exports.IDENTITY_RESIDENTCARD_DATEOFBIRTH = {
    "vdxfid": "iQfYTwmTxXzxxyFh6XbY2PQVLVwswRoJL1",
    "indexid": "xVVevkCYorDdb98ixDFgzmw2N9xtnBn6M2",
    "hash160result": "73e0e5f4af76255bc2a3583ad9a7b1d0241470e8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.dateofbirth"
    }
};
exports.IDENTITY_RESIDENTCARD_ADDRESS_STREET1 = {
    "vdxfid": "iJ67qMPN6tyrLXBhbJpKKBZYpkcBzZD8S4",
    "indexid": "xNvEJ9pSxDCWxh4jSzUUHa65rQdCviMqur",
    "hash160result": "8540d9cb71ca32f4c03caf26a4cffa4d51094da0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.address.street1"
    }
};
exports.IDENTITY_RESIDENTCARD_ADDRESS_CITY = {
    "vdxfid": "iLCQ2n5tKHzKcVBv8of1eYmdWEdEY5vTUN",
    "indexid": "xR2WVaWyAcCzEf4wzVKAcwJAXteFUoFSux",
    "hash160result": "7990100969a22f4b4ba35613b3994219e74d6db7",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.address.city"
    }
};
exports.IDENTITY_RESIDENTCARD_ADDRESS_REGION = {
    "vdxfid": "iPWcAQ6zbC9rKaaWAgrpoHmKs5G5SQCprF",
    "indexid": "xULidCY5SWNWwkTY2NWymgHrtjH6QfP6JL",
    "hash160result": "ff3f1523bfb1fe501ef10f0036c9f059b64bc7db",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.address.region"
    }
};
exports.IDENTITY_RESIDENTCARD_ADDRESS_POSTCODE = {
    "vdxfid": "iG1QGYyp4SkiP7b9ngPwkTGC3DxVG3hB16",
    "indexid": "xLqWjMQtukyP1HUBeN46iqnj4syW4eat4U",
    "hash160result": "f345aa72196b006e2200bd08ed0ea165806c7889",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.address.postcode"
    }
};
exports.IDENTITY_RESIDENTCARD_ADDRESS_COUNTRY = {
    "vdxfid": "i4wzngZfZb2QBnjr2TjtoMoMF9roSqQkho",
    "indexid": "x9n7FUzkQuF4oxcst9Q3mkKtGospNqDjEQ",
    "hash160result": "dd2a94da0a94115ed04de616b7d0ea1b19312a10",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residentcard.address.country"
    }
};
exports.IDENTITY_IDCARD = {
    "vdxfid": "iK7FrcxNvsej84qZjYR73iGgEV96sGKwTU",
    "indexid": "xPwNKRPTnBsPkEibbE5G26oDG9A7j4JSm7",
    "hash160result": "4f2b2c852e4cfa5a640988af78c4d02243467cab",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard"
    }
};
exports.IDENTITY_IDCARD_ORIGINALFRONT = {
    "vdxfid": "iCnLNq42DxhuK84Nes4UGjFFUuNsGGpuBZ",
    "indexid": "xHcSqdV75GvZwHwQWYidF7mnWZPtATN7Ky",
    "hash160result": "9f5f63641e6e935628d7602e92814311ea631766",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.originalfront"
    }
};
exports.IDENTITY_IDCARD_ORIGINALBACK = {
    "vdxfid": "iJyfvwrUeTRiGxiYw6oJZ3uALsuBt7QTyy",
    "indexid": "xPonPkHZVmeNu8bannTTXSRhNXvCpAD3MB",
    "hash160result": "df3a44e11ad54673eff910c1320d9f50100b0daa",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.originalback"
    }
};
exports.IDENTITY_IDCARD_CROPPEDFRONT = {
    "vdxfid": "iFDp8jWwybweGStGQnYxwhbi8eiucZ29sr",
    "indexid": "xL3vbXx2pvAJtcmJGUD7v68FAJjvZmrsga",
    "hash160result": "b10845ae9b29f3ed25f33f091398fd0a1536d980",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.croppedfront"
    }
};
exports.IDENTITY_IDCARD_CROPPEDBACK = {
    "vdxfid": "i8GpXrygUPpQYVwcoZ7JVRB1xB46xZsMuG",
    "indexid": "xD6vzfQmKi35AfpefEmTTohYyq57sdLVxr",
    "hash160result": "84c05d2d84ab69db2834df22602f34445ae9a134",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.croppedback"
    }
};
exports.IDENTITY_IDCARD_FACE = {
    "vdxfid": "i8sfiwALhk4FtSaWSnBWYwKnWN3G7m3jyU",
    "indexid": "xDhnBjbRZ4GvWcTYJTqfXKrKY24GxBC5cg",
    "hash160result": "4afc5fda25a15a4627b8426f40594ff2e11d393b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.face"
    }
};
exports.IDENTITY_IDCARD_IDNUMBER = {
    "vdxfid": "iBEJB1xD1mpR4kYQbYieW3hNFpe5QmQ6qA",
    "indexid": "xG4QdpPHs635gvRSTENoUSDuHUf6JB2izs",
    "hash160result": "0af18c033e6ad395bdfb5fbdbf5144d63c1d1055",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.idnumber"
    }
};
exports.IDENTITY_IDCARD_CATEGORY = {
    "vdxfid": "i4HCpvV1NJd4Ka8atCtDkXs4XLAkrmtKib",
    "indexid": "x97KHiv6Dcqiwk1cjtYNivPbYzBmg48ama",
    "hash160result": "68b49fa5bf2ed00672c881c15167fee2c304d408",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.category"
    }
};
exports.IDENTITY_IDCARD_EXPIRATIONDATE = {
    "vdxfid": "iNTbsfTmeAm7KUFehtCq3RH1JgbUdTJwCt",
    "indexid": "xTHiLTtrVUymwe8gZZrz1ooYLLcVZC5A4n",
    "hash160result": "f4b807e32848d5a40815e2aa19cb219c64ae3dd0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.expirationdate"
    }
};
exports.IDENTITY_IDCARD_ISSUINGCOUNTRY = {
    "vdxfid": "iJ5qVRWTHerkVreE9UrSfKyphD3XB9s8FA",
    "indexid": "xNuwxDwY8y5R82XG1AWbdiWMis4Y3BXDg7",
    "hash160result": "2cc5492966de5135e638de253b497cccb8643fa0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.issuingcountry"
    }
};
exports.IDENTITY_IDCARD_ISSUINGREGION = {
    "vdxfid": "i8dHTbZ62Bth8NwkxasnKFpvX4EZYuBun4",
    "indexid": "xDTPvPzAsW7MkYpnpGXwHeMTYiFaMyp6FD",
    "hash160result": "f42f7b71bb43c590b9063755754bf2d534b58038",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.issuingregion"
    }
};
exports.IDENTITY_IDCARD_DATEOFBIRTH = {
    "vdxfid": "iGcwhC6znG63pb6jqsRnrtDjXV4aXXsub2",
    "indexid": "xMT49zY5daJiSkymhZ5wqGkGZ95bMGYJ9r",
    "hash160result": "4d0c72c3369a0ac64711e58ae1b10785f1363190",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.dateofbirth"
    }
};
exports.IDENTITY_IDCARD_ADDRESS_STREET1 = {
    "vdxfid": "i6jMXjNE9qioZ2dFricFnEBEQEWK5Kg3PS",
    "indexid": "xBZTzXoK19wUBCWHiQGQkchmRtXKugcKWw",
    "hash160result": "2cee0d13a2fdeaac83d052ad27610da8bf59b623",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.address.street1"
    }
};
exports.IDENTITY_IDCARD_ADDRESS_CITY = {
    "vdxfid": "i3viAeqayk3KDk5tQpYcz6gFs1ayW5vBma",
    "indexid": "x8kpdTGfq4FyquxvGWCmxVCntfbzM8iAVb",
    "hash160result": "a10bfcd1cfd12d466a276339072d2f2a7ec6f304",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.address.city"
    }
};
exports.IDENTITY_IDCARD_ADDRESS_REGION = {
    "vdxfid": "iEHvf3XCFacMihTQPVXxNeo6hBCqggDFie",
    "indexid": "xK837qxH6tq2LsLSFBC7M3KdiqDrYBNMK7",
    "hash160result": "55af249b3ceb591709c693017e5b7b1cb131a876",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.address.region"
    }
};
exports.IDENTITY_IDCARD_ADDRESS_POSTCODE = {
    "vdxfid": "i3yAnt6zdceYxbCBnLwxn2tNdM4BnPkzhT",
    "indexid": "x8oHFgY5UvsDam5De2c7kRQuf15ChzdWFA",
    "hash160result": "acd086baf0863cff86fc56ec0fbb16dd18d56a05",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.address.postcode"
    }
};
exports.IDENTITY_IDCARD_ADDRESS_COUNTRY = {
    "vdxfid": "iA6KVD2C4QJAyKfCS3XfQV8AxmpR9R3XG5",
    "indexid": "xEvRx1TGuiWqbVYEHjBpNsehzRqS2fp4qg",
    "hash160result": "bab14b514d91d7daa39175c90e29a956dec19548",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.idcard.address.country"
    }
};
exports.IDENTITY_VISA = {
    "vdxfid": "iDCwZf84AhbJkm4zKZP7Le8h8ukJS9FySA",
    "indexid": "xJ342TZ921oyNvx2BF3GK2fEAZmKGeUQUd",
    "hash160result": "57faa6b546ac92c71022178b8c5e9fbae9bebe6a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa"
    }
};
exports.IDENTITY_VISA_ORIGINALFRONT = {
    "vdxfid": "iGAgzyLDVs5vYFLRgXVnkQpDRKy9Zh1TiV",
    "indexid": "xLzoTmmJMBJbARDTYD9wioLkSyzARsVQWr",
    "hash160result": "755da3361216260b786ba78fbe68800557223a8b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.originalfront"
    }
};
exports.IDENTITY_VISA_ORIGINALBACK = {
    "vdxfid": "i3becgcmf85RiY2PAxsp3fbuGKG8Qc73t1",
    "indexid": "x8Rm5V3rWSJ6LhuR2eXy248SHyH9Jjue4S",
    "hash160result": "e71909c77e2e0361764d22b81f4f53085fe85801",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.originalback"
    }
};
exports.IDENTITY_VISA_CROPPEDFRONT = {
    "vdxfid": "iAapfFQMAQy7USdjRwqzAZ2nWhRMSiQMmV",
    "indexid": "xFQw83qS1jBn6cWmHdW98wZKYMSNHsb2wy",
    "hash160result": "56ed30f8daf83e3b09eee57517be45b6b8c1f94d",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.croppedfront"
    }
};
exports.IDENTITY_VISA_CROPPEDBACK = {
    "vdxfid": "i3quMdmv3vAQDBA6nzM8fTiFtqJrw7tcnf",
    "indexid": "x8g1pSCzuEP4qM38eg1HdrEnvVKsoXBZ7R",
    "hash160result": "1d8106821498549cebc0af6f8d120b9933090b04",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.croppedback"
    }
};
exports.IDENTITY_VISA_FACE = {
    "vdxfid": "iAqxnB58655ZcRLAUm2Utib2rguRXT9wZM",
    "indexid": "xFg5EyWCwPJEEbDCLSgds77ZtLvSRpw2k9",
    "hash160result": "59564e826c8342a2b721708f6a83c9761dc6d650",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.face"
    }
};
exports.IDENTITY_VISA_IDNUMBER = {
    "vdxfid": "iQ5LfUtuggDyqbePUB9iWLgxYj7tvDm2VE",
    "indexid": "xUuT8HKzXzSeTmXRKrosUjDVaP8upm7rqg",
    "hash160result": "77ae761bf6bf7922ff8e47b53bd88107be15f8e1",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.idnumber"
    }
};
exports.IDENTITY_VISA_CATEGORY = {
    "vdxfid": "iH4nhrNsZKK6bEkgLDu17fBPR5dnVgitiQ",
    "indexid": "xMtuAeoxQdXmDQdiBuZA63hvSjeoT3wsnv",
    "hash160result": "8052162609b4da20bb5932ead5b6deedbb861495",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.category"
    }
};
exports.IDENTITY_VISA_EXPIRATIONDATE = {
    "vdxfid": "iNW2k7p7hVK2GCc7m1k4mihqh8jd94Dmnh",
    "indexid": "xTL9CvFCYoXgtNV9chQDk7ENinkdzPUodD",
    "hash160result": "5eaa0aef6ed6d27ee4909bc6ce8619c60346b3d0",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.expirationdate"
    }
};
exports.IDENTITY_VISA_ISSUINGCOUNTRY = {
    "vdxfid": "i5vDfPKMfCRPXVRhfumjWPEvBFhNMVjtGK",
    "indexid": "xAkL8BkSWWe49fJjXbRtUmmTCuiPJGBZ2c",
    "hash160result": "ebf49255193b4ffbb3a0487106a4df98833bcc1a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.issuingcountry"
    }
};
exports.IDENTITY_VISA_ISSUINGREGION = {
    "vdxfid": "iPRc9Ns6LadQNYU7DqSNyx7LW8W9dPKDjC",
    "indexid": "xUFicBJBBtr4ziM95X6XxLdsXnXAYQ1XFN",
    "hash160result": "a1217c6e44b1f47faf9d59378206009d8433d5da",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.issuingregion"
    }
};
exports.IDENTITY_VISA_DATEOFBIRTH = {
    "vdxfid": "i55bTsxLkCTmE6VvppvG8doYnmxuHhec65",
    "indexid": "x9uhvgPRbWgRrGNxgWaR72L5pRyvA4vVWm",
    "hash160result": "ed824bbfd195e63d6d5151a07eda49eba60c9a11",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.dateofbirth"
    }
};
exports.IDENTITY_VISA_ADDRESS_STREET1 = {
    "vdxfid": "iMzWxFVzJHbQm5YWv9c1eujvrUrPHAGVAc",
    "indexid": "xSpdR3w59bp5PFRYmqGAdJGTt8sQ8o4mpu",
    "hash160result": "05992eb838a4f562b6b7e0ff84bb05cdac571ecb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.address.street1"
    }
};
exports.IDENTITY_VISA_ADDRESS_CITY = {
    "vdxfid": "i8YXgZ7doRhidT5phX6qyRnttV6hZiyWTm",
    "indexid": "xDNe9MYiejvPFcxrZCkzwpKRv97iS3TQjA",
    "hash160result": "04959daab853c797bbbcb9c5ead7376e4a809a37",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.address.city"
    }
};
exports.IDENTITY_VISA_ADDRESS_REGION = {
    "vdxfid": "i6YkTDEi1M1mzuTyzww8hNoksJFpev17Fu",
    "indexid": "xBNrv1fnrfESd5M1rdbHfmLHtxGqUoeALR",
    "hash160result": "3a47a53e8717444b5d31e8618049daa8cde8b421",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.address.region"
    }
};
exports.IDENTITY_VISA_ADDRESS_POSTCODE = {
    "vdxfid": "iBJDLHSLB4cHvaeXazFp25Be3V9yRWmcoK",
    "indexid": "xG8Ko5sR2NpxYkXZSfuxzTiB59AzMUATiw",
    "hash160result": "dd0d87e3163157402aa16d2017a3ea06d6bccd55",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.address.postcode"
    }
};
exports.IDENTITY_VISA_ADDRESS_COUNTRY = {
    "vdxfid": "iQ9Z1PZMMp49rtDuGQSjfEZn3xACfxLAYa",
    "indexid": "xUyfUBzSD8GpV46w866tdd6K5cBDbMPuNo",
    "hash160result": "c45655a6924c0b377e9182869dc780df690dc4e2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.visa.address.country"
    }
};
exports.IDENTITY_PERSONALDETAILS = {
    "vdxfid": "i8SSgM1z7XVoCtoP9CCsMms3zCndaNjtCe",
    "indexid": "xDGZ99T4xqiTq4gQzss2LAPb1roeUyLwkU",
    "hash160result": "a8fbe89451c1d0a77b336ccf6b0fb7601dd47336",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.personaldetails"
    }
};
exports.IDENTITY_CONTACTDETAILS = {
    "vdxfid": "iRLT8V9NN178CvZQusJSHuyuFC2fD2QmE3",
    "indexid": "xWAZbHaTDKKnq6SSmYxbGJWSGr3g1GRDYH",
    "hash160result": "b9185ad980909708754a484bf11edc9febd8cbef",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.contactdetails"
    }
};
exports.IDENTITY_LOCATION = {
    "vdxfid": "iGmiLZ7J6GjxjZ4rkSMsDzyyvWtmMBjnbo",
    "indexid": "xMbpoMYNwaxdMiwtc822CPWWxAunLDE1BS",
    "hash160result": "15ea60d9ddde976095b0c79ceecef7b034cfd991",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.location"
    }
};
exports.IDENTITY_BANKINGDETAILS = {
    "vdxfid": "i8DUrZJJRjNQMJNeJ3Ti6pbpKPJ55LECyJ",
    "indexid": "xD3bKMjPH3b4yUFg9j7s5D8MM3K612HEir",
    "hash160result": "a7e5de6ac208f110d0509cffeb916b8dd03c0034",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails"
    }
};
exports.IDENTITY_DOCUMENTS = {
    "vdxfid": "iCm3ERZoUw2ze1P11QyRUtvhKYovCWFXbT",
    "indexid": "xHb9hDztLFFfGBG2s6daTHTEMCpw3tcbVJ",
    "hash160result": "ee9f8d5ba7366983cf9b9d3e5e8ac50898a9d865",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.documents"
    }
};
exports.IDENTITY_BANKACCOUNT = {
    "vdxfid": "iN4AgB4KEN1C3TfZnYDFUhxn37PdcrZvxT",
    "indexid": "xStH8yVQ5gDrfdYbeDsQT6VK4mQeYDjcFm",
    "hash160result": "122bf0739d7d1def003656a63c443efb6c14cfcb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankaccount"
    }
};
exports.IDENTITY_BANKINGDETAILS_CURRENCY = {
    "vdxfid": "i5k8pb9FHf5VZJKki6him1WMBkpyhe56BY",
    "indexid": "xAaFHPaL8yJABUCnZnMsjQ2tDQqzfUkZRm",
    "hash160result": "cc655f9f104ad6c25cc65407121fa7ac1208e418",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.currency"
    }
};
exports.IDENTITY_BANKINGDETAILS_COUNTRY = {
    "vdxfid": "iHYqZF4Asa4erZR9kJ5G5nWRNGWdiS8vBh",
    "indexid": "xNNx23VFitHKUjJBbyjR4B2xPvXebL5g4h",
    "hash160result": "cf7870c11608bf6e58890fbfc18ffe0db98d629a",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.country"
    }
};
exports.IDENTITY_BANKINGDETAILS_STREET1 = {
    "vdxfid": "iRhANjQk2G3aFXiaGtG68kZjdYr2iVXQJJ",
    "indexid": "xWXGqXqpsaGEshbc8ZvF796GfCs3bDhrgC",
    "hash160result": "bd420c73e6bba2e48542cddf188c23b8c098b6f3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.street1"
    }
};
exports.IDENTITY_BANKINGDETAILS_STREET2 = {
    "vdxfid": "iFWtcLUKAECLrREJr6mxtHM9xPUocxmTSY",
    "indexid": "xLM158uQ1YR1Ub7LhnS7rfsgz3VpTpBcCu",
    "hash160result": "7f1a53da2e265bab3230d9eec1ed0f36d7041484",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.street2"
    }
};
exports.IDENTITY_BANKINGDETAILS_CITY = {
    "vdxfid": "iQxBEB8sXNez25HJCzvnTWtWqXUkEVAuo8",
    "indexid": "xVnHgyZxNgseeFAL4gawRuR3sBVm7nyQqt",
    "hash160result": "5878bb5b9371344acb1b679316e0e087046c95eb",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.city"
    }
};
exports.IDENTITY_BANKINGDETAILS_REGION = {
    "vdxfid": "i4HJ5yrzBFEwjiYgzptMcrBsCeBjPYQJFX",
    "indexid": "x97QYnJ52ZTcMtRirWYWbEiQEJCkKnxArM",
    "hash160result": "7bf3a5ee05846c54bd19032e6ee9069cbc68d808",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.region"
    }
};
exports.IDENTITY_BANKINGDETAILS_POSTALCODE = {
    "vdxfid": "iFVaE922Bzrro6rb87d9En2t2AAGx7EivG",
    "indexid": "xLKggwT73K5XRGjcyoHJDAZR3pBHqz4Utt",
    "hash160result": "ebd93a0f4fb8db6fb0cb8d397c45b41a0142d483",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.postalcode"
    }
};
exports.IDENTITY_BANKINGDETAILS_TAXNUMBER = {
    "vdxfid": "i6Gbi3EkYrbREumkLmHUedbzrisXkRzwKY",
    "indexid": "xB6iAqfqQAp5s5enCSwdd28XtNtYcHgrDb",
    "hash160result": "bcc691f5d53f99e196b291ea2a00a9805ff4a61e",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.taxnumber"
    }
};
exports.IDENTITY_BANKINGDETAILS_TAXCOUNTRY = {
    "vdxfid": "iMJzAfPjqvWJdYyoWTX79cSjd51HbVc7wC",
    "indexid": "xS96dTpphEiyFirqN9BG7zyGej2JTACDB1",
    "hash160result": "e19f920e684c7d906dd8c85d72a5d5f0cd6ba4c3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.taxcountry"
    }
};
exports.IDENTITY_BANKINGDETAILS_FIRSTNAME = {
    "vdxfid": "iGAomW7jtsy7zRaoMFU48KvrHahHwdjzi7",
    "indexid": "xLzvEJYpkCBncbTqCw8D6iTPKEiJpW3beK",
    "hash160result": "d33bd09ba3184bf0e3fa00ad62e92a7a99c83f8b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.firstname"
    }
};
exports.IDENTITY_BANKINGDETAILS_LASTNAME = {
    "vdxfid": "iMrvbLJnZawGsdFshtrHM3QKa4pDPbRk3L",
    "indexid": "xSh348jsQu9wVo8uZaWSKRvrbiqED1eny3",
    "hash160result": "4a0d68f2cafc3cbe827a91fd5038c65878bfaec9",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.lastname"
    }
};
exports.IDENTITY_BANKINGDETAILS_PHONENUMBER = {
    "vdxfid": "i9jKPi8ubg5fx3BBmZdiyobJxNgzcmV9et",
    "indexid": "xEZRrWZzSzJLaD4DdFHsxC7qz2i1YejHqk",
    "hash160result": "b092c8f73031298d26b919f4b398fa9b66f19c44",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.phonenumber"
    }
};
exports.IDENTITY_BANKINGDETAILS_NUMBER = {
    "vdxfid": "iKGaF7fZ6yAvwJyxcmpuas2Hn9PZPF99yf",
    "indexid": "xQ6ghv6dxHPbZUrzUTV4ZFYpooQaFZG1aa",
    "hash160result": "fcceea7c24223218bc9313e8176daea6155e3fad",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.number"
    }
};
exports.IDENTITY_BANKINGDETAILS_TYPE = {
    "vdxfid": "iNkzXo7BBcUvCBH8somKyFtAFsR3mmmYuG",
    "indexid": "xTb6zbYG2vhapMAAjVRUweQhHXS4csH9eB",
    "hash160result": "26dcd354b4b2bd8b939af29fc5ea57a082aa87d3",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.type"
    }
};
exports.IDENTITY_BANKINGDETAILS_SORTCODE = {
    "vdxfid": "i8v2y1beTivG8Nyi6Td3VFTc2ExFQJT8pC",
    "indexid": "xDk9Rp2jK38vkYrjx9HCTdz93tyGLCaa3E",
    "hash160result": "27df54160c8a8a962dd455004c8afac060aeab3b",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.bankingdetails.sortcode"
    }
};
exports.IDENTITY_DOCUMENTS_PASSPORT = {
    "vdxfid": "iJHkDyp8dPnNdrh7P9fzow4gTshpbznkSK",
    "indexid": "xP7rgnFDUi13G2a9EqL9nKbDVXiqVHVtyg",
    "hash160result": "456f1956c77f7ff59d98dd57030d7ed22afd7fa2",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.documents.passport"
    }
};
exports.IDENTITY_RESIDENCECARD = {
    "vdxfid": "iQerHJHjqVT32hU1ZUyVYKQEkavs4xFtHo",
    "indexid": "xVUxk6ipgofhesM3RAdeWhvmnEwsywApa2",
    "hash160result": "0b2227f2bb574fe3cbcc683eecfc4d3bff884ee8",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.residencecard"
    }
};
exports.IDENTITY_ATTESTOR = {
    "vdxfid": "iFNc5DG22Btm69wBDDXatvSPLxzJq53QBa",
    "indexid": "xLCiY1h6sW7RiKpD4uBjsJxvNd1Kiej8tW",
    "hash160result": "e5d18dab811f87643c1e7a63627172331be38282",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.attestor"
    }
};
exports.IDENTITY_ATTESTATION_RECIPIENT = {
    "vdxfid": "iAkd3VBhYQ3MK6PUCtfhXrLVNbqSghxxpn",
    "indexid": "xFajWHcnPiG1wGGW4aKrWEs2QFrTbwP7wd",
    "hash160result": "71b7cbbfc8be868f6d9f6c481c420b002438d44f",
    "qualifiedname": {
        "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
        "name": "vrsc::identity.attestation.recipient"
    }
};

export interface VDXFKeyInterface {
  vdxfid: string;
  hash160result: string;
  qualifiedname: {
    name: string;
    namespace: string;
  };
}

export const VERUSPAY_INVOICE_VDXF_KEY: VDXFKeyInterface = {
  hash160result: "628efc28c2e2d40050e1a9de7a93e7ddf2aa0076",
  qualifiedname: {
    name: "veruspay.vrsc::invoice",
    namespace: "iAisVse7piEiE2VsixZx4SARyHzSpxYxgq"
  },
  vdxfid: "iEETy7La3FTN2Sd2hNRgepek5S8x8eeUeQ"
}

export const IDENTITY_AUTH_SIG_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iPi1DPgDDu7hP1mAp5xJ8rHBWwXSzc6yA8",
  hash160result: "06d4b963da3dcf17f00905b0720f7a4c241defdd",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.signature",
  },
};

export const LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iPi1DPgDDu7hP1mAp5xJ8rHBWwXSzc6yA8",
  hash160result: "06d4b963da3dcf17f00905b0720f7a4c241defdd",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.signature",
  },
};

export const LOGIN_CONSENT_REQUEST_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i3dQmgjq8L8XFGQUrs9Gpo8zvPWqs1KMtV",
  hash160result: "c539b36efc768d1a7b728aa2052c2c28bd2eae01",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.request",
  },
};

export const LOGIN_CONSENT_RESPONSE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i5fvfsaTFKtrHCPYQHTXRaXcyxHmJMxTMe",
  hash160result: "17dafae5a8417394df73fb718cff87b5a2391818",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.response",
  },
};

export const LOGIN_CONSENT_CHALLENGE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i5maLnB62WmKKXFZniqDRU1JiC2Hd1xpVb",
  hash160result: "9c35c457fb8a932676b58d1f9cd4a88f3ec02919",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.challenge",
  },
};

export const LOGIN_CONSENT_DECISION_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iQP5eKQaYDV3FFXsq7276LyWxk4ttjuSdm",
  hash160result: "89baa310edcc2a4ef9841cc09c7d0a88bc0853e5",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.decision",
  },
};

export const WALLET_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i5JtwbP6zyMEAy9LLnRAGLgJQGdRFfsAu4",
  hash160result: "cb8486edea3f09c06c687327bda71487f30b1e14",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::applications.wallet",
  },
};

export const LOGIN_CONSENT_REDIRECT_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iDXvHYhRpWcoARCEYeLv8GwkVdrbvSFuam",
  hash160result: "a6d2c261dcbd96cc1ef27a47c9a67c031895556e",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.redirect",
  },
};

export const LOGIN_CONSENT_WEBHOOK_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iSaBWByu4zqhEZ6HQmFxvfR1HyiFuhnJfL",
  hash160result: "19e760a7025856237a57866c92479821bac05cfd",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.webhook",
  },
};

export const LOGIN_CONSENT_CONTEXT_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iBMochrKPSQfua5yZYWyd6p4QnREakqU44",
  hash160result: "3b605d4ace1e19dd0bddb2eef63171b1879a7b56",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.loginconsent.context",
  },
};

export const LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY: VDXFKeyInterface =
{
  vdxfid: "iMiXw4BuL4iESPqz6fvJ4rHbDg1SvVKLnc",
  hash160result: "7b051db57821563ec22544182eb0f4c5308118c8",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.webhooks.provisionidentity",
  },
};

export const ID_ADDRESS_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i3a3M9n7uVtRYv1vhjmyb4DxY825AVAwic",
  hash160result: "63fc04d860fde7b60ddf5d9ef9985b573a0d0b01",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.address",
  },
};

export const ID_SYSTEMID_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iMZTNkNBgBXNHkMLipQw9wQb56pxBSEp3k",
  hash160result: "3e65e72cc0130c87184c91aa4d33cae3fcf460c6",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.systemid",
  },
};

export const ID_FULLYQUALIFIEDNAME_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iCQ5gYekWs5DaXiBN7YfoDfNWT3VtpUwVq",
  hash160result: "4d21dd52ee9d4b6a9f55a452f3ba247006f9e161",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.fullyqualifiedname",
  },
};

export const ID_PARENT_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i6aJSTKfNiDZ4rPxj1pPh4Y8xDmh1GqYm9",
  hash160result: "fe0be7479818a0a41fb4e6bc58a0f34dd6060022",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.parent",
  },
};

export const LOGIN_CONSENT_PROVISIONING_REQUEST_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iAN8hxt2pkU32jvBsXtJ7Nu9sfn9QDgr5q",
  hash160result: "8598120ec657fc662355adc49348c518f869934b",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.request",
  },
};

export const LOGIN_CONSENT_PROVISIONING_CHALLENGE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iLvLAJ2YycueCYMDPJA8DwrenULPJkJgKE",
  hash160result: "7467ddf0c155f0c8dd3f38a68103fe97398b5bbf",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.challenge",
  },
};

export const LOGIN_CONSENT_PROVISIONING_DECISION_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i6VH8kxLH3ERRf7dQCupRW8VKjs7kVAsxR",
  hash160result: "0a7179eea76dea5ceb58ae65c9fbb10c82db0c21",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.decision",
  },
};

export const LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i85sHR4C9BqZkP7BMses4UaggJXwnc4nSx",
  hash160result: "5d8c77fc5e97c49ed7c4babfc693268cdea18f32",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.response",
  },
};

export const LOGIN_CONSENT_PROVISIONING_RESULT_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iGV8yvy8YqLxrd5GcHbX9vRpbajpM1px3w",
  hash160result: "3d379d42a495bd8946833ea2990d4600684fb78e",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.result",
  },
};

export const IDENTITY_NAME_COMMITMENT_TXID: VDXFKeyInterface = {
  vdxfid: "iEJTmGeALUU3ABtVNi8dZwFJk4FqP9N1Et",
  hash160result: "2007222f775f209fccd9d5f16bb2bf6b4529c276",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.txid.namecommitment",
  },
};

export const IDENTITY_REGISTRATION_TXID: VDXFKeyInterface = {
  vdxfid: "iA8weZfoUatpDo7kAMgLjByeNP6G9sbWqG",
  hash160result: "11892abb92a82b94925113361653962a71c61449",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.txid.identityregistration",
  },
};

export const IDENTITY_UPDATE_TXID: VDXFKeyInterface = {
  vdxfid: "iHhzJVTGkzCgwCuLRsFMZ81t3XLxUNGs2D",
  hash160result: "ca480a573642c36f18fb90e2bdabb87207991d9c",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.txid.updateidentity",
  },
};

export const LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGREQUIREDINFO: VDXFKeyInterface =
{
  vdxfid: "iKPocacGnQePtXEfcqBadmmrQA35pbLPhT",
  hash160result: "4412732b594d0bda49917e57b9f886c9a5709dae",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.states.pendingrequiredinfo",
  },
};

export const LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL: VDXFKeyInterface =
{
  vdxfid: "i4MTVaYamSYTSEMRJaaHxKypmmCMack2LZ",
  hash160result: "307c505245e3d2a8ace6f36558eafed5e8eca109",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.states.pendingapproval",
  },
};

export const LOGIN_CONSENT_PROVISIONING_RESULT_STATE_COMPLETE: VDXFKeyInterface =
{
  vdxfid: "iG89yjgnQEqSVv3dShPHpTUkCtJt96gzVU",
  hash160result: "7d8da8429719fc554309f1b2340118522d68bf8a",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.states.complete",
  },
};

export const LOGIN_CONSENT_PROVISIONING_RESULT_STATE_FAILED: VDXFKeyInterface =
{
  vdxfid: "iCF1tj2zY83mgB8JbNg4dvfD2yefvMGZ4p",
  hash160result: "10a31da845d563f37520e82a32474be3ba102b60",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.states.failed",
  },
};

export const LOGIN_CONSENT_PROVISIONING_ERROR_KEY_NAMETAKEN: VDXFKeyInterface =
{
  vdxfid: "iNjhjmfwQGwGXZaXhonZHk4n6Q36JS6fQS",
  hash160result: "672f11be28b26ca7f440c5c2b8aa9e94473b49d3",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.errors.nametaken",
  },
};

export const LOGIN_CONSENT_PROVISIONING_ERROR_KEY_UNKNOWN: VDXFKeyInterface = {
  vdxfid: "i4dhDcmzNGj9SxCJ9DZZHEJKx4jXZdJkU5",
  hash160result: "1560866b0137c0bb444033db2d8368efa609b40c",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.errors.unknown",
  },
};

export const LOGIN_CONSENT_PROVISIONING_ERROR_KEY_COMMIT_FAILED: VDXFKeyInterface =
{
  vdxfid: "iRZSxLxmuaW87SrUV5eqLc9gATQB42RXRP",
  hash160result: "1b69aa9315d450656d8e023a510ad07fe01b41f2",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.errors.commitment",
  },
};

export const LOGIN_CONSENT_PROVISIONING_ERROR_KEY_CREATION_FAILED: VDXFKeyInterface =
{
  vdxfid: "iHMSEbaZw7joHG8mdh4N2XX1ygWWwjLtwr",
  hash160result: "11dd7d101bf5b2854429b0b8816a436d9e823a98",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.errors.creation",
  },
};

export const LOGIN_CONSENT_PROVISIONING_ERROR_KEY_TRANSFER_FAILED: VDXFKeyInterface =
{
  vdxfid: "iMMzX8s3P9syh4Cx6BQLRCuu2aQEzjn7La",
  hash160result: "f7d0e1fe2452f9d7bfc2072f76188379b2f635c4",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.provisioning.errors.transfer",
  },
};

export const SIGNED_SESSION_OBJECT_DATA: VDXFKeyInterface = {
  "vdxfid": "iGQiFxLgGDtpTT9CVBARTjhUMoWnnMetzy",
  "hash160result": "db9e0983fc2da941c8fadee6d08cc6790c02e18d",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::identity.signedsessionobject.data"
  }
};

export const SIGNED_SESSION_OBJECT: VDXFKeyInterface = {
  "vdxfid": "iQFqjYQnaiCPENEShSb8Jy3qD6En43juVr",
  "hash160result": "76733b2dbe76a03c6da94719733c0a06cf82f4e3",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::identity.signedsessionobject"
  }
};

export const CURRENCY_ADDRESS: VDXFKeyInterface = {
  "vdxfid":"iBy2s9cQL9RadMVPjog6bbSV5ityBxTuNR",
  "hash160result":"4fb4c86b8ce18e596e28f62bc9a78f43d738255d",
  "qualifiedname": {
    "namespace":"i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name":"vrsc::currency.address"
  }
}

export const DATA_TYPE_STRING: VDXFKeyInterface = 
  {
    "vdxfid": "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c",
    "hash160result": "e5c061641228a399169211e666de18448b7b8bab",
    "qualifiedname": {
      "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      "name": "vrsc::data.type.string"
    },
};

export const DATA_TYPE_OBJECT_DATADESCRIPTOR: VDXFKeyInterface = {
  vdxfid: "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv",
  hash160result: "4d4f12424ded2033a526a4e2a8835fc5b2eba208",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::data.type.object.datadescriptor"
  }
};

export const DATA_TYPE_OBJECT_CREDENTIAL: VDXFKeyInterface = {
  vdxfid: "iDTG49YLqmkHMYRyuQBYgEyTByQwAzqGd6",
  hash160result: "09fbc202710c9f2dacb87e5623e97e2e4101746d",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::data.type.object.credential"
  },
};

export const IDENTITY_CREDENTIAL_PLAINLOGIN: VDXFKeyInterface = {
  vdxfid: "iHh1FFVvcNb2mcBudD11umfKJXHbBbH6Sj",
  hash160result: "21edefb10b2ea96ffb0fbad986e268164df8ed9b",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.credential.plainlogin"
  }
};

export const IDENTITY_CREDENTIAL_USERNAME: VDXFKeyInterface = {
  vdxfid: "iN6LYCurcypx7orxkFB73mWRq6Jetf23ck",
  hash160result: "9125e70938468eea614a4f538199fa4d052538cc",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.credential.username"
  },
};
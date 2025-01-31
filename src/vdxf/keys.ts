export interface VDXFKeyInterface {
  vdxfid: string;
  hash160result: string;
  qualifiedname: {
    name: string;
    namespace: string;
  };
  bounddata?: {
    vdxfkey: string;
  }
  indexid?: string;
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

export const LOGIN_CONSENT_ATTESTATION_WEBHOOK_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iEiQe3C68gKvAevZWAx6MLmoSR64hVqfMb",
  hash160result: "6759ec3006891e89422e59fb613ab2653389497b",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.attestation.webhook",
  },
};

export const LOGIN_CONSENT_PERSONALINFO_WEBHOOK_VDXF_KEY: VDXFKeyInterface ={
  vdxfid: "i8RW9fcZHh1oaAqR2fWWLCB99mfNW6Q2mQ",
  indexid: "xDFccU3e91EUCLiStMAfJahgBRgPHfYq74",
  hash160result: "fe40712687cd6f9f288e535ced75b653624f4636",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.identitydata.webhook"
  }
}

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

export const ATTESTATION_PROVISION_URL: VDXFKeyInterface = {
  "vdxfid": "iD9J9aQ6vsRYvqZbBs9QpKmCcgUynee7mT",
  "indexid": "xHyQcNqBnBeDZ1Sd3YoZniHjeLVzgLK5ka",
  "hash160result": "e1059d2a03500749f86ed9c49137b86de6430e6a",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.provision.url"
  }
};

export const ATTESTATION_PROVISION_TYPE: VDXFKeyInterface = {
  "vdxfid": "i7VGPAp3q2h4U4njZ556b9eG3Jts2gmzHn",
  "indexid": "xCKNqyF8gLuj6EfmQkjFZYAo4xuswrB6X9",
  "hash160result": "5f922c9d09e0160b7c3bc5f31588dfc11b5b042c",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.provision.type"
  }
};

export const ATTESTATION_PROVISION_OBJECT: VDXFKeyInterface = {
  "vdxfid": "iA4mSmR35HNwXogTtdGasrmxHzX9zFfDqM",
  "indexid": "xEtsuZr7vbbc9yZVkJvjrFJVKeYArDTHtu",
  "hash160result": "568af36801cfae2e1290ecef7a60c7ae0c984a48",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.provision.object"
  }
}


export const ATTESTATION_VIEW_REQUEST: VDXFKeyInterface = {
  "vdxfid": "i5R9p3V1sxZ9p1NDV7nPkz1wvmQTUvuByY",
  "hash160result": "872923256c56f6bda8256c5bb6a4c98d85f44c15",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.view.request"
  }
};

export const ATTESTATION_VIEW_RESPONSE: VDXFKeyInterface = {
  "vdxfid": "i5R9p3V1sxZ9p1NDV7nPkz1wvmQTUvuByY",
  "hash160result": "872923256c56f6bda8256c5bb6a4c98d85f44c15",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.view.response"
  }
};

export const ATTESTATION_ID: VDXFKeyInterface = {
  "vdxfid": "i87ZC3B5EFiKtLW9fCUkw9yoMVmh2i2bZ3",
  "hash160result": "f540229f88da9e3a9f40f99ce5a22afe765ce132",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.id"
  }
};

export const ATTESTATION_NAME: VDXFKeyInterface = {
  "vdxfid": "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1",
  "hash160result": "8a00bdd77505b345ed85d7292459b61457a10d76",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.name"
  }
};

export const ATTESTATION_TYPE: VDXFKeyInterface = {
  "vdxfid": "iAJUD5mgT6MHz8ymF49XUtBDRS7uvYqNWZ",
  "indexid": "xF8aftCmJQZxcJro6jogTGhkT68vqfCDCm",
  "hash160result": "e56544849c038b7cfadb0a1074ac51df9207e24a",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.type"
  }
};

export const ATTESTATION_VIEW_REQUEST_KEY: VDXFKeyInterface = {
  "vdxfid": "i8iRyLrnapw29BTaHYtu7C3wWPtbjKvEJp",
  "indexid": "xDYYS9HsS99gmMLc9EZ45aaUY3ucaC7FDD",
  "hash160result": "fa51ed48a3b250818d2fb1efcdf6275fd2e47939",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.view.request.key"
  }
};

export const ATTESTATION_VIEW_REQUEST_NAME: VDXFKeyInterface = {
  "vdxfid": "i6psJBVkM3yivumyxuhmAwmMYixiFRD9LT",
  "indexid": "xBeykyvqCNCPZ5f1pbMv9LHtaNyjDs5X2m",
  "hash160result": "8bb63c962ccec2eced99eb15f958b2d03247c124",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.view.request.name"
  }
};

export const ATTESTATION_VIEW_REQUEST_ATTESTOR: VDXFKeyInterface = {
  "vdxfid": "iHuiKHNSLJd6xeUCN8etjnTcGgzhDp9Zug",
  "indexid": "xNjpn5oXBcqmapMEDpK3iAz9JM1i7g8cDX",
  "hash160result": "1bdced61a4c500114659b9f15759eea89c3e559e",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.view.request.attestor"
  }
};

export const ATTESTATION_VIEW_REQUEST_ID: VDXFKeyInterface = {
  "vdxfid": "iSoJNm8wz9Jtv69YvReNyRSzBr8KJSXTym",
  "indexid": "xXdQqZa2qTXZYG2an7JXwoyXDW9L9NjTYS",
  "hash160result": "70cbf4f61e3d585bcaac692fa9443a9890e5d7ff",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::attestation.view.request.id"
  }
};

export const PROFILE_DATA_VIEW_REQUEST: VDXFKeyInterface = {
  "vdxfid": "iEocxePWah2zp5Hn4ujeoQpc4UVYeJeQ2g",
  "indexid": "xKdjRSpbS1FfSFAovbPomoM968WZVsmW1E",
  "hash160result": "b1778ef367dbf00e7b9ad15eea2ef17490e6457c",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::profile.data.view.request"
  }
}

export const IDENTITY_SIGNDATA_REQUEST: VDXFKeyInterface = {
  "vdxfid": "i8pWCPRLoGD9MgL7HM13xo5Bhr9TsXjGxs",
  "indexid": "xDecfBrReaRoyrD992fCwBbijWAUi4yjUN",
  "hash160result": "0785689a95a2a08dd2e0efd60b71237e97ea9f3a",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::identity.signdata.request"
  }
}

// DATA TYPES
export const DATA_TYPE_STRING: VDXFKeyInterface = {
    "vdxfid": "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c",
    "hash160result": "e5c061641228a399169211e666de18448b7b8bab",
    "qualifiedname": {
      "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      "name": "vrsc::data.type.string"
    },
};

export const IDENTITY_UPDATE_REQUEST_VDXF_KEY: VDXFKeyInterface = {
  "vdxfid": "iQJAPr53wZnjLyGpGdjiNZhSwSTXSfyoYy",
  "indexid": "xV8GreW8nt1Py99r8KPsLxDyy6UYJQvXja",
  "hash160result": "0bcef8b06c211828d16dc038e4d34d097aeb64e4",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::identity.update.request"
  }
}


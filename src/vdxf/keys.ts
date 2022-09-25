export interface VDXFKeyInterface {
  vdxfid: string;
  hash160result: string;
  qualifiedname: {
    name: string;
    namespace: string;
  };
}

export const LOGIN_CONSENT_REQUEST_SIG_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iBFueEbXnSbohqiHNwwmz8Jb7LJtx2PGFu",
  hash160result: "28657ae163daff6bcb81034044699a4170235e55",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.signature",
  },
};

export const LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iBFueEbXnSbohqiHNwwmz8Jb7LJtx2PGFu",
  hash160result: "28657ae163daff6bcb81034044699a4170235e55",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.signature",
  },
};


export const LOGIN_CONSENT_REQUEST_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iDUwZMSrru6j4Bv1jDKy84xDZ8m2beoCuq",
  hash160result: "9ca63240a17ce53f9707f9df5920e4d39165c56d",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.loginconsent.request",
  },
};

export const LOGIN_CONSENT_OIDC_REQUEST_VDXF_KEY: VDXFKeyInterface = {
  "vdxfid": "i5XKaak5R68S1oW55dDDu7XEkRZpRTFts6",
  "hash160result": "e19a485ca8bce6540ace5f40e415a4a7d29a7716",
  "qualifiedname": {
      "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      "name": "vrsc::system.identity.authentication.loginconsent.oidcrequest"
  }
}

export const LOGIN_CONSENT_RESPONSE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iJQaibDkoUxwGoE2YhZtVVZyhKxZs1G7uU",
  hash160result: "a77ba0f8c5a05fcc1ef0fa0ed93dab1501f7caa3",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.loginconsent.response",
  },
};

export const LOGIN_CONSENT_CHALLENGE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i9dm793ZMVAs2prmdrS9TYLz3FhvhTCsQY",
  hash160result: "d3c4caf0874469673d98b82b02655c4294e98f43",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.loginconsent.request.challenge",
  },
};

export const LOGIN_CONSENT_OIDC_CHALLENGE_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iNiZWvtDmXSeYKNvu8GNZwCT3J9qFMrJwx",
  hash160result: "6c52ec072c07c0b15d5b46f67e18547ce5f311d3",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.loginconsent.request.oidcchallenge",
  },
};

export const LOGIN_CONSENT_DECISION_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "i7bCPAtS12cKwa7VevVZqgRusN4NXVCt5z",
  hash160result: "b870b7693cc7de39b8030dd8fcf99b063d83232d",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.loginconsent.response.decision",
  },
};

export const LOGIN_CONSENT_OIDC_DECISION_VDXF_KEY: VDXFKeyInterface = {
  "vdxfid": "i49KeF2Ucd2NukXTbP2ArHX2JUtfqZRC63",
  "hash160result": "890efbba846eac07b3220d197cfe9f2269615607",
  "qualifiedname": {
      "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      "name": "vrsc::system.identity.authentication.loginconsent.response.oidcdecision"
  }
}

export const LOGIN_CONSENT_OIDC_CLIENT_VDXF_KEY: VDXFKeyInterface = {
  vdxfid: "iGo5omf7RubucEU6nM6THM6bhPgq1SjSqS",
  hash160result: "e3187c990ff432ba56cf3180b3661bcca0251c92",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::system.identity.authentication.loginconsent.oidcclient",
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
  "vdxfid": "iAPmsGJkkpMN1sCTF59fscV7jD8tv1whnk",
  "hash160result": "8109473c99bc48562253bf2ddba2f6bf8cd9e24b",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::system.identity.authentication.loginconsent.redirect"
  }
}

export const LOGIN_CONSENT_WEBHOOK_VDXF_KEY: VDXFKeyInterface = {
  "vdxfid": "iACPLH19SXKHoRJboWoxZHZRHz791Zii41",
  "hash160result": "87b84b3dbfd7948f9156bb8bb81e2ebfab76bb49",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::system.identity.authentication.loginconsent.webhook"
  }
}

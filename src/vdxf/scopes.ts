import { VDXFKeyInterface } from "./keys";

export const IDENTITY_VIEW: VDXFKeyInterface = {
  vdxfid: "iLUrA89mDKnwxZcMiPadfNB9TLp58A2TKU",
  hash160result: "aeab47faa1b2bde2633a63b8284770a8e5c489ba",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.permission.read",
  },
};

export const IDENTITY_AGREEMENT: VDXFKeyInterface = {
  vdxfid: "i3fMEsmYzGbd8s7EM9uKZ28fUf9LZAMnEe",
  hash160result: "894dae7e135484ccfad8924ad59dec9619110c02",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.authentication.permission.agree"
  }
};

export const ATTESTATION_READ_REQUEST: VDXFKeyInterface = {
  vdxfid: "iNqLaiDJjcADGCvXcQZnPqwTqMXzQbDCFu",
  hash160result: "fbd8fe825062b19a9bd26dc51b6f768828115ad4",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::identity.attestation.read"
  }
};

export const PROFILE_DATA_READ_REQUEST: VDXFKeyInterface = {
  vdxfid: "iFYznrRxyHaoJZ91cFDSYGT4szETf4RLRV",
  indexid: "xLP7Fes3pboTvj23TvsbWeybueFUatbQQh",
  hash160result: "d3f2168aad438c6c6eab8f3384458cbebf027a84",
  qualifiedname: {
    namespace: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    name: "vrsc::profile.data.view"
  }
}

export const ATTESTATION_RECEIVE_REQUEST: VDXFKeyInterface = 
{
  "vdxfid": "iQxHMa4cGQRMEVFchV7fah2JDqxjcgMAZK",
  "indexid": "xVnPpNVh7ie1rf8eZAmpZ5YqFVykaYqC8E",
  "hash160result": "b9af87a7313fff9976f29bc6abaffc1674899aeb",
  "qualifiedname": {
    "namespace": "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
    "name": "vrsc::identity.attestation.receive"
  }
}

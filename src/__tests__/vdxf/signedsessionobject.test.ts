import { SignedSessionObject, SignedSessionObjectData } from "../../vdxf/classes";

const DEPRECATION_ERROR = "SignedSessionObject is deprecated and disabled; it will be removed in a future release.";
const SIGNATURE = "AYG2IQABQSAN1fp6A9NIVbxvKuOVLLU+0I+G3oQGbRtS6u4Eampfb217Cdf5FCMScQhV9kMxtjI9GWzpchmjuiTB2tctk6qT";

describe("Deprecated SignedSessionObject", () => {
  test("rejects default construction", () => {
    expect(() => new SignedSessionObject()).toThrow(DEPRECATION_ERROR);
  });

  test("rejects construction with valid session data", () => {
    expect(() => new SignedSessionObject({
      system_id: "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      signing_id: "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU",
      signature: { signature: SIGNATURE },
      data: new SignedSessionObjectData({
        session_id: "iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4",
        timestamp_micro: 2038523,
        body: "request body"
      })
    })).toThrow(DEPRECATION_ERROR);
  });

  test.each(["mixed-case", "lowercase"])("rejects HTTP requests with %s headers", casing => {
    const originalHeaders = {
      "VerusID-Session-ID": "iKNufKJdLX3Xg8qFru9AuLBvivAEJ88PW4",
      "VerusID-Timestamp-Micro": "1",
      "VerusID-Signature": SIGNATURE,
    };
    const headers: { [key: string]: string } = {};
    for (const key of Object.keys(originalHeaders)) {
      headers[casing === "lowercase" ? key.toLowerCase() : key] = originalHeaders[key];
    }

    expect(() => SignedSessionObject.fromHttpRequest(
      headers,
      "request body",
      "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV",
      "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU"
    )).toThrow(DEPRECATION_ERROR);
  });
});

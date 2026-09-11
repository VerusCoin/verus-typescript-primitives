import { ApiCommunication } from "./ApiCommunication";
import { ApiPrimitive, ApiPrimitiveJson, RequestParams } from "./ApiPrimitive";

export function positionalParams(
  params: Array<ApiPrimitive | undefined>
): RequestParams {
  let length = params.length;

  while (length > 0 && params[length - 1] == null) {
    length--;
  }

  return params.slice(0, length).map((param) => (param == null ? null : param));
}

export abstract class ApiRequest implements ApiCommunication {
  chain: string;
  cmd: string;

  abstract getParams(): RequestParams;
  abstract toJson(): ApiPrimitiveJson;

  constructor(chain: string, cmd: string) {
    this.chain = chain;
    this.cmd = cmd;
  }

  prepare(): [string, string, RequestParams] {
    return [this.chain, this.cmd, this.getParams()];
  }
}

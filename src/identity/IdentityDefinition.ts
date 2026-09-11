export type IdentityDefinitionContentMultiMapPrimitive = number | string;
export type IdentityDefinitionContentMultiMapEntry = IdentityDefinitionContentMultiMapPrimitive | IdentityDefinitionContentMultiMapValue | Array<IdentityDefinitionContentMultiMapEntry>;
export type IdentityDefinitionContentMultiMapValue = { [key: string]: IdentityDefinitionContentMultiMapEntry };

export interface IdentityDefinition {
  version?: number;
  flags?: number;
  primaryaddresses: Array<string>;
  minimumsignatures: number;
  name: string;
  identityaddress?: string;
  parent: string;
  systemid?: string;
  contentmap?: { [key: string]: string };
  contentmultimap?: IdentityDefinitionContentMultiMapValue | Array<IdentityDefinitionContentMultiMapValue>;
  revocationauthority?: string;
  recoveryauthority?: string;
  timelock?: number;
}

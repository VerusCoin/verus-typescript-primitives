/** Top-level signdata input fields. Nested mmrdata uses SignDataMMRDataParameters. */
export type SignDataParameters = {
    filename?: string;
    message?: string;
    messagehex?: string;
    messagebase64?: string;
    datahash?: string;
    vdxfdata?: string;
};
/** Data and metadata read by the daemon for an individual mmrdata item. */
export type SignDataMMRDataParameters = Omit<SignDataParameters, "messagehex" | "messagebase64"> & {
    serializedhex?: string;
    serializedbase64?: string;
    label?: string;
    mimetype?: string;
};

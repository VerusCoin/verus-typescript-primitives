import { BN } from "bn.js";
import { CurrencyValueMap } from "../../pbaas/CurrencyValueMap";
import { ReserveTransfer } from "../../pbaas/ReserveTransfer";
import { BigNumber } from "../../utils/types/BigNumber";
import { DEST_ETH, DEST_ID, DEST_PKH, TransferDestination } from "../../pbaas/TransferDestination";
import { fromBase58Check } from "../../utils/address";

describe('Serializes and deserializes token output properly', () => {
  test('conversion to VerusID with native fees, from fractional to reserve', async () => {
    const vdata = "0175939018c507ed9cf366d309d4614b2e43ca3c0082dbea93008303a6ef9ea235635e328124ff3429db9f9e91b64e2d809b2a0414848374dd2a47335f0252c8caa066b94de4bf800fe5548cd120855cfb556307543f86d63d0fec02b5"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.isConversion()).toBe(true)
    expect(trans_frombuf.isImportToSource()).toBe(true)
    expect(trans_frombuf.isPreConversion()).toBe(false)
    expect(trans_frombuf.isFeeOutput()).toBe(false)
    expect(trans_frombuf.isDoubleSend()).toBe(false)
    expect(trans_frombuf.isMint()).toBe(false)
    expect(trans_frombuf.isCrossSystem()).toBe(false)
    expect(trans_frombuf.isBurnChangePrice()).toBe(false)
    expect(trans_frombuf.isBurnChangeWeight()).toBe(false)
    expect(trans_frombuf.isReserveToReserve()).toBe(false)
    expect(trans_frombuf.isRefund()).toBe(false)
    expect(trans_frombuf.isIdentityExport()).toBe(false)
    expect(trans_frombuf.isCurrencyExport()).toBe(false)
    expect(trans_frombuf.isArbitrageOnly()).toBe(false)
    expect(trans_frombuf.feeCurrencyID).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")
    expect(trans_frombuf.feeAmount.toString()).toBe("20010")
    expect(trans_frombuf.transferDestination.getAddressString()).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")
    expect(trans_frombuf.destCurrencyID).toBe("iQP7TeWNDNsF7aaaCkQzNyS4jDjdKncNWf")

    const trans_tobuf = new ReserveTransfer({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM", new BN("1000000000", 10)]
        ]),
        multivalue: false
      }),
      version: new BN(1, 10),
      flags: new BN(515, 10),
      feeCurrencyID: trans_frombuf.feeCurrencyID,
      feeAmount: new BN(trans_frombuf.feeAmount.toString(), 10),
      transferDestination: new TransferDestination({
        type: new BN(4, 10),
        destinationBytes: fromBase58Check(trans_frombuf.transferDestination.getAddressString()).hash,
        fees: new BN(0, 10)
      }),
      destCurrencyID: trans_frombuf.destCurrencyID
    })

    expect(trans_tobuf.toBuffer().toString('hex')).toBe(vdata)
  });

  test('conversion to R-Addr with native fees, from reserve to fractional', async () => {
    const vdata = "01a6ef9ea235635e328124ff3429db9f9e91b64e2d82dbea930003a6ef9ea235635e328124ff3429db9f9e91b64e2d809b2a0214048f85c0afbd2977370b76ab33e2933d2b643a0575939018c507ed9cf366d309d4614b2e43ca3c00"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.isConversion()).toBe(true)
    expect(trans_frombuf.isImportToSource()).toBe(false)
    expect(trans_frombuf.isPreConversion()).toBe(false)
    expect(trans_frombuf.isFeeOutput()).toBe(false)
    expect(trans_frombuf.isDoubleSend()).toBe(false)
    expect(trans_frombuf.isMint()).toBe(false)
    expect(trans_frombuf.isCrossSystem()).toBe(false)
    expect(trans_frombuf.isBurnChangePrice()).toBe(false)
    expect(trans_frombuf.isBurnChangeWeight()).toBe(false)
    expect(trans_frombuf.isReserveToReserve()).toBe(false)
    expect(trans_frombuf.isRefund()).toBe(false)
    expect(trans_frombuf.isIdentityExport()).toBe(false)
    expect(trans_frombuf.isCurrencyExport()).toBe(false)
    expect(trans_frombuf.isArbitrageOnly()).toBe(false)
    expect(trans_frombuf.feeCurrencyID).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")
    expect(trans_frombuf.feeAmount.toString()).toBe("20010")
    expect(trans_frombuf.transferDestination.getAddressString()).toBe("R9hJiQ8Evh2ehU68GveFfXGDwdRcPKSbip")
    expect(trans_frombuf.destCurrencyID).toBe("iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM")

    const trans_tobuf = new ReserveTransfer({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", new BN("1000000000", 10)]
        ]),
        multivalue: false
      }),
      version: new BN(1, 10),
      flags: new BN(3, 10),
      feeCurrencyID: trans_frombuf.feeCurrencyID,
      feeAmount: new BN(trans_frombuf.feeAmount.toString(), 10),
      transferDestination: new TransferDestination({
        type: new BN(2, 10),
        destinationBytes: fromBase58Check(trans_frombuf.transferDestination.getAddressString()).hash,
        fees: new BN(0, 10)
      }),
      destCurrencyID: trans_frombuf.destCurrencyID
    })

    expect(trans_tobuf.toBuffer().toString('hex')).toBe(vdata)
  });

  test('conversion to VerusID with native fees, from native to off-chain bridge', async () => {
    const vdata = "01a6ef9ea235635e328124ff3429db9f9e91b64e2ddc8ff5f30043a6ef9ea235635e328124ff3429db9f9e91b64e2d8994240414848374dd2a47335f0252c8caa066b94de4bf800f65ffba3d69510d6f31845e60b9ee0c275389f84fcd51509db53e822df7eed11cac11e7b729e22400"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.isConversion()).toBe(true)
    expect(trans_frombuf.isImportToSource()).toBe(false)
    expect(trans_frombuf.isPreConversion()).toBe(false)
    expect(trans_frombuf.isFeeOutput()).toBe(false)
    expect(trans_frombuf.isDoubleSend()).toBe(false)
    expect(trans_frombuf.isMint()).toBe(false)
    expect(trans_frombuf.isCrossSystem()).toBe(true)
    expect(trans_frombuf.isBurnChangePrice()).toBe(false)
    expect(trans_frombuf.isBurnChangeWeight()).toBe(false)
    expect(trans_frombuf.isReserveToReserve()).toBe(false)
    expect(trans_frombuf.isRefund()).toBe(false)
    expect(trans_frombuf.isIdentityExport()).toBe(false)
    expect(trans_frombuf.isCurrencyExport()).toBe(false)
    expect(trans_frombuf.isArbitrageOnly()).toBe(false)
    expect(trans_frombuf.feeCurrencyID).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")
    expect(trans_frombuf.feeAmount.toString()).toBe("166564")
    expect(trans_frombuf.transferDestination.getAddressString()).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")
    expect(trans_frombuf.destCurrencyID).toBe("iCmr2i7wECJzuGisQeUFQJJCASW66Jp7QG")
    expect(trans_frombuf.destSystemID).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu")

    const trans_tobuf = new ReserveTransfer({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", new BN("25000000000", 10)]
        ]),
        multivalue: false
      }),
      version: new BN(1, 10),
      flags: new BN(67, 10),
      feeCurrencyID: trans_frombuf.feeCurrencyID,
      feeAmount: new BN(trans_frombuf.feeAmount.toString(), 10),
      transferDestination: new TransferDestination({
        type: new BN(4, 10),
        destinationBytes: fromBase58Check(trans_frombuf.transferDestination.getAddressString()).hash,
        fees: new BN(0, 10)
      }),
      destCurrencyID: trans_frombuf.destCurrencyID,
      destSystemID: trans_frombuf.destSystemID
    })

    expect(trans_tobuf.toBuffer().toString('hex')).toBe(vdata)
  });

  test('conversion to R-addr with native fees, from native via off-chain bridge to off-chain currency', async () => {
    const vdata = "01a6ef9ea235635e328124ff3429db9f9e91b64e2ddc8ff5f3008743a6ef9ea235635e328124ff3429db9f9e91b64e2d89942402149726d26ec83c44ed77d2c464b5107c0d164b813065ffba3d69510d6f31845e60b9ee0c275389f84fcd51509db53e822df7eed11cac11e7b729e22400cd51509db53e822df7eed11cac11e7b729e22400"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.isConversion()).toBe(true)
    expect(trans_frombuf.isImportToSource()).toBe(false)
    expect(trans_frombuf.isPreConversion()).toBe(false)
    expect(trans_frombuf.isFeeOutput()).toBe(false)
    expect(trans_frombuf.isDoubleSend()).toBe(false)
    expect(trans_frombuf.isMint()).toBe(false)
    expect(trans_frombuf.isCrossSystem()).toBe(true)
    expect(trans_frombuf.isBurnChangePrice()).toBe(false)
    expect(trans_frombuf.isBurnChangeWeight()).toBe(false)
    expect(trans_frombuf.isReserveToReserve()).toBe(true)
    expect(trans_frombuf.isRefund()).toBe(false)
    expect(trans_frombuf.isIdentityExport()).toBe(false)
    expect(trans_frombuf.isCurrencyExport()).toBe(false)
    expect(trans_frombuf.isArbitrageOnly()).toBe(false)
    expect(trans_frombuf.feeCurrencyID).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")
    expect(trans_frombuf.feeAmount.toString()).toBe("166564")
    expect(trans_frombuf.transferDestination.getAddressString()).toBe("RP4Qct9197i5vrS11qHVtdyRRoAHVNJS47")
    expect(trans_frombuf.destCurrencyID).toBe("iCmr2i7wECJzuGisQeUFQJJCASW66Jp7QG")
    expect(trans_frombuf.destSystemID).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu")
    expect(trans_frombuf.secondReserveID).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu")

    const trans_tobuf = new ReserveTransfer({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", new BN("25000000000", 10)]
        ]),
        multivalue: false
      }),
      version: new BN(1, 10),
      flags: new BN(1091, 10),
      feeCurrencyID: trans_frombuf.feeCurrencyID,
      feeAmount: new BN(trans_frombuf.feeAmount.toString(), 10),
      transferDestination: new TransferDestination({
        type: new BN(2, 10),
        destinationBytes: fromBase58Check(trans_frombuf.transferDestination.getAddressString()).hash,
        fees: new BN(0, 10)
      }),
      destCurrencyID: trans_frombuf.destCurrencyID,
      destSystemID: trans_frombuf.destSystemID,
      secondReserveID: trans_frombuf.secondReserveID
    })

    expect(trans_tobuf.toBuffer().toString('hex')).toBe(vdata)
  });

  test('conversion to VerusID with native fees, from native via fractional', async () => {
    const vdata = "01a6ef9ea235635e328124ff3429db9f9e91b64e2ddc8ff5f3008703a6ef9ea235635e328124ff3429db9f9e91b64e2d809b2a0414848374dd2a47335f0252c8caa066b94de4bf800f5c6027dfe6b2f26d8654bf9b23ad7327b4f650664bde3aeebff63e860a64f9f2f174980abe2bd346"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.isConversion()).toBe(true)
    expect(trans_frombuf.isImportToSource()).toBe(false)
    expect(trans_frombuf.isPreConversion()).toBe(false)
    expect(trans_frombuf.isFeeOutput()).toBe(false)
    expect(trans_frombuf.isDoubleSend()).toBe(false)
    expect(trans_frombuf.isMint()).toBe(false)
    expect(trans_frombuf.isCrossSystem()).toBe(false)
    expect(trans_frombuf.isBurnChangePrice()).toBe(false)
    expect(trans_frombuf.isBurnChangeWeight()).toBe(false)
    expect(trans_frombuf.isReserveToReserve()).toBe(true)
    expect(trans_frombuf.isRefund()).toBe(false)
    expect(trans_frombuf.isIdentityExport()).toBe(false)
    expect(trans_frombuf.isCurrencyExport()).toBe(false)
    expect(trans_frombuf.isArbitrageOnly()).toBe(false)
    expect(trans_frombuf.feeCurrencyID).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")
    expect(trans_frombuf.feeAmount.toString()).toBe("20010")
    expect(trans_frombuf.transferDestination.getAddressString()).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")
    expect(trans_frombuf.destCurrencyID).toBe("iBtxnk8gKmgr6jASweZqe6SP6bWZbkV21e")
    expect(trans_frombuf.secondReserveID).toBe("iAPgLHjmWZBA4wpfesNT81vMjSoTacgwuU")

    const trans_tobuf = new ReserveTransfer({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", new BN("25000000000", 10)]
        ]),
        multivalue: false
      }),
      version: new BN(1, 10),
      flags: new BN(1027, 10),
      feeCurrencyID: trans_frombuf.feeCurrencyID,
      feeAmount: new BN(trans_frombuf.feeAmount.toString(), 10),
      transferDestination: new TransferDestination({
        type: new BN(4, 10),
        destinationBytes: fromBase58Check(trans_frombuf.transferDestination.getAddressString()).hash,
        fees: new BN(0, 10)
      }),
      destCurrencyID: trans_frombuf.destCurrencyID,
      secondReserveID: trans_frombuf.secondReserveID
    })

    expect(trans_tobuf.toBuffer().toString('hex')).toBe(vdata)
  });

  test('conversion to VerusID with native fees, from native to fractional as preconvert', async () => {
    const vdata = "01a6ef9ea235635e328124ff3429db9f9e91b64e2ddc8ff5f30007a6ef9ea235635e328124ff3429db9f9e91b64e2d809b200414848374dd2a47335f0252c8caa066b94de4bf800fcac28788c8b70db738fc3ee9e28923004ffbc71f"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.isConversion()).toBe(true)
    expect(trans_frombuf.isImportToSource()).toBe(false)
    expect(trans_frombuf.isPreConversion()).toBe(true)
    expect(trans_frombuf.isFeeOutput()).toBe(false)
    expect(trans_frombuf.isDoubleSend()).toBe(false)
    expect(trans_frombuf.isMint()).toBe(false)
    expect(trans_frombuf.isCrossSystem()).toBe(false)
    expect(trans_frombuf.isBurnChangePrice()).toBe(false)
    expect(trans_frombuf.isBurnChangeWeight()).toBe(false)
    expect(trans_frombuf.isReserveToReserve()).toBe(false)
    expect(trans_frombuf.isRefund()).toBe(false)
    expect(trans_frombuf.isIdentityExport()).toBe(false)
    expect(trans_frombuf.isCurrencyExport()).toBe(false)
    expect(trans_frombuf.isArbitrageOnly()).toBe(false)
    expect(trans_frombuf.feeCurrencyID).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")
    expect(trans_frombuf.feeAmount.toString()).toBe("20000")
    expect(trans_frombuf.transferDestination.getAddressString()).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")
    expect(trans_frombuf.destCurrencyID).toBe("iMxcxy7b8B62UM8sumRpjSMJzo95ZKLE5R")

    const trans_tobuf = new ReserveTransfer({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", new BN("25000000000", 10)]
        ]),
        multivalue: false
      }),
      version: new BN(1, 10),
      flags: new BN(7, 10),
      feeCurrencyID: trans_frombuf.feeCurrencyID,
      feeAmount: new BN(trans_frombuf.feeAmount.toString(), 10),
      transferDestination: new TransferDestination({
        type: new BN(4, 10),
        destinationBytes: fromBase58Check(trans_frombuf.transferDestination.getAddressString()).hash,
        fees: new BN(0, 10)
      }),
      destCurrencyID: trans_frombuf.destCurrencyID
    })

    expect(trans_tobuf.toBuffer().toString('hex')).toBe(vdata)
  });

  test('Decodes reservetransfer with auxdests', async () => {
    const vdata = "01a6ef9ea235635e328124ff3429db9f9e91b64e2da49faec7008743a6ef9ea235635e328124ff3429db9f9e91b64e2d91a6604214402f01e78edb0f5c8251658dde07f0d52b12e97201160214402f01e78edb0f5c8251658dde07f0d52b12e97265ffba3d69510d6f31845e60b9ee0c275389f84fcd51509db53e822df7eed11cac11e7b729e22400cd51509db53e822df7eed11cac11e7b729e22400"
    
    const trans_frombuf = new ReserveTransfer()
    trans_frombuf.fromBuffer(Buffer.from(vdata, 'hex'))

    expect(trans_frombuf.transferDestination.getAddressString()).toBe("RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN")
    expect(trans_frombuf.transferDestination.auxDests[0].getAddressString()).toBe("RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN")
  });

  test('transferdestination getAddressString work as intended', async () => {
    const destpkh = "R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx";
    const desteth = "0x1f9090aae28b8a3dceadf281b0f12828e676c326";
    const destid = "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm";

    const transdestpkh = new TransferDestination({
      type: DEST_PKH,
      destinationBytes: fromBase58Check(destpkh).hash
    });
    expect(transdestpkh.getAddressString()).toBe(destpkh);
    expect(transdestpkh.isPKH()).toBe(true);
    expect(transdestpkh.isETHAccount()).toBe(false);
    expect(transdestpkh.isIAddr()).toBe(false);

    const transdesteth = new TransferDestination({
      type: DEST_ETH,
      destinationBytes: Buffer.from(desteth.substring(2), 'hex')
    });
    expect(transdesteth.getAddressString()).toBe(desteth);
    expect(transdesteth.isETHAccount()).toBe(true);
    expect(transdesteth.isPKH()).toBe(false);
    expect(transdesteth.isIAddr()).toBe(false);

    const transdestid = new TransferDestination({
      type: DEST_ID,
      destinationBytes: fromBase58Check(destid).hash
    });
    expect(transdestid.getAddressString()).toBe(destid);
    expect(transdestid.isIAddr()).toBe(true);
    expect(transdestid.isETHAccount()).toBe(false);
    expect(transdestid.isPKH()).toBe(false);
  });
});
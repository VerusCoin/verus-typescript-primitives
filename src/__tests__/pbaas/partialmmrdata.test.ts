import { BN } from 'bn.js'
import { PartialMMRData, PartialMMRDataInitData } from '../../pbaas/PartialMMRData'

describe('Serializes and deserializes PartialMMRData properly', () => {
  test('Round-trip serialize/deserialize while removing various fields', () => {
    // Define a base set of parameters for PartialMMRData
    const baseData: PartialMMRDataInitData = {
      flags: new BN('0', 10),
      data: [
        { type: new BN('2', 10), data: Buffer.from('src/__tests__/pbaas/partialmmrdata.test.ts', 'utf-8') },
        { type: new BN('3', 10), data: Buffer.from('Hello test message 12345', 'utf-8') },
      ],
      salt: [Buffer.from('=H319X:)@H2Z'), Buffer.from('s*1UHmVr?feI')],
      hashtype: new BN('1', 10), // e.g. PartialMMRData.HASH_TYPE_SHA256
      priormmr: [
        Buffer.from('80a28cdff6bd91a2e96a473c234371fd8b67705a8c4956255ce7b8c7bf20470f02381c9a935f06cdf986a7c5facd77625befa11cf9fd4b59857b457394a8af979ab2830087a3b27041b37bc318484175'), 
        Buffer.from('d97fd4bbd9e88ca0c5822c12d5c9b272b2044722aa48b1c8fde178be6b59ccea509f403d3acd226c16ba3c32f0cb92e2fcaaa02b40d0bc5257e0fbf2e6c3d3d7f1a1df066967b193d131158ba5bef732')
      ],
    }

    // Create a list of PartialMMRDataInitData by removing one field at a time from baseData
    const partialMMRDataList: PartialMMRDataInitData[] = []
    const removeKeys = ['salt', 'priormmr'] as const

    // Always include the base data itself
    partialMMRDataList.push(baseData)

    for (const keyToRemove of removeKeys) {
      const newData = { ...baseData }
      delete newData[keyToRemove]
      partialMMRDataList.push(newData)
    }

    // Verify round-trip serialization/deserialization for each config
    partialMMRDataList.forEach((params, index) => {
      const mmrData = new PartialMMRData(params)
      const buffer = mmrData.toBuffer()

      const mmrDataFromBuf = new PartialMMRData()
      mmrDataFromBuf.fromBuffer(buffer)

      const roundTripped = mmrDataFromBuf.toBuffer()
      
      expect(roundTripped.toString('hex')).toBe(buffer.toString('hex'))
    })
  })
})
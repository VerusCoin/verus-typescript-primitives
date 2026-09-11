import { BN } from 'bn.js';

export const GetMMRProofIndex = (pos: number, mmvSize: number, extraHashes: number): InstanceType<typeof BN> => {
    if (
      !Number.isSafeInteger(pos) ||
      !Number.isSafeInteger(mmvSize) ||
      !Number.isSafeInteger(extraHashes) ||
      pos < 0 ||
      mmvSize < 0 ||
      extraHashes < 0
    ) {
      throw new RangeError("MMR proof index inputs must be non-negative safe integers");
    }

    let index = new BN(0);
    let layerSizes = [];
    let merkleSizes = [];
    let peakIndexes = [];
    let bitPos = 0;
  
    //start at the beginning
    //create a simulation of a mmr based on size
    if (!(pos > 0 && pos < mmvSize)) return new BN(0);
  
    //create an array of all the sizes
    while (mmvSize) {
      layerSizes.push(mmvSize);
      mmvSize = Math.floor(mmvSize / 2)
    }
  
    for (let height = 0; height < layerSizes.length; height++) {
      if (height == layerSizes.length - 1 || layerSizes[height] % 2) {
        peakIndexes.push(height);
      }
    }
  
    //array flip peak indexes
    peakIndexes.reverse();
  
    let layerNum = 0;
    let layerSize = peakIndexes.length;
  
    for (let passThrough = (layerSize % 2); layerNum == 0 || layerSize > 1; passThrough = (layerSize % 2), layerNum++) {
      layerSize = Math.floor(layerSize / 2) + passThrough;
      if (layerSize) {
        merkleSizes.push(layerSize);
      }
    }
    //flip the merklesizes
  
    for (let i = 0; i < extraHashes; i++) {
      bitPos++;
    }
  
    let p = pos;
    for (let l = 0; l < layerSizes.length; l++) {
      if (p % 2) {
        index = index.or(new BN(1).shln(bitPos++));
  
        p = Math.floor(p / 2);
  
        for (let i = 0; i < extraHashes; i++) {
          bitPos++;
        }
  
      } else {
        if (layerSizes[l] > (p + 1)) {
  
          bitPos++;
          p = Math.floor(p / 2);
          for (let i = 0; i < extraHashes; i++) {
            bitPos++;
          }
        } else {
  
          for (p = 0; p < peakIndexes.length; p++) {
  
            if (peakIndexes[p] == l) {
              break;
            }
          }
  
          for (let layerNum = -1, layerSize = peakIndexes.length; layerNum == -1 || layerSize > 1; layerSize = merkleSizes[++layerNum]) {
  
            if (p < (layerSize - 1) || (p % 2)) {
  
  
              if (p % 2) {
                // hash with the one before us
                index = index.or(new BN(1).shln(bitPos++));
  
                for (let i = 0; i < extraHashes; i++) {
                  bitPos++;
                }
              } else {
                // hash with the one in front of us
                bitPos++;
  
                for (let i = 0; i < extraHashes; i++) {
                  bitPos++;
                }
              }
            }
            p = Math.floor(p / 2);
          }
  
          break;
        }
  
      }
    }
    return index;
  }

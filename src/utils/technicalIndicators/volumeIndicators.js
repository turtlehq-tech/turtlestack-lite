// src/utils/technicalIndicators/volumeIndicators.js
// Volume-based Technical Indicators

export class VolumeIndicators {
  /**
   * Calculate OBV (On-Balance Volume)
   */
  static calculateOBV(closes, volumes) {
    if (closes.length !== volumes.length || closes.length < 2) return [];
    
    const obv = [volumes[0]];
    
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv.push(obv[i - 1] + volumes[i]);
      } else if (closes[i] < closes[i - 1]) {
        obv.push(obv[i - 1] - volumes[i]);
      } else {
        obv.push(obv[i - 1]);
      }
    }
    
    return obv;
  }
}
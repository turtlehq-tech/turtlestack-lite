// src/utils/technicalIndicators/trendIndicators.js
// Trend-based Technical Indicators

export class TrendIndicators {
  /**
   * Calculate Simple Moving Average
   */
  static calculateSMA(prices, period) {
    if (prices.length < period) return [];
    
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calculate Exponential Moving Average
   */
  static calculateEMA(prices, period) {
    if (prices.length < period) return [];
    
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    return ema.slice(period - 1);
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   */
  static calculateVWAP(ohlcData) {
    if (!ohlcData || ohlcData.length === 0) return [];
    
    const vwap = [];
    let cumulativeVolume = 0;
    let cumulativePriceVolume = 0;
    
    for (let i = 0; i < ohlcData.length; i++) {
      const candle = ohlcData[i];
      const volume = candle.volume || candle.v || 0;
      const typicalPrice = ((candle.high || candle.h) + (candle.low || candle.l) + (candle.close || candle.c)) / 3;
      
      cumulativeVolume += volume;
      cumulativePriceVolume += (typicalPrice * volume);
      
      if (cumulativeVolume > 0) {
        vwap.push(cumulativePriceVolume / cumulativeVolume);
      } else {
        vwap.push(typicalPrice);
      }
    }
    
    return vwap;
  }

  /**
   * Calculate Parabolic SAR
   */
  static calculateParabolicSAR(highs, lows, acceleration = 0.02, maximum = 0.2) {
    if (highs.length < 2 || lows.length < 2) return [];
    
    const sar = [];
    let af = acceleration;
    let ep = highs[0]; // Extreme Point
    let trend = 1; // 1 for uptrend, -1 for downtrend
    sar[0] = lows[0];
    
    for (let i = 1; i < highs.length; i++) {
      // Calculate SAR
      const prevSAR = sar[i - 1];
      let currentSAR = prevSAR + af * (ep - prevSAR);
      
      if (trend === 1) { // Uptrend
        currentSAR = Math.min(currentSAR, lows[i - 1], i > 1 ? lows[i - 2] : lows[i - 1]);
        
        if (lows[i] <= currentSAR) {
          trend = -1;
          currentSAR = ep;
          ep = lows[i];
          af = acceleration;
        } else {
          if (highs[i] > ep) {
            ep = highs[i];
            af = Math.min(af + acceleration, maximum);
          }
        }
      } else { // Downtrend
        currentSAR = Math.max(currentSAR, highs[i - 1], i > 1 ? highs[i - 2] : highs[i - 1]);
        
        if (highs[i] >= currentSAR) {
          trend = 1;
          currentSAR = ep;
          ep = highs[i];
          af = acceleration;
        } else {
          if (lows[i] < ep) {
            ep = lows[i];
            af = Math.min(af + acceleration, maximum);
          }
        }
      }
      
      sar.push(currentSAR);
    }
    
    return sar;
  }

  /**
   * Calculate ADX (Average Directional Index)
   */
  static calculateADX(highs, lows, closes, period = 14) {
    if (highs.length < period * 2 || lows.length < period * 2 || closes.length < period * 2) {
      return { adx: [], plusDI: [], minusDI: [] };
    }
    
    const trueRanges = [];
    const plusDM = [];
    const minusDM = [];
    
    // Calculate True Range, +DM, -DM
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
      
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
    
    // Calculate smoothed TR, +DM, -DM
    const smoothedTR = TrendIndicators.calculateEMA(trueRanges, period);
    const smoothedPlusDM = TrendIndicators.calculateEMA(plusDM, period);
    const smoothedMinusDM = TrendIndicators.calculateEMA(minusDM, period);
    
    // Calculate +DI and -DI
    const plusDI = smoothedPlusDM.map((val, i) => (val / smoothedTR[i]) * 100);
    const minusDI = smoothedMinusDM.map((val, i) => (val / smoothedTR[i]) * 100);
    
    // Calculate DX and ADX
    const dx = [];
    for (let i = 0; i < plusDI.length; i++) {
      const sum = plusDI[i] + minusDI[i];
      if (sum > 0) {
        dx.push(Math.abs(plusDI[i] - minusDI[i]) / sum * 100);
      } else {
        dx.push(0);
      }
    }
    
    const adx = TrendIndicators.calculateEMA(dx, period);
    
    return { adx, plusDI, minusDI };
  }
}
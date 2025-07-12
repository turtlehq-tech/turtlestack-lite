// src/utils/technicalIndicators/volatilityIndicators.js
// Volatility-based Technical Indicators

export class VolatilityIndicators {
  /**
   * Calculate Simple Moving Average (needed for Bollinger Bands)
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
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(prices, period = 20, standardDeviations = 2) {
    if (prices.length < period) return { upperBand: [], middleBand: [], lowerBand: [] };
    
    const sma = VolatilityIndicators.calculateSMA(prices, period);
    const upperBand = [];
    const lowerBand = [];
    
    for (let i = 0; i < sma.length; i++) {
      const dataSlice = prices.slice(i, i + period);
      const mean = sma[i];
      
      // Calculate standard deviation
      const variance = dataSlice.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      upperBand.push(mean + (standardDeviations * stdDev));
      lowerBand.push(mean - (standardDeviations * stdDev));
    }
    
    return {
      upperBand: upperBand,
      middleBand: sma,
      lowerBand: lowerBand
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  static calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
      return [];
    }
    
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate ATR using Wilder's smoothing
    const atr = [];
    let sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    atr.push(sum / period);
    
    for (let i = period; i < trueRanges.length; i++) {
      const newATR = ((atr[atr.length - 1] * (period - 1)) + trueRanges[i]) / period;
      atr.push(newATR);
    }
    
    return atr;
  }
}
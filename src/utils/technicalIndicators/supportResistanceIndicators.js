// src/utils/technicalIndicators/supportResistanceIndicators.js
// Support & Resistance Level Indicators

export class SupportResistanceIndicators {
  /**
   * Calculate Fibonacci Retracement Levels
   */
  static calculateFibonacci(high, low) {
    const diff = high - low;
    
    return {
      level_0: high,
      level_236: high - (diff * 0.236),
      level_382: high - (diff * 0.382),
      level_500: high - (diff * 0.5),
      level_618: high - (diff * 0.618),
      level_786: high - (diff * 0.786),
      level_100: low
    };
  }

  /**
   * Calculate Support and Resistance Levels
   */
  static calculateSupportResistance(highs, lows, period = 20) {
    if (highs.length < period || lows.length < period) return { support: [], resistance: [] };
    
    const support = [];
    const resistance = [];
    
    for (let i = period; i < highs.length - period; i++) {
      const slice = highs.slice(i - period, i + period + 1);
      const lowSlice = lows.slice(i - period, i + period + 1);
      
      const isResistance = highs[i] === Math.max(...slice);
      const isSupport = lows[i] === Math.min(...lowSlice);
      
      if (isResistance) resistance.push({ index: i, level: highs[i] });
      if (isSupport) support.push({ index: i, level: lows[i] });
    }
    
    return { support, resistance };
  }
}
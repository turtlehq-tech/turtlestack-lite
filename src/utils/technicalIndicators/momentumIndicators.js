// src/utils/technicalIndicators/momentumIndicators.js
// Momentum-based Technical Indicators

export class MomentumIndicators {
  /**
   * Calculate Exponential Moving Average (needed for MACD)
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
   * Calculate Simple Moving Average (needed for Stochastic)
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
   * Calculate RSI (Relative Strength Index)
   */
  static calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return [];
    
    const gains = [];
    const losses = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate average gains and losses
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const rsi = [];
    
    for (let i = period; i < gains.length; i++) {
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
      
      // Update averages using Wilder's smoothing
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
    
    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = MomentumIndicators.calculateEMA(prices, fastPeriod);
    const slowEMA = MomentumIndicators.calculateEMA(prices, slowPeriod);
    
    if (fastEMA.length === 0 || slowEMA.length === 0) return { macdLine: [], signalLine: [], histogram: [] };
    
    // MACD Line = FastEMA - SlowEMA
    const macdLine = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < slowEMA.length; i++) {
      macdLine.push(fastEMA[i + startIndex] - slowEMA[i]);
    }
    
    // Signal Line = EMA of MACD Line
    const signalLine = MomentumIndicators.calculateEMA(macdLine, signalPeriod);
    
    // Histogram = MACD Line - Signal Line
    const histogram = [];
    const signalStartIndex = macdLine.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + signalStartIndex] - signalLine[i]);
    }
    
    return {
      macdLine: macdLine.slice(signalStartIndex),
      signalLine: signalLine,
      histogram: histogram
    };
  }

  /**
   * Calculate Stochastic Oscillator
   */
  static calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) {
      return { kPercent: [], dPercent: [] };
    }
    
    const kPercent = [];
    
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      
      if (highestHigh === lowestLow) {
        kPercent.push(0);
      } else {
        kPercent.push(((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100);
      }
    }
    
    const dPercent = MomentumIndicators.calculateSMA(kPercent, dPeriod);
    
    return {
      kPercent: kPercent.slice(dPeriod - 1),
      dPercent: dPercent
    };
  }

  /**
   * Calculate Williams %R
   */
  static calculateWilliamsR(highs, lows, closes, period = 14) {
    if (highs.length < period || lows.length < period || closes.length < period) {
      return [];
    }
    
    const williamsR = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      
      if (highestHigh === lowestLow) {
        williamsR.push(0);
      } else {
        williamsR.push(((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100);
      }
    }
    
    return williamsR;
  }

  /**
   * Calculate CCI (Commodity Channel Index)
   */
  static calculateCCI(highs, lows, closes, period = 20) {
    if (highs.length < period || lows.length < period || closes.length < period) {
      return [];
    }
    
    const typicalPrices = [];
    for (let i = 0; i < highs.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    const smaTP = MomentumIndicators.calculateSMA(typicalPrices, period);
    const cci = [];
    
    for (let i = 0; i < smaTP.length; i++) {
      const slice = typicalPrices.slice(i, i + period);
      const mean = smaTP[i];
      const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - mean), 0) / period;
      
      if (meanDeviation !== 0) {
        cci.push((typicalPrices[i + period - 1] - mean) / (0.015 * meanDeviation));
      } else {
        cci.push(0);
      }
    }
    
    return cci;
  }

  /**
   * Calculate Money Flow Index (MFI)
   */
  static calculateMFI(highs, lows, closes, volumes, period = 14) {
    if (highs.length < period + 1 || volumes.length < period + 1) return [];
    
    const typicalPrices = [];
    const rawMoneyFlow = [];
    
    for (let i = 0; i < highs.length; i++) {
      const tp = (highs[i] + lows[i] + closes[i]) / 3;
      typicalPrices.push(tp);
      rawMoneyFlow.push(tp * volumes[i]);
    }
    
    const mfi = [];
    
    for (let i = period; i < typicalPrices.length; i++) {
      let positiveFlow = 0;
      let negativeFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        if (typicalPrices[j] > typicalPrices[j - 1]) {
          positiveFlow += rawMoneyFlow[j];
        } else if (typicalPrices[j] < typicalPrices[j - 1]) {
          negativeFlow += rawMoneyFlow[j];
        }
      }
      
      const moneyRatio = negativeFlow !== 0 ? positiveFlow / negativeFlow : 100;
      mfi.push(100 - (100 / (1 + moneyRatio)));
    }
    
    return mfi;
  }
}
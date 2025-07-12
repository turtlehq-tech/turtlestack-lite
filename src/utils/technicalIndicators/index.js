// src/utils/technicalIndicators/index.js
// Main Technical Indicators Module - Re-exports all indicator categories

import { TrendIndicators } from './trendIndicators.js';
import { MomentumIndicators } from './momentumIndicators.js';
import { VolatilityIndicators } from './volatilityIndicators.js';
import { VolumeIndicators } from './volumeIndicators.js';
import { SupportResistanceIndicators } from './supportResistanceIndicators.js';

export class TechnicalIndicators {
  // Trend Indicators
  static calculateSMA = TrendIndicators.calculateSMA;
  static calculateEMA = TrendIndicators.calculateEMA;
  static calculateVWAP = TrendIndicators.calculateVWAP;
  static calculateParabolicSAR = TrendIndicators.calculateParabolicSAR;
  static calculateADX = TrendIndicators.calculateADX;

  // Momentum Indicators
  static calculateRSI = MomentumIndicators.calculateRSI;
  static calculateMACD = MomentumIndicators.calculateMACD;
  static calculateStochastic = MomentumIndicators.calculateStochastic;
  static calculateWilliamsR = MomentumIndicators.calculateWilliamsR;
  static calculateCCI = MomentumIndicators.calculateCCI;
  static calculateMFI = MomentumIndicators.calculateMFI;

  // Volatility Indicators  
  static calculateBollingerBands = VolatilityIndicators.calculateBollingerBands;
  static calculateATR = VolatilityIndicators.calculateATR;

  // Volume Indicators
  static calculateOBV = VolumeIndicators.calculateOBV;

  // Support & Resistance
  static calculateFibonacci = SupportResistanceIndicators.calculateFibonacci;
  static calculateSupportResistance = SupportResistanceIndicators.calculateSupportResistance;

  /**
   * Process historical data and calculate all indicators
   */
  static processHistoricalData(ohlcData, indicators = ['RSI', 'MACD', 'BOLLINGER']) {
    if (!ohlcData || ohlcData.length === 0) {
      throw new Error('No historical data provided');
    }
    
    // Extract price arrays
    const opens = ohlcData.map(candle => candle.open || candle.o);
    const highs = ohlcData.map(candle => candle.high || candle.h);
    const lows = ohlcData.map(candle => candle.low || candle.l);
    const closes = ohlcData.map(candle => candle.close || candle.c);
    const volumes = ohlcData.map(candle => candle.volume || candle.v || 0);
    
    const results = {};
    
    indicators.forEach(indicator => {
      switch (indicator.toUpperCase()) {
        case 'RSI':
          results.rsi = this.calculateRSI(closes);
          break;
        case 'MACD':
          results.macd = this.calculateMACD(closes);
          break;
        case 'BOLLINGER':
        case 'BOLLINGER_BANDS':
          results.bollingerBands = this.calculateBollingerBands(closes);
          break;
        case 'SMA':
          results.sma = this.calculateSMA(closes, 20);
          break;
        case 'EMA':
          results.ema = this.calculateEMA(closes, 20);
          break;
        case 'STOCHASTIC':
          results.stochastic = this.calculateStochastic(highs, lows, closes);
          break;
        case 'WILLIAMS_R':
          results.williamsR = this.calculateWilliamsR(highs, lows, closes);
          break;
        case 'VWAP':
          results.vwap = this.calculateVWAP(ohlcData);
          break;
        case 'ATR':
          results.atr = this.calculateATR(highs, lows, closes);
          break;
        case 'ADX':
          results.adx = this.calculateADX(highs, lows, closes);
          break;
        case 'PARABOLIC_SAR':
        case 'SAR':
          results.parabolicSAR = this.calculateParabolicSAR(highs, lows);
          break;
        case 'CCI':
          results.cci = this.calculateCCI(highs, lows, closes);
          break;
        case 'OBV':
          results.obv = this.calculateOBV(closes, volumes);
          break;
        case 'MFI':
          results.mfi = this.calculateMFI(highs, lows, closes, volumes);
          break;
        case 'SUPPORT_RESISTANCE':
          results.supportResistance = this.calculateSupportResistance(highs, lows);
          break;
      }
    });
    
    return results;
  }
}

// Re-export individual indicator classes for direct access
export {
  TrendIndicators,
  MomentumIndicators,
  VolatilityIndicators,
  VolumeIndicators,
  SupportResistanceIndicators
};
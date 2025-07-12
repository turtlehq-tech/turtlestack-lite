// tests/unit/technicalIndicators.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { TechnicalIndicators } from '../../src/utils/technicalIndicators.js';

describe('TechnicalIndicators', () => {
  let samplePrices;
  let sampleOHLCV;

  before(() => {
    // Sample price data for testing
    samplePrices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113, 115, 117, 116, 118, 120];
    
    // Sample OHLCV data
    sampleOHLCV = [
      { open: 100, high: 102, low: 99, close: 101, volume: 1000 },
      { open: 101, high: 103, low: 100, close: 102, volume: 1200 },
      { open: 102, high: 104, low: 101, close: 103, volume: 1100 },
      { open: 103, high: 105, low: 102, close: 104, volume: 1300 },
      { open: 104, high: 106, low: 103, close: 105, volume: 1400 },
      { open: 105, high: 107, low: 104, close: 106, volume: 1250 },
      { open: 106, high: 108, low: 105, close: 107, volume: 1350 },
      { open: 107, high: 109, low: 106, close: 108, volume: 1450 },
      { open: 108, high: 110, low: 107, close: 109, volume: 1550 },
      { open: 109, high: 111, low: 108, close: 110, volume: 1650 },
      { open: 110, high: 112, low: 109, close: 111, volume: 1750 },
      { open: 111, high: 113, low: 110, close: 112, volume: 1850 },
      { open: 112, high: 114, low: 111, close: 113, volume: 1950 },
      { open: 113, high: 115, low: 112, close: 114, volume: 2050 },
      { open: 114, high: 116, low: 113, close: 115, volume: 2150 }
    ];
  });

  describe('SMA (Simple Moving Average)', () => {
    it('should calculate SMA correctly', () => {
      const result = TechnicalIndicators.calculateSMA(samplePrices, 5);
      assert.ok(Array.isArray(result), 'SMA should return an array');
      assert.ok(result.length > 0, 'SMA should return values');
      
      // First SMA value should be average of first 5 prices
      const expectedFirst = (100 + 102 + 101 + 103 + 105) / 5;
      assert.strictEqual(result[0], expectedFirst, 'First SMA value should be correct');
    });

    it('should return empty array for insufficient data', () => {
      const result = TechnicalIndicators.calculateSMA([100, 102], 5);
      assert.deepStrictEqual(result, [], 'Should return empty array for insufficient data');
    });
  });

  describe('EMA (Exponential Moving Average)', () => {
    it('should calculate EMA correctly', () => {
      const result = TechnicalIndicators.calculateEMA(samplePrices, 5);
      assert.ok(Array.isArray(result), 'EMA should return an array');
      assert.ok(result.length > 0, 'EMA should return values');
      assert.ok(result[0] > 0, 'EMA values should be positive');
    });

    it('should return empty array for insufficient data', () => {
      const result = TechnicalIndicators.calculateEMA([100, 102], 5);
      assert.deepStrictEqual(result, [], 'Should return empty array for insufficient data');
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    it('should calculate RSI correctly', () => {
      const result = TechnicalIndicators.calculateRSI(samplePrices, 14);
      assert.ok(Array.isArray(result), 'RSI should return an array');
      assert.ok(result.length > 0, 'RSI should return values');
      
      // RSI values should be between 0 and 100
      result.forEach((value, index) => {
        assert.ok(value >= 0 && value <= 100, `RSI value ${value} at index ${index} should be between 0 and 100`);
      });
    });

    it('should return empty array for insufficient data', () => {
      const result = TechnicalIndicators.calculateRSI([100, 102], 14);
      assert.deepStrictEqual(result, [], 'Should return empty array for insufficient data');
    });
  });

  describe('MACD (Moving Average Convergence Divergence)', () => {
    it('should calculate MACD correctly', () => {
      const result = TechnicalIndicators.calculateMACD(samplePrices, 12, 26, 9);
      assert.ok(typeof result === 'object', 'MACD should return an object');
      assert.ok(Array.isArray(result.macdLine), 'MACD should have macdLine array');
      assert.ok(Array.isArray(result.signalLine), 'MACD should have signalLine array');
      assert.ok(Array.isArray(result.histogram), 'MACD should have histogram array');
    });

    it('should handle insufficient data gracefully', () => {
      const result = TechnicalIndicators.calculateMACD([100, 102], 12, 26, 9);
      assert.deepStrictEqual(result.macdLine, [], 'MACD line should be empty for insufficient data');
      assert.deepStrictEqual(result.signalLine, [], 'Signal line should be empty for insufficient data');
      assert.deepStrictEqual(result.histogram, [], 'Histogram should be empty for insufficient data');
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const result = TechnicalIndicators.calculateBollingerBands(samplePrices, 20, 2);
      assert.ok(typeof result === 'object', 'Bollinger Bands should return an object');
      assert.ok(Array.isArray(result.upperBand), 'Should have upperBand array');
      assert.ok(Array.isArray(result.middleBand), 'Should have middleBand array');
      assert.ok(Array.isArray(result.lowerBand), 'Should have lowerBand array');
      
      if (result.upperBand.length > 0) {
        // Upper band should be greater than middle band, middle greater than lower
        assert.ok(result.upperBand[0] > result.middleBand[0], 'Upper band should be greater than middle band');
        assert.ok(result.middleBand[0] > result.lowerBand[0], 'Middle band should be greater than lower band');
      }
    });
  });

  describe('VWAP (Volume Weighted Average Price)', () => {
    it('should calculate VWAP correctly', () => {
      const result = TechnicalIndicators.calculateVWAP(sampleOHLCV);
      assert.ok(Array.isArray(result), 'VWAP should return an array');
      assert.strictEqual(result.length, sampleOHLCV.length, 'VWAP should have same length as input data');
      
      // VWAP values should be reasonable (positive numbers)
      result.forEach((vwap, index) => {
        assert.ok(vwap > 0, `VWAP ${vwap} should be positive`);
        assert.ok(typeof vwap === 'number', `VWAP should be a number`);
      });
    });

    it('should handle empty data', () => {
      const result = TechnicalIndicators.calculateVWAP([]);
      assert.deepStrictEqual(result, [], 'Should return empty array for empty data');
    });
  });

  describe('ATR (Average True Range)', () => {
    it('should calculate ATR correctly', () => {
      const highs = sampleOHLCV.map(d => d.high);
      const lows = sampleOHLCV.map(d => d.low);
      const closes = sampleOHLCV.map(d => d.close);
      
      const result = TechnicalIndicators.calculateATR(highs, lows, closes, 14);
      assert.ok(Array.isArray(result), 'ATR should return an array');
      
      // ATR values should be positive
      result.forEach((value, index) => {
        assert.ok(value >= 0, `ATR value ${value} at index ${index} should be non-negative`);
      });
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate Stochastic correctly', () => {
      const highs = sampleOHLCV.map(d => d.high);
      const lows = sampleOHLCV.map(d => d.low);
      const closes = sampleOHLCV.map(d => d.close);
      
      const result = TechnicalIndicators.calculateStochastic(highs, lows, closes, 14, 3);
      assert.ok(typeof result === 'object', 'Stochastic should return an object');
      assert.ok(Array.isArray(result.kPercent), 'Should have kPercent array');
      assert.ok(Array.isArray(result.dPercent), 'Should have dPercent array');
      
      // Stochastic values should be between 0 and 100
      result.kPercent.forEach((value, index) => {
        assert.ok(value >= 0 && value <= 100, `%K value ${value} at index ${index} should be between 0 and 100`);
      });
    });
  });

  describe('OBV (On-Balance Volume)', () => {
    it('should calculate OBV correctly', () => {
      const closes = sampleOHLCV.map(d => d.close);
      const volumes = sampleOHLCV.map(d => d.volume);
      
      const result = TechnicalIndicators.calculateOBV(closes, volumes);
      assert.ok(Array.isArray(result), 'OBV should return an array');
      assert.strictEqual(result.length, closes.length, 'OBV should have same length as input');
      assert.strictEqual(result[0], volumes[0], 'First OBV value should equal first volume');
    });

    it('should handle mismatched array lengths', () => {
      const result = TechnicalIndicators.calculateOBV([100, 102], [1000]);
      assert.deepStrictEqual(result, [], 'Should return empty array for mismatched lengths');
    });
  });

  describe('MFI (Money Flow Index)', () => {
    it('should calculate MFI correctly', () => {
      const highs = sampleOHLCV.map(d => d.high);
      const lows = sampleOHLCV.map(d => d.low);
      const closes = sampleOHLCV.map(d => d.close);
      const volumes = sampleOHLCV.map(d => d.volume);
      
      const result = TechnicalIndicators.calculateMFI(highs, lows, closes, volumes, 14);
      assert.ok(Array.isArray(result), 'MFI should return an array');
      
      // MFI values should be between 0 and 100
      result.forEach((value, index) => {
        assert.ok(value >= 0 && value <= 100, `MFI value ${value} at index ${index} should be between 0 and 100`);
      });
    });
  });

  describe('Fibonacci Retracement', () => {
    it('should calculate Fibonacci levels correctly', () => {
      const high = 120;
      const low = 100;
      const result = TechnicalIndicators.calculateFibonacci(high, low);
      
      assert.ok(typeof result === 'object', 'Fibonacci should return an object');
      assert.strictEqual(result.level_0, high, '0% level should equal high');
      assert.strictEqual(result.level_100, low, '100% level should equal low');
      assert.ok(result.level_236 < high && result.level_236 > low, '23.6% level should be between high and low');
      assert.ok(result.level_618 < high && result.level_618 > low, '61.8% level should be between high and low');
    });
  });

  describe('Support and Resistance', () => {
    it('should identify support and resistance levels', () => {
      const highs = sampleOHLCV.map(d => d.high);
      const lows = sampleOHLCV.map(d => d.low);
      
      const result = TechnicalIndicators.calculateSupportResistance(highs, lows, 5);
      assert.ok(typeof result === 'object', 'Support/Resistance should return an object');
      assert.ok(Array.isArray(result.support), 'Should have support array');
      assert.ok(Array.isArray(result.resistance), 'Should have resistance array');
    });
  });

  describe('processHistoricalData', () => {
    it('should process multiple indicators correctly', () => {
      const indicators = ['RSI', 'MACD', 'BOLLINGER', 'VWAP', 'ATR'];
      const result = TechnicalIndicators.processHistoricalData(sampleOHLCV, indicators);
      
      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.rsi !== undefined, 'Should include RSI');
      assert.ok(result.macd !== undefined, 'Should include MACD');
      assert.ok(result.bollingerBands !== undefined, 'Should include Bollinger Bands');
      assert.ok(result.vwap !== undefined, 'Should include VWAP');
      assert.ok(result.atr !== undefined, 'Should include ATR');
    });

    it('should handle empty data gracefully', () => {
      assert.throws(() => {
        TechnicalIndicators.processHistoricalData([], ['RSI']);
      }, /No historical data provided/, 'Should throw error for empty data');
    });

    it('should handle unsupported indicators gracefully', () => {
      const result = TechnicalIndicators.processHistoricalData(sampleOHLCV, ['UNSUPPORTED_INDICATOR']);
      assert.ok(typeof result === 'object', 'Should return an object even with unsupported indicators');
    });
  });
});
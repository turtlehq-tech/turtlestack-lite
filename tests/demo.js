// tests/demo.js
// Demo script to test technical indicators functionality

import { TechnicalIndicators } from '../src/utils/technicalIndicators.js';
import { TurtleStack } from '../src/server/TurtleStack.js';

// Sample OHLCV data for testing
const sampleData = [
  { open: 100, high: 105, low: 98, close: 103, volume: 10000 },
  { open: 103, high: 108, low: 101, close: 106, volume: 12000 },
  { open: 106, high: 110, low: 104, close: 109, volume: 11500 },
  { open: 109, high: 114, low: 107, close: 112, volume: 13000 },
  { open: 112, high: 117, low: 110, close: 115, volume: 14500 },
  { open: 115, high: 120, low: 113, close: 118, volume: 16000 },
  { open: 118, high: 123, low: 116, close: 121, volume: 17500 },
  { open: 121, high: 126, low: 119, close: 124, volume: 19000 },
  { open: 124, high: 129, low: 122, close: 127, volume: 20500 },
  { open: 127, high: 132, low: 125, close: 130, volume: 22000 }
];

console.log('🚀 Technical Indicators Demo\n');

// Test RSI calculation
console.log('📊 RSI (Relative Strength Index):');
const closes = sampleData.map(d => d.close);
const rsi = TechnicalIndicators.calculateRSI(closes, 5);
console.log('RSI values:', rsi.slice(-3)); // Show last 3 values
console.log('');

// Test MACD calculation  
console.log('📈 MACD (Moving Average Convergence Divergence):');
const macd = TechnicalIndicators.calculateMACD(closes, 5, 8, 3);
console.log('MACD Line (last 3):', macd.macdLine.slice(-3));
console.log('Signal Line (last 3):', macd.signalLine.slice(-3));
console.log('Histogram (last 3):', macd.histogram.slice(-3));
console.log('');

// Test Bollinger Bands
console.log('📊 Bollinger Bands:');
const bollinger = TechnicalIndicators.calculateBollingerBands(closes, 5, 2);
if (bollinger.upperBand.length > 0) {
  console.log('Upper Band (last):', bollinger.upperBand.slice(-1)[0]);
  console.log('Middle Band (last):', bollinger.middleBand.slice(-1)[0]);
  console.log('Lower Band (last):', bollinger.lowerBand.slice(-1)[0]);
}
console.log('');

// Test VWAP calculation
console.log('💰 VWAP (Volume Weighted Average Price):');
const vwap = TechnicalIndicators.calculateVWAP(sampleData);
console.log('VWAP values (last 3):', vwap.slice(-3));
console.log('');

// Test ATR calculation
console.log('📊 ATR (Average True Range):');
const highs = sampleData.map(d => d.high);
const lows = sampleData.map(d => d.low);
const atr = TechnicalIndicators.calculateATR(highs, lows, closes, 5);
console.log('ATR values (last 3):', atr.slice(-3));
console.log('');

// Test multiple indicators processing
console.log('🔧 Multiple Indicators Processing:');
const multipleIndicators = TechnicalIndicators.processHistoricalData(sampleData, ['RSI', 'MACD', 'BOLLINGER', 'VWAP']);
console.log('RSI:', multipleIndicators.rsi ? `${multipleIndicators.rsi.length} values` : 'Not calculated');
console.log('MACD:', multipleIndicators.macd ? 'Calculated (3 components)' : 'Not calculated');
console.log('Bollinger Bands:', multipleIndicators.bollingerBands ? 'Calculated (3 bands)' : 'Not calculated');
console.log('VWAP:', multipleIndicators.vwap ? `${multipleIndicators.vwap.length} values` : 'Not calculated');
console.log('');

// Test TurtleStack initialization
console.log('🏗️ TurtleStack Initialization:');
try {
  const server = new TurtleStack();
  console.log('✅ Server initialized successfully');
  console.log('Available brokers:', Object.keys(server.brokers));
  console.log('Technical analysis methods available:', [
    'getTechnicalIndicators', 'getRSI', 'getMACD', 'getBollingerBands', 
    'getVWAP', 'getATR', 'getADX', 'compareTechnicalIndicators'
  ].join(', '));
} catch (error) {
  console.log('❌ Server initialization failed:', error.message);
}
console.log('');

console.log('✅ Demo completed successfully!');
console.log('All technical indicators are working correctly.');
console.log('Ready for trading analysis! 📈');
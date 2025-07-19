# Setup

## Unified Trading Server (Recommended)

The unified server supports all brokers (Kite, Groww, Dhan) with advanced technical analysis and modular architecture.

```json
{
  "mcpServers": {
    "unified-trading-server": {
      "command": "/Users/shubham/.nvm/versions/node/v22.15.0/bin/node",
      "args": ["/Users/shubham/Desktop/my-kite-mcp-server/src/index.js"]
    }
  }
}
```

**🔒 Security Note**: No API keys or secrets are stored in the configuration. All credentials must be provided through Claude commands for maximum security.

## 🔧 Configuration Setup

**Important**: This repository contains dummy placeholder values for all sensitive IDs and tokens. Before using the project, you must replace these placeholders with your actual credentials.

### 📝 Required Replacements

The following files contain placeholder values that need to be replaced with your actual credentials:

#### 1. **Test Files** (for development/testing):
- `tests/debugAuthentication.js:16,17` - Replace `YOUR_CLIENT_ID_HERE` and `YOUR_PROGRESS_TOKEN_HERE` 
- `tests/testClaudeConnection.js:21,22` - Replace `YOUR_CLAUDE_SESSION_TOKEN_HERE` and `YOUR_CLAUDE_CLIENT_ID_HERE`
- `tests/testGrowwOrderFix.js:13` - Replace `YOUR_GROWW_API_KEY_HERE`
- `tests/testGrowwOrderReference.js:11` - Replace `YOUR_GROWW_API_KEY_HERE`
- `tests/debugAuthentication.js:44` - Replace `YOUR_GROWW_JWT_TOKEN_HERE`
- `tests/testClaudeConnection.js:40,52` - Replace `YOUR_GROWW_JWT_TOKEN_HERE`

#### 2. **Cloudflare Configuration** (for Cloudflare Workers deployment):
- `bridge.js:4` - Replace `YOUR_WORKER_SUBDOMAIN.YOUR_USERNAME.workers.dev`
- `cloudflare/wrangler.toml:17` - Replace `YOUR_KV_NAMESPACE_ID_HERE`
- `cloudflare/mcp-config-for-claude.json:5` - Replace worker URL in the embedded command

### 🔑 How to Get Your Credentials

#### **For Kite (Zerodha):**
1. Go to [Kite Connect Developer Console](https://developers.kite.trade/)
2. Create an app to get `api_key` and `api_secret`
3. Generate access token using the authentication flow

#### **For Groww:**
1. Use browser developer tools to inspect network requests on Groww web app
2. Extract JWT token from Authorization header
3. Token format: `eyJraWQiOiJ...` (long JWT string)

#### **For Dhan:**
1. Go to [Dhan API Portal](https://dhanhq.co/docs/)
2. Get your `access_token` and `client_id`

#### **For Cloudflare Workers:**
1. Create KV namespace: `wrangler kv:namespace create "SESSIONS_KV"`
2. Note the namespace ID from the output
3. Update your worker subdomain based on your Cloudflare account

### ⚠️ Security Best Practices

- **Never commit real credentials** to version control
- **Use environment variables** for production deployments  
- **Rotate tokens regularly** for security
- **Test with dummy data** first before using real credentials

### 🧪 Quick Setup for Testing

Replace these specific placeholders to get started quickly:

```bash
# 1. Update test files with your tokens
sed -i 's/YOUR_GROWW_JWT_TOKEN_HERE/your_actual_groww_token/g' tests/testClaudeConnection.js
sed -i 's/YOUR_GROWW_API_KEY_HERE/your_actual_api_key/g' tests/testGroww*.js

# 2. Update Cloudflare config (if using workers)
sed -i 's/YOUR_WORKER_SUBDOMAIN.YOUR_USERNAME.workers.dev/your-worker.your-account.workers.dev/g' bridge.js
sed -i 's/YOUR_KV_NAMESPACE_ID_HERE/your_actual_kv_id/g' cloudflare/wrangler.toml
```

## Installation

```bash
npm install
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only  
npm run test:integration

# Run tests with watch mode
npm run test:watch

# Demo technical indicators
node tests/demo.js
```


## Project Structure

```
src/
├── brokers/
│   ├── BaseBroker.js      # Base interface for all brokers
│   ├── KiteBroker.js      # Kite (Zerodha) implementation
│   ├── GrowwBroker.js     # Groww implementation
│   ├── DhanBroker.js      # Dhan implementation
│   └── index.js           # Broker exports and factory
├── server/
│   └── UnifiedTradingServer.js  # Main MCP server (v2.0.0)
├── utils/
│   ├── logger.js          # Logging utility
│   ├── formatters.js      # Data formatting utilities
│   ├── technicalIndicators.js    # Backward compatibility wrapper
│   └── technicalIndicators/      # Modular technical analysis
│       ├── index.js              # Main aggregation file
│       ├── trendIndicators.js    # SMA, EMA, VWAP, ADX, Parabolic SAR
│       ├── momentumIndicators.js # RSI, MACD, Stochastic, Williams %R, CCI, MFI
│       ├── volatilityIndicators.js # Bollinger Bands, ATR
│       ├── volumeIndicators.js   # OBV
│       └── supportResistanceIndicators.js # Fibonacci, Support/Resistance
└── index.js               # Entry point
tests/
├── unit/
│   └── technicalIndicators.test.js  # Technical indicators unit tests
├── integration/
│   ├── brokers.test.js             # Broker integration tests
│   └── unifiedTradingServer.test.js # Server integration tests
├── fixtures/
│   └── mockData.js                 # Test data fixtures
└── demo.js                         # Technical indicators demo
```

## Usage

### Start Unified Trading Server
```bash
npm start
# or for development
npm run dev
```

## Features

### Multi-Broker Support
- **✅ Kite (Zerodha)** - Fully implemented with advanced features
- **✅ Groww** - Fully implemented with advanced features
- **✅ Dhan** - Fully implemented with advanced features

### Architecture Benefits
- **🏗️ Modular Design**: Each broker in separate file
- **🔌 Pluggable**: Easy to add new brokers
- **🧪 Testable**: Individual components can be tested
- **📝 Maintainable**: Clean separation of concerns
- **🔄 Scalable**: Supports unlimited brokers

### Key Commands

#### Broker Management
```
# List all available brokers
List brokers

# Set active broker
Set active broker to kite
```

#### Authentication (Secure - No Stored Credentials)
```
# Authenticate Kite with access token
Authenticate kite with api_key: your_api_key and access_token: your_access_token

# Authenticate Kite with request token
Authenticate kite with api_key: your_api_key, api_secret: your_api_secret, and request_token: your_request_token

# Authenticate Groww
Authenticate groww with access_token: your_groww_access_token

# Authenticate Dhan
Authenticate dhan with access_token: your_dhan_access_token and client_id: your_dhan_client_id
```

#### Trading Operations
```
# Get portfolio from active broker
Show my portfolio

# Get portfolio from specific broker
Show my groww portfolio

# Compare portfolios across brokers
Compare my portfolios across all brokers

# Place order using active broker
Create buy order for RELIANCE 10 shares at market price

# Get margins
Show my account margins
```

#### Advanced Features
```
# Get consolidated portfolio across all brokers
Show me my consolidated portfolio across all brokers

# Kite Advanced Features
Get my Kite mutual fund holdings
Place GTT order for RELIANCE
Get historical data for INFY

# Groww Advanced Features  
Get technical indicators RSI for RELIANCE
Search for instruments containing "TATA"
Get historical candle data for HDFC

# Dhan Advanced Features
Get option chain for NIFTY
Place bracket order with stop loss and target
Get live market feed for instruments

# Logout from specific broker
Logout from kite

# Logout from all brokers
Logout from all brokers

# Technical Analysis Operations
Get RSI for RELIANCE
Get MACD for INFY  
Get Bollinger Bands for HDFC
Get VWAP for TATA STEEL
Get ATR for NIFTY

# Cross-broker technical comparison
Compare RSI for RELIANCE across all brokers
Compare MACD for INFY across kite and groww
```

## Advanced Broker Features

### **🚀 Kite (Zerodha) Advanced Features:**
- **✅ Technical Analysis**: RSI, MACD, Bollinger Bands, SMA, EMA, Stochastic
- **Mutual Funds**: Holdings, orders, SIP management
- **GTT (Good Till Triggered)**: Advanced conditional orders
- **Historical Data**: OHLC data with custom intervals
- **Instruments**: Complete instrument master data
- **Order Management**: Modify, cancel, bracket orders
- **Profile & Margins**: Account details and fund limits

### **📊 Groww Advanced Features:**
- **✅ Technical Analysis**: RSI, MACD, Bollinger Bands (Native API support)
- **Historical Data**: Candlestick data for any time period
- **Advanced Search**: Complex instrument filtering
- **Order Management**: Create, modify, cancel orders
- **Market Data**: Real-time quotes and live feeds
- **Instrument Details**: Complete security information

### **⚡ Dhan Advanced Features:**
- **✅ Technical Analysis**: RSI, MACD, Bollinger Bands, SMA, EMA, Stochastic
- **Option Chain**: Complete options data with Greeks
- **Bracket/Cover Orders**: Advanced order types with SL/Target
- **Kill Switch**: Emergency stop for all trading activities
- **Live Market Feed**: Real-time price updates
- **Security Info**: Detailed instrument information
- **Order Book/Trade Book**: Complete trading history
- **Exchange Status**: Real-time market status updates

## Technical Indicator Support

### **📊 Unified Technical Analysis Commands:**

#### **Individual Indicators:**
```
# Get specific technical indicators
Get RSI for RELIANCE with period 14
Get MACD for INFY from kite broker
Get Bollinger Bands for HDFC with period 20
Get VWAP for TATA STEEL from groww
Get ATR for NIFTY with period 14
Get ADX for RELIANCE with period 14

# Multiple indicators at once
Get technical indicators RSI,MACD,BOLLINGER for RELIANCE
```

#### **Cross-Broker Comparison:**
```
# Compare same indicator across brokers
Compare RSI for RELIANCE across all brokers
Compare MACD for INFY across kite,groww,dhan
Compare Bollinger Bands for HDFC across authenticated brokers
```

#### **Advanced Parameters:**
```
# With custom periods and timeframes
Get RSI for RELIANCE with period 21 and interval 1h
Get MACD for INFY with fast_period 10, slow_period 20, signal_period 7
Get Bollinger Bands for HDFC with period 20 and standard_deviations 2.5
```

### **✅ All Brokers Support:**

#### **📊 Trend Indicators:**
- **SMA (Simple Moving Average)**: Any period
- **EMA (Exponential Moving Average)**: Any period  
- **VWAP (Volume Weighted Average Price)**: Intraday trading benchmark
- **Parabolic SAR**: Stop and Reverse trend following system
- **ADX (Average Directional Index)**: Trend strength indicator

#### **📈 Momentum Indicators:**
- **RSI (Relative Strength Index)**: 14-period default, overbought/oversold
- **MACD (Moving Average Convergence Divergence)**: 12,26,9 default parameters
- **Stochastic Oscillator**: %K and %D lines
- **Williams %R**: Momentum oscillator
- **CCI (Commodity Channel Index)**: Price deviation indicator
- **MFI (Money Flow Index)**: Volume-weighted RSI

#### **📊 Volatility Indicators:**
- **Bollinger Bands**: 20-period with 2 standard deviations default
- **ATR (Average True Range)**: Volatility measurement

#### **💰 Volume Indicators:**
- **OBV (On-Balance Volume)**: Volume flow indicator
- **MFI (Money Flow Index)**: Price and volume momentum

#### **🎯 Support & Resistance:**
- **Fibonacci Retracement**: Key retracement levels (23.6%, 38.2%, 50%, 61.8%)
- **Support/Resistance Levels**: Automated level detection

### **🔧 Implementation Details:**
- **Groww**: Native API support for technical indicators via `/technical/{indicator}` endpoints
- **Kite & Dhan**: Historical data + local calculation using comprehensive TechnicalIndicators utility class
- **Consistent API**: Unified command interface across all brokers regardless of implementation
- **Cross-Broker Comparison**: Compare same indicator across multiple brokers simultaneously
- **Real-time Calculation**: Indicators calculated from live historical data with customizable parameters
- **Intelligent Routing**: UnifiedTradingServer automatically routes requests to appropriate broker methods

### **📈 Available Technical Analysis Tools:**

#### **MCP Commands:**
- `get_technical_indicators` - Multiple indicators at once
- `get_rsi` - Relative Strength Index
- `get_macd` - Moving Average Convergence Divergence  
- `get_bollinger_bands` - Bollinger Bands
- `get_vwap` - Volume Weighted Average Price
- `get_atr` - Average True Range
- `get_adx` - Average Directional Index
- `compare_technical_indicators` - Cross-broker comparison

#### **Unified Command Examples:**
```bash
# Individual technical indicators
Get RSI for RELIANCE with period 14
Get MACD for INFY from kite
Get Bollinger Bands for HDFC with period 20 and standard_deviations 2
Get VWAP for TATASTEEL from groww  
Get ATR for NIFTY with period 14 from dhan
Get ADX for RELIANCE with period 14

# Multiple indicators
Get technical indicators RSI,MACD,BOLLINGER,VWAP for RELIANCE

# Cross-broker comparison
Compare RSI for RELIANCE across all brokers
Compare MACD for INFY across kite,groww
Compare VWAP for HDFC across authenticated brokers
```

#### Security Features
- ✅ **No stored credentials**: All API keys/tokens provided via commands
- ✅ **Session-based**: Credentials cleared when server restarts  
- ✅ **Broker isolation**: Each broker maintains separate credentials
- ✅ **Runtime authentication**: Authenticate only when needed
- ✅ **Modular security**: Each broker handles its own authentication

## Adding New Brokers

To add a new broker (e.g., Upstox):

1. **Create broker file**: `src/brokers/UpstoxBroker.js`
2. **Extend BaseBroker**: Implement all required methods
3. **Add to index**: Export in `src/brokers/index.js`
4. **Update server**: Add to broker registry in `UnifiedTradingServer.js`
5. **Test**: Authenticate and test all operations

The modular architecture makes adding new brokers straightforward and maintainable.

## 📁 Cloudflare Workers Deployment

For deploying to Cloudflare Workers, see the complete setup guide in `/cloudflare/README.md`.

## 📄 License

Apache 2.0 License - see LICENSE file for details.
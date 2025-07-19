// src/brokers/GrowwBrokerFixed.js
// Fixed implementation based on official Groww API documentation
import { BaseBroker } from './BaseBroker.js';

export class GrowwBroker extends BaseBroker {
  constructor() {
    super('Groww');
    // Official Groww API base URLs from documentation
    this.baseURL = 'https://api.groww.in/v1';
    this.instrumentsURL = 'https://growwapi-assets.groww.in/instruments/instrument.csv';
    this.apiKey = null;
  }

  async authenticate(credentials) {
    try {
      if (credentials.access_token) {
        this.apiKey = credentials.access_token;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "Groww access token set successfully!" 
        };
      }
      
      throw new Error("Groww requires: access_token (JWT token from Groww web app)");
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Groww authentication failed: ${error.message}`);
    }
  }

  getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-VERSION': '1.0'
    };
  }

  async makeAPICall(method, endpoint, data = null) {
    this._ensureAuthenticated();

    try {
      const url = `${this.baseURL}${endpoint}`;
      const options = {
        method: method,
        headers: this.getHeaders()
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${response.statusText} (${response.status})`);
      }
      
      if (!response.ok) {
        const errorMessage = responseData?.error?.message || 
                           responseData?.message || 
                           responseData?.error || 
                           `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Groww API Error: ${errorMessage}`);
      }

      if (responseData.status === 'FAILURE') {
        const errorMessage = responseData.error?.message || 
                           responseData.message || 
                           responseData.error || 
                           'Unknown error';
        throw new Error(`Groww API Error: ${errorMessage}`);
      }
      
      return responseData.payload || responseData;
    } catch (error) {
      throw new Error(`Groww API Error: ${error.message}`);
    }
  }

  // Portfolio & Positions
  async getPortfolio(params = {}) {
    try {
      // Get holdings from DEMAT account
      const response = await this.makeAPICall('GET', '/holdings/user');
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww portfolio: ${error.message}`);
    }
  }

  async getPositions(params = {}) {
    try {
      // Get user positions with optional segment filter
      const segment = params.segment || 'CASH';
      const queryParams = segment ? `?segment=${segment}` : '';
      const response = await this.makeAPICall('GET', `/positions/user${queryParams}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww positions: ${error.message}`);
    }
  }

  async getPositionBySymbol(tradingSymbol, segment = 'CASH') {
    try {
      const queryParams = new URLSearchParams({
        trading_symbol: tradingSymbol,
        segment: segment
      });
      
      const response = await this.makeAPICall('GET', `/positions/trading-symbol?${queryParams.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww position for ${tradingSymbol}: ${error.message}`);
    }
  }

  // Order Management
  async createOrder(params) {
    try {
      this._validateOrderParams(params);
      
      const orderData = {
        trading_symbol: params.trading_symbol?.toUpperCase() || params.symbol?.toUpperCase(),
        quantity: parseInt(params.quantity),
        validity: params.validity?.toUpperCase() || 'DAY',
        exchange: params.exchange.toUpperCase(),
        segment: this._mapSegment(params.segment || 'CASH'),
        product: this._mapProduct(params.product),
        order_type: params.order_type.toUpperCase(),
        transaction_type: params.transaction_type.toUpperCase()
      };

      // Add price for LIMIT orders
      if (params.order_type.toUpperCase() === 'LIMIT' && params.price) {
        orderData.price = parseFloat(params.price);
      }
      
      // Add trigger price for SL and SL-M orders
      if ((params.order_type.toUpperCase() === 'SL' || params.order_type.toUpperCase() === 'SL-M') && params.trigger_price) {
        orderData.trigger_price = parseFloat(params.trigger_price);
        
        if (params.order_type.toUpperCase() === 'SL' && params.price) {
          orderData.price = parseFloat(params.price);
        }
      }
      
      // Add order reference ID
      orderData.order_reference_id = params.order_reference_id || this._generateOrderReferenceId();
      
      // Add disclosed quantity for iceberg orders
      if (params.disclosed_quantity) {
        orderData.disclosed_quantity = parseInt(params.disclosed_quantity);
      }

      const response = await this.makeAPICall('POST', '/order/create', orderData);
      
      return {
        broker: 'Groww',
        order_id: response.groww_order_id || response.orderId || response.order_id,
        status: 'success',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to create Groww order: ${error.message}`);
    }
  }

  async modifyOrder(orderId, params) {
    try {
      const modifyData = {
        groww_order_id: orderId,
        segment: params.segment || 'CASH',
        order_type: params.order_type ? params.order_type.toUpperCase() : 'LIMIT'
      };

      if (params.quantity) modifyData.quantity = parseInt(params.quantity);
      if (params.price) modifyData.price = parseFloat(params.price);
      if (params.trigger_price) modifyData.trigger_price = parseFloat(params.trigger_price);
      if (params.validity) modifyData.validity = params.validity.toUpperCase();

      const response = await this.makeAPICall('POST', '/order/modify', modifyData);
      
      return {
        broker: 'Groww',
        order_id: response.groww_order_id || orderId,
        status: 'modified',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to modify Groww order: ${error.message}`);
    }
  }

  async cancelOrder(orderId, params = {}) {
    try {
      const cancelData = {
        groww_order_id: orderId,
        segment: params.segment || 'CASH'
      };

      const response = await this.makeAPICall('POST', '/order/cancel', cancelData);
      
      return {
        broker: 'Groww',
        order_id: orderId,
        status: 'cancelled',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to cancel Groww order: ${error.message}`);
    }
  }

  async getOrders(params = {}) {
    try {
      const segment = params.segment || 'CASH';
      const page = params.page || 1;
      const pageSize = params.page_size || 50;
      
      const queryParams = new URLSearchParams({
        segment,
        page: page.toString(),
        page_size: pageSize.toString()
      });
      
      const response = await this.makeAPICall('GET', `/order/list?${queryParams.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww orders: ${error.message}`);
    }
  }

  async getOrderDetail(orderId, segment = 'CASH') {
    try {
      const queryParams = new URLSearchParams({ segment });
      const response = await this.makeAPICall('GET', `/order/detail/${orderId}?${queryParams.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order detail: ${error.message}`);
    }
  }

  async getOrderStatus(orderId, segment = 'CASH') {
    try {
      const queryParams = new URLSearchParams({ segment });
      const response = await this.makeAPICall('GET', `/order/status/${orderId}?${queryParams.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order status: ${error.message}`);
    }
  }

  async getOrderStatusByReference(orderReferenceId, segment = 'CASH') {
    try {
      const queryParams = new URLSearchParams({ segment });
      const response = await this.makeAPICall('GET', `/order/status/reference/${orderReferenceId}?${queryParams.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order status by reference: ${error.message}`);
    }
  }

  async getOrderTrades(orderId, segment = 'CASH', page = 1, pageSize = 50) {
    try {
      const queryParams = new URLSearchParams({
        segment,
        page: page.toString(),
        page_size: pageSize.toString()
      });
      
      const response = await this.makeAPICall('GET', `/order/trades/${orderId}?${queryParams.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order trades: ${error.message}`);
    }
  }

  // Margin Information
  async getMargins(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/margins/detail/user');
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww margins: ${error.message}`);
    }
  }
  
  async getMarginForOrders(orders, segment = 'CASH') {
    try {
      const queryParams = new URLSearchParams({ segment });
      const response = await this.makeAPICall(
        'POST', 
        `/margins/detail/orders?${queryParams.toString()}`,
        orders
      );
      
      return {
        broker: 'Groww',
        segment: segment,
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww margin for orders: ${error.message}`);
    }
  }
  
  async calculateOrderMargin(orderParams) {
    try {
      const orderArray = [{
        trading_symbol: orderParams.trading_symbol.toUpperCase(),
        transaction_type: orderParams.transaction_type.toUpperCase(),
        quantity: parseInt(orderParams.quantity),
        order_type: orderParams.order_type.toUpperCase(),
        product: this._mapProduct(orderParams.product),
        price: orderParams.price ? parseFloat(orderParams.price) : undefined,
        trigger_price: orderParams.trigger_price ? parseFloat(orderParams.trigger_price) : undefined
      }];
      
      // Remove undefined values
      orderArray[0] = Object.fromEntries(
        Object.entries(orderArray[0]).filter(([_, v]) => v !== undefined)
      );
      
      const segment = this._mapSegment(orderParams.segment || 'CASH');
      return await this.getMarginForOrders(orderArray, segment);
    } catch (error) {
      throw new Error(`Failed to calculate Groww order margin: ${error.message}`);
    }
  }

  // Historical Data
  async getHistoricalData(symbol, startTime, endTime, exchange = 'NSE', segment = 'CASH', intervalInMinutes = null) {
    try {
      const params = new URLSearchParams({
        exchange: exchange,
        segment: segment,
        trading_symbol: symbol,
        start_time: startTime, // Format: yyyy-MM-dd HH:mm:ss
        end_time: endTime      // Format: yyyy-MM-dd HH:mm:ss
      });
      
      if (intervalInMinutes) {
        params.append('interval_in_minutes', intervalInMinutes.toString());
      }
      
      const response = await this.makeAPICall('GET', `/historical/candle/range?${params.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww historical data: ${error.message}`);
    }
  }

  // Instruments
  async getInstruments() {
    try {
      // Get instruments CSV file
      const response = await fetch(this.instrumentsURL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvData = await response.text();
      
      return {
        broker: 'Groww',
        data: csvData,
        format: 'csv'
      };
    } catch (error) {
      throw new Error(`Failed to get Groww instruments: ${error.message}`);
    }
  }

  async searchInstruments(query, segment = 'CASH', exchange = 'NSE') {
    try {
      // Get all instruments and filter locally
      const instruments = await this.getInstruments();
      
      // Parse CSV and search for matching symbols
      const lines = instruments.data.split('\n');
      const headers = lines[0].split(',');
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
          const instrument = {};
          headers.forEach((header, index) => {
            instrument[header.trim()] = values[index]?.trim();
          });
          
          // Filter by query, exchange, and segment
          if (instrument.trading_symbol?.toUpperCase().includes(query.toUpperCase()) &&
              instrument.exchange === exchange &&
              instrument.segment === segment) {
            results.push(instrument);
          }
        }
      }
      
      return {
        broker: 'Groww',
        data: results.slice(0, 10) // Limit to 10 results
      };
    } catch (error) {
      throw new Error(`Failed to search Groww instruments: ${error.message}`);
    }
  }

  // Technical Indicators (calculated from historical data)
  async getTechnicalIndicators(symbol, indicator, period = 14, exchange = 'NSE', segment = 'CASH') {
    try {
      // Get 50 days of historical data for indicator calculation
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (50 * 24 * 60 * 60 * 1000)); // 50 days back
      
      const startTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const endTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
      
      const historicalData = await this.getHistoricalData(symbol, startTime, endTime, exchange, segment);
      
      if (!historicalData.data || !historicalData.data.candles || !Array.isArray(historicalData.data.candles)) {
        throw new Error('No historical data available for indicator calculation');
      }
      
      // Calculate the requested indicator
      const calculatedIndicator = this._calculateIndicator(historicalData.data.candles, indicator, period);
      
      return {
        broker: 'Groww',
        symbol: symbol,
        indicator: indicator,
        period: period,
        data: calculatedIndicator
      };
    } catch (error) {
      throw new Error(`Failed to get Groww technical indicators: ${error.message}`);
    }
  }

  // Individual Technical Indicator Methods
  async getRSI(symbol, period = 14, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'RSI', period, exchange, segment);
  }

  async getMACD(symbol, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'MACD', 14, exchange, segment);
  }

  async getBollingerBands(symbol, period = 20, standardDeviations = 2, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'BOLLINGER', period, exchange, segment);
  }

  async getVWAP(symbol, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'VWAP', 14, exchange, segment);
  }

  async getATR(symbol, period = 14, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'ATR', period, exchange, segment);
  }

  // Helper method to calculate technical indicators from historical data
  _calculateIndicator(candles, indicator, period) {
    // Simple implementation - in production, use a proper technical analysis library
    const closes = candles.map(candle => parseFloat(candle.close || candle[4]));
    
    switch (indicator.toUpperCase()) {
      case 'RSI':
        return this._calculateRSI(closes, period);
      case 'MACD':
        return this._calculateMACD(closes);
      case 'BOLLINGER':
      case 'BOLLINGER_BANDS':
        return this._calculateBollingerBands(closes, period);
      case 'VWAP':
        return this._calculateVWAP(candles);
      case 'ATR':
        return this._calculateATR(candles, period);
      default:
        throw new Error(`Indicator ${indicator} not implemented`);
    }
  }

  _calculateRSI(closes, period) {
    // Simple RSI calculation
    if (closes.length < period + 1) {
      return { error: 'Insufficient data for RSI calculation' };
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return {
      value: rsi,
      timestamp: new Date().toISOString(),
      period: period
    };
  }

  _calculateMACD(closes) {
    // Simple MACD calculation (12, 26, 9)
    if (closes.length < 26) {
      return { error: 'Insufficient data for MACD calculation' };
    }
    
    const ema12 = this._calculateEMA(closes, 12);
    const ema26 = this._calculateEMA(closes, 26);
    const macdLine = ema12 - ema26;
    
    return {
      macd: macdLine,
      signal: 0, // Simplified
      histogram: macdLine,
      timestamp: new Date().toISOString()
    };
  }

  _calculateBollingerBands(closes, period) {
    // Simple Bollinger Bands calculation
    if (closes.length < period) {
      return { error: 'Insufficient data for Bollinger Bands calculation' };
    }
    
    const recentCloses = closes.slice(-period);
    const sma = recentCloses.reduce((sum, price) => sum + price, 0) / period;
    
    const variance = recentCloses.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (2 * stdDev),
      middle: sma,
      lower: sma - (2 * stdDev),
      timestamp: new Date().toISOString(),
      period: period
    };
  }

  _calculateVWAP(candles) {
    // Volume Weighted Average Price
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    for (const candle of candles) {
      const volume = parseFloat(candle.volume || candle[5] || 0);
      const typical = (parseFloat(candle.high || candle[2]) + 
                      parseFloat(candle.low || candle[3]) + 
                      parseFloat(candle.close || candle[4])) / 3;
      
      totalVolume += volume;
      totalVolumePrice += (typical * volume);
    }
    
    return {
      value: totalVolumePrice / totalVolume,
      timestamp: new Date().toISOString()
    };
  }

  _calculateATR(candles, period) {
    // Average True Range
    if (candles.length < period + 1) {
      return { error: 'Insufficient data for ATR calculation' };
    }
    
    const trueRanges = [];
    
    for (let i = 1; i < candles.length; i++) {
      const high = parseFloat(candles[i].high || candles[i][2]);
      const low = parseFloat(candles[i].low || candles[i][3]);
      const prevClose = parseFloat(candles[i-1].close || candles[i-1][4]);
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    const atr = trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
    
    return {
      value: atr,
      timestamp: new Date().toISOString(),
      period: period
    };
  }

  _calculateEMA(closes, period) {
    // Simple EMA calculation
    const multiplier = 2 / (period + 1);
    let ema = closes[0];
    
    for (let i = 1; i < closes.length; i++) {
      ema = (closes[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Helper methods
  _validateOrderParams(params) {
    const required = ['quantity', 'exchange', 'product', 'order_type', 'transaction_type'];
    
    if (!params.trading_symbol && !params.symbol) {
      throw new Error('Missing required parameter: trading_symbol (or symbol)');
    }
    
    for (const field of required) {
      if (!params[field]) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }
    
    const validOrderTypes = ['MARKET', 'LIMIT', 'SL', 'SL-M'];
    if (!validOrderTypes.includes(params.order_type.toUpperCase())) {
      throw new Error(`Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}`);
    }
    
    const validTransactionTypes = ['BUY', 'SELL'];
    if (!validTransactionTypes.includes(params.transaction_type.toUpperCase())) {
      throw new Error(`Invalid transaction_type. Must be one of: ${validTransactionTypes.join(', ')}`);
    }
    
    if (params.order_type.toUpperCase() === 'LIMIT' && !params.price) {
      throw new Error('LIMIT orders require a price parameter');
    }
    
    if ((params.order_type.toUpperCase() === 'SL' || params.order_type.toUpperCase() === 'SL-M') && !params.trigger_price) {
      throw new Error('Stop loss orders require a trigger_price parameter');
    }
  }

  _generateOrderReferenceId() {
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${randomSuffix}`; // 14 chars, no hyphens
  }

  _mapSegment(segment) {
    const segmentMap = {
      'EQUITY': 'CASH',
      'CASH': 'CASH',
      'DERIVATIVE': 'FNO',
      'FNO': 'FNO',
      'COMMODITY': 'COMM',
      'CURRENCY': 'CURRENCY'
    };
    return segmentMap[segment.toUpperCase()] || 'CASH';
  }

  _mapProduct(product) {
    const productMap = {
      'CNC': 'CNC',
      'MIS': 'MIS',
      'NRML': 'NRML',
      'DELIVERY': 'CNC',
      'INTRADAY': 'MIS',
      'NORMAL': 'NRML'
    };
    return productMap[product.toUpperCase()] || 'CNC';
  }

  logout() {
    super.logout();
    this.apiKey = null;
  }

  _ensureAuthenticated() {
    if (!this.isAuthenticated || !this.apiKey) {
      throw new Error("Groww broker is not authenticated. Please authenticate first.");
    }
  }
}
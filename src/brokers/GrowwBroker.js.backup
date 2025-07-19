// src/brokers/GrowwBroker.js
import { BaseBroker } from './BaseBroker.js';

export class GrowwBroker extends BaseBroker {
  constructor() {
    super('Groww');
    this.baseURL = 'https://api.groww.in/v1';
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
      
      if (credentials.api_key) {
        this.apiKey = credentials.api_key;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "Groww API key set successfully!" 
        };
      }
      
      throw new Error("Groww requires: access_token or api_key");
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Groww authentication failed: ${error.message}`);
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'X-API-VERSION': '1.0',
      'Content-Type': 'application/json'
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
        // Debug logging for troubleshooting
        console.log(`Groww API Request: ${method} ${url}`);
        console.log(`Request Headers:`, options.headers);
        console.log(`Request Body:`, options.body);
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

  async getPortfolio(params = {}) {
    try {
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
      const response = await this.makeAPICall('GET', '/positions');
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww positions: ${error.message}`);
    }
  }

  async createOrder(params) {
    try {
      // Validate required parameters
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
        
        // For SL orders, price is also required
        if (params.order_type.toUpperCase() === 'SL' && params.price) {
          orderData.price = parseFloat(params.price);
        }
      }
      
      // Add order reference ID (required by Groww API despite documentation saying optional)
      orderData.order_reference_id = params.order_reference_id || this._generateOrderReferenceId();
      
      // Add disclosed quantity for iceberg-like orders
      if (params.disclosed_quantity) {
        orderData.disclosed_quantity = parseInt(params.disclosed_quantity);
      }
      
      // Add time in force for GTD orders
      if (params.time_in_force) {
        orderData.time_in_force = params.time_in_force.toUpperCase();
      }
      
      // Add after market order flag
      if (params.amo || params.after_market_order) {
        orderData.after_market_order = true;
      }
      
      // Determine order variety
      const variety = this._determineOrderVariety(params);
      if (variety !== 'regular') {
        orderData.variety = variety;
      }

      const response = await this.makeAPICall('POST', '/order/create', orderData);
      
      return {
        broker: 'Groww',
        order_id: response.groww_order_id || response.orderId || response.order_id,
        status: 'success',
        variety: variety,
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to create Groww order: ${error.message}`);
    }
  }

  async getOrders(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/order/list');
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww orders: ${error.message}`);
    }
  }

  async getOrderDetail(orderId) {
    try {
      const response = await this.makeAPICall('GET', `/order/detail/${orderId}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order detail: ${error.message}`);
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await this.makeAPICall('GET', `/order/status/${orderId}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order status: ${error.message}`);
    }
  }

  async getOrderStatusByReference(orderReferenceId) {
    try {
      const response = await this.makeAPICall('GET', `/order/status/reference/${orderReferenceId}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order status by reference: ${error.message}`);
    }
  }

  async getOrderTrades(orderId) {
    try {
      const response = await this.makeAPICall('GET', `/order/trades/${orderId}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww order trades: ${error.message}`);
    }
  }

  async getTrades(params = {}) {
    try {
      // Get all trades/executions for the user
      const response = await this.makeAPICall('GET', '/trades');
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww trades: ${error.message}`);
    }
  }

  async modifyOrder(orderId, params) {
    try {
      const modifyData = {
        groww_order_id: orderId,
        segment: params.segment || 'CASH' // segment is required for modify
      };

      // Add optional modifiable parameters
      if (params.quantity) modifyData.quantity = parseInt(params.quantity);
      if (params.price) modifyData.price = parseFloat(params.price);
      if (params.trigger_price) modifyData.trigger_price = parseFloat(params.trigger_price);
      if (params.order_type) modifyData.order_type = params.order_type.toUpperCase();
      if (params.validity) modifyData.validity = params.validity.toUpperCase();
      if (params.disclosed_quantity) modifyData.disclosed_quantity = parseInt(params.disclosed_quantity);

      const response = await this.makeAPICall('POST', '/order/modify', modifyData);
      
      return {
        broker: 'Groww',
        order_id: response.groww_order_id || response.orderId || orderId,
        status: 'modified',
        variety: 'regular',
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
        segment: params.segment || 'CASH' // segment is required for cancel
      };

      const response = await this.makeAPICall('POST', '/order/cancel', cancelData);
      
      return {
        broker: 'Groww',
        order_id: orderId,
        status: 'cancelled',
        variety: params.variety || 'regular',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to cancel Groww order: ${error.message}`);
    }
  }

  async getQuote(symbols) {
    try {
      const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
      const response = await this.makeAPICall('GET', `/live-data/quote?symbols=${encodeURIComponent(symbolsParam)}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww quotes: ${error.message}`);
    }
  }

  async getMargins(params = {}) {
    try {
      // Get available user margin using correct Groww API endpoint
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
      // Calculate required margin for specific orders
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
      // Helper method to calculate margin for a single order
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

  async searchInstruments(query, segment = 'CASH', exchange = 'NSE') {
    try {
      const params = new URLSearchParams({
        q: query,
        segment: segment,
        exchange: exchange
      });
      
      const response = await this.makeAPICall('GET', `/instruments/search?${params.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to search Groww instruments: ${error.message}`);
    }
  }

  async getInstrumentDetail(instrumentId) {
    try {
      const response = await this.makeAPICall('GET', `/instruments/${instrumentId}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww instrument detail: ${error.message}`);
    }
  }

  async getHistoricalData(symbol, period = '1D', exchange = 'NSE', segment = 'CASH') {
    try {
      const params = new URLSearchParams({
        symbol: symbol,
        period: period,
        exchange: exchange,
        segment: segment
      });
      
      const response = await this.makeAPICall('GET', `/historical/candle/range?${params.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww historical data: ${error.message}`);
    }
  }

  async getTechnicalIndicators(symbol, indicator, period = 14, exchange = 'NSE', segment = 'CASH') {
    try {
      const params = new URLSearchParams({
        symbol: symbol,
        indicator: indicator,
        period: period.toString(),
        exchange: exchange,
        segment: segment
      });
      
      const response = await this.makeAPICall('GET', `/technical/${indicator}?${params.toString()}`);
      
      return {
        broker: 'Groww',
        data: response
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

  async getADX(symbol, period = 14, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'ADX', period, exchange, segment);
  }

  async getOBV(symbol, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'OBV', 14, exchange, segment);
  }

  async getMFI(symbol, period = 14, exchange = 'NSE', segment = 'CASH') {
    return this.getTechnicalIndicators(symbol, 'MFI', period, exchange, segment);
  }

  // Enhanced order methods for different types
  
  async placeAMO(params) {
    params.amo = true;
    return this.createOrder(params);
  }
  
  async placeGTDOrder(params) {
    if (!params.time_in_force) {
      params.time_in_force = 'GTD';
    }
    if (!params.validity_date) {
      throw new Error('GTD orders require a validity_date parameter');
    }
    params.validity = 'GTD';
    return this.createOrder(params);
  }
  
  async placeIcebergOrder(params) {
    if (!params.disclosed_quantity) {
      throw new Error('Iceberg orders require a disclosed_quantity parameter');
    }
    
    if (parseInt(params.disclosed_quantity) >= parseInt(params.quantity)) {
      throw new Error('disclosed_quantity must be less than total quantity for iceberg orders');
    }
    
    return this.createOrder(params);
  }
  
  async placeBracketOrder(params) {
    if (!params.stop_loss || !params.target) {
      throw new Error('Bracket orders require both stop_loss and target parameters');
    }
    
    // Groww bracket orders typically use MIS (intraday) product
    if (!params.product) {
      params.product = 'MIS';
    }
    return this.createOrder(params);
  }
  
  async placeCoverOrder(params) {
    if (!params.stop_loss) {
      throw new Error('Cover orders require a stop_loss parameter');
    }
    
    // Groww cover orders typically use MIS (intraday) product
    if (!params.product) {
      params.product = 'MIS';
    }
    return this.createOrder(params);
  }
  
  // Method to get order types information
  getOrderTypesInfo() {
    return {
      order_types: {
        MARKET: {
          description: 'Market order - executed at current market price',
          required_params: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'product', 'segment'],
          optional_params: ['validity', 'order_reference_id', 'amo']
        },
        LIMIT: {
          description: 'Limit order - executed at specified price or better',
          required_params: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'product', 'segment', 'price'],
          optional_params: ['validity', 'disclosed_quantity', 'order_reference_id', 'amo']
        },
        SL: {
          description: 'Stop Loss order - limit order triggered when price hits trigger price',
          required_params: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'product', 'segment', 'price', 'trigger_price'],
          optional_params: ['validity', 'order_reference_id']
        },
        'SL-M': {
          description: 'Stop Loss Market order - market order triggered when price hits trigger price',
          required_params: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'product', 'segment', 'trigger_price'],
          optional_params: ['validity', 'order_reference_id']
        }
      },
      varieties: {
        regular: {
          description: 'Regular order placed during market hours',
          supported_order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M']
        },
        amo: {
          description: 'After Market Order - placed after market hours for next day execution',
          supported_order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M']
        },
        iceberg: {
          description: 'Large order split into smaller disclosed quantities',
          supported_order_types: ['LIMIT'],
          required_params: ['disclosed_quantity']
        },
        gtd: {
          description: 'Good Till Date - order valid until specified date',
          supported_order_types: ['LIMIT', 'SL', 'SL-M'],
          required_params: ['validity_date']
        },
        bracket: {
          description: 'Bracket order with stop loss and target',
          supported_order_types: ['LIMIT'],
          required_params: ['stop_loss', 'target']
        },
        cover: {
          description: 'Cover order with stop loss',
          supported_order_types: ['MARKET', 'LIMIT'],
          required_params: ['stop_loss']
        }
      },
      products: {
        CNC: 'Cash and Carry - delivery-based equity trading with full payment',
        MIS: 'Margin Intraday Square-off - higher leverage, must close by day end',
        NRML: 'Regular margin trading - allows overnight positions with standard leverage'
      },
      margin_types: {
        available: 'Available margin for trading',
        required: 'Required margin for specific orders'
      },
      segments: {
        CASH: 'Cash/Equity segment',
        FNO: 'Futures and Options',
        COMM: 'Commodity',
        CURRENCY: 'Currency derivatives'
      },
      validity: {
        DAY: 'Valid for the day',
        IOC: 'Immediate or Cancel',
        GTD: 'Good Till Date',
        GTC: 'Good Till Cancelled'
      }
    };
  }
  
  // Helper method to validate order parameters
  _validateOrderParams(params) {
    // Groww API required parameters: trading_symbol, quantity, validity, exchange, segment, product, order_type, transaction_type
    const required = ['quantity', 'validity', 'exchange', 'product', 'order_type', 'transaction_type'];
    
    // Check for trading_symbol or symbol
    if (!params.trading_symbol && !params.symbol) {
      throw new Error('Missing required parameter: trading_symbol (or symbol)');
    }
    
    for (const field of required) {
      if (!params[field]) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }
    
    // Validate order type
    const validOrderTypes = ['MARKET', 'LIMIT', 'SL', 'SL-M'];
    if (!validOrderTypes.includes(params.order_type.toUpperCase())) {
      throw new Error(`Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}`);
    }
    
    // Validate transaction type
    const validTransactionTypes = ['BUY', 'SELL'];
    if (!validTransactionTypes.includes(params.transaction_type.toUpperCase())) {
      throw new Error(`Invalid transaction_type. Must be one of: ${validTransactionTypes.join(', ')}`);
    }
    
    // Validate segment is provided (Groww requires this)
    if (!params.segment) {
      params.segment = 'CASH'; // Default to CASH if not provided
    }
    
    // Validate exchange
    const validExchanges = ['NSE', 'BSE', 'NFO', 'MCX', 'CDS'];
    if (!validExchanges.includes(params.exchange.toUpperCase())) {
      throw new Error(`Invalid exchange. Must be one of: ${validExchanges.join(', ')}`);
    }
    
    // Validate product
    const validProducts = ['CNC', 'MIS', 'NRML'];
    const mappedProduct = this._mapProduct(params.product);
    if (!validProducts.includes(mappedProduct)) {
      throw new Error(`Invalid product. Must be one of: ${validProducts.join(', ')}`);
    }
    
    // Validate validity
    const validValidities = ['DAY', 'IOC', 'GTD', 'GTC'];
    if (!validValidities.includes(params.validity.toUpperCase())) {
      throw new Error(`Invalid validity. Must be one of: ${validValidities.join(', ')}`);
    }
    
    // Note: order_reference_id is auto-generated if not provided (Groww API requirement)
    
    // Validate order type specific requirements
    if (params.order_type.toUpperCase() === 'LIMIT' && !params.price) {
      throw new Error('LIMIT orders require a price parameter');
    }
    
    if ((params.order_type.toUpperCase() === 'SL' || params.order_type.toUpperCase() === 'SL-M') && !params.trigger_price) {
      throw new Error('Stop loss orders require a trigger_price parameter');
    }
    
    if (params.order_type.toUpperCase() === 'SL' && !params.price) {
      throw new Error('SL orders require both price and trigger_price parameters');
    }
    
    // Validate GTD orders
    if (params.validity && params.validity.toUpperCase() === 'GTD' && !params.validity_date) {
      throw new Error('GTD orders require a validity_date parameter');
    }
  }
  
  // Helper method to determine order variety
  _determineOrderVariety(params) {
    // Check for iceberg order
    if (params.disclosed_quantity && parseInt(params.disclosed_quantity) < parseInt(params.quantity)) {
      return 'iceberg';
    }
    
    // Check for AMO (After Market Orders)
    if (params.amo || params.after_market_order) {
      return 'amo';
    }
    
    // Check for GTD orders
    if (params.validity && params.validity.toUpperCase() === 'GTD') {
      return 'gtd';
    }
    
    // Check for Cover Orders
    if (params.product && params.product.toUpperCase() === 'CO') {
      return 'cover';
    }
    
    // Check for Bracket Orders
    if (params.product && params.product.toUpperCase() === 'BO') {
      return 'bracket';
    }
    
    // Default to regular
    return 'regular';
  }
  
  // Helper method to generate a valid order reference ID
  _generateOrderReferenceId() {
    // Format: 8-20 alphanumeric with at most 2 hyphens
    // Example from docs: "Ab-654321234-1628190"
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Create reference ID: PREFIX-TIMESTAMP-RANDOM (fits within 8-20 chars with 2 hyphens)
    const referenceId = `TT-${timestamp}-${randomSuffix}`;
    
    // Ensure it's within 20 character limit
    return referenceId.length <= 20 ? referenceId : referenceId.substring(0, 20);
  }

  // Helper methods to map parameters
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
    // Groww API accepts: CNC, MIS, NRML (keep original values)
    const productMap = {
      'CNC': 'CNC',        // Cash and Carry
      'MIS': 'MIS',        // Margin Intraday Square-off  
      'NRML': 'NRML',      // Regular margin trading
      'DELIVERY': 'CNC',   // Map common aliases
      'INTRADAY': 'MIS',   
      'NORMAL': 'NRML',
      'MTF': 'MIS',        // Map MTF to MIS for Groww
      'CO': 'MIS',         // Cover orders use MIS
      'BO': 'MIS'          // Bracket orders use MIS
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
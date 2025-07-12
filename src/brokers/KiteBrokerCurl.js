// src/brokers/KiteBrokerCurl.js
// Curl-based implementation of Kite broker without KiteConnect SDK dependency
import { BaseBroker } from './BaseBroker.js';
import { TechnicalIndicators } from '../utils/technicalIndicators.js';

export class KiteBrokerCurl extends BaseBroker {
  constructor() {
    super('Kite');
    this.apiKey = null;
    this.apiSecret = null;
    this.accessToken = null;
    this.baseURL = 'https://api.kite.trade';
  }

  async authenticate(credentials) {
    try {
      // Authentication with request token (full flow)
      if (credentials.request_token && credentials.api_key && credentials.api_secret) {
        this.apiKey = credentials.api_key;
        this.apiSecret = credentials.api_secret;
        
        // Generate access token using curl approach
        const accessTokenData = await this._generateAccessToken(
          credentials.request_token, 
          credentials.api_key, 
          credentials.api_secret
        );
        
        this.accessToken = accessTokenData.access_token;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "Kite authentication successful!",
          data: {
            access_token: accessTokenData.access_token,
            user_id: accessTokenData.user_id,
            user_name: accessTokenData.user_name
          }
        };
      }
      
      // Authentication with existing access token
      if (credentials.access_token && credentials.api_key) {
        this.apiKey = credentials.api_key;
        this.accessToken = credentials.access_token;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "Kite access token set successfully!" 
        };
      }
      
      throw new Error("Kite requires: api_key + (access_token OR request_token + api_secret)");
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Kite authentication failed: ${error.message}`);
    }
  }

  async _generateAccessToken(requestToken, apiKey, apiSecret) {
    try {
      // Generate checksum using Web Crypto API (SHA-256)
      const data = apiKey + requestToken + apiSecret;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Create request body
      const body = new URLSearchParams({
        api_key: apiKey,
        request_token: requestToken,
        checksum: checksum
      });

      // Make the request
      const response = await fetch(`${this.baseURL}/session/token`, {
        method: 'POST',
        headers: {
          'X-Kite-Version': '3',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  async _makeKiteAPICall(method, endpoint, data = null, headers = {}) {
    this._ensureAuthenticated();
    
    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      'X-Kite-Version': '3',
      'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      ...headers
    };

    const options = {
      method: method,
      headers: requestHeaders
    };

    if (data && method !== 'GET') {
      if (data instanceof URLSearchParams) {
        options.body = data;
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        options.body = new URLSearchParams(data);
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error_type || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async getPortfolio(params = {}) {
    this._ensureAuthenticated();
    
    try {
      const holdings = await this._makeKiteAPICall('GET', '/portfolio/holdings');
      
      return {
        broker: 'Kite',
        data: holdings.map(holding => ({
          instrument: holding.tradingsymbol,
          quantity: holding.quantity,
          average_price: holding.average_price,
          last_price: holding.last_price,
          pnl: holding.pnl,
          day_change: holding.day_change,
          day_change_percentage: holding.day_change_percentage,
          current_value: holding.quantity * holding.last_price,
          invested_value: holding.quantity * holding.average_price
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get Kite portfolio: ${error.message}`);
    }
  }

  async getPositions(params = {}) {
    this._ensureAuthenticated();
    
    try {
      const positions = await this._makeKiteAPICall('GET', '/portfolio/positions');
      
      return {
        broker: 'Kite',
        data: {
          net: positions.net,
          day: positions.day
        }
      };
    } catch (error) {
      throw new Error(`Failed to get Kite positions: ${error.message}`);
    }
  }

  async createOrder(params) {
    this._ensureAuthenticated();
    
    try {
      // Validate required parameters
      this._validateOrderParams(params);
      
      const orderData = {
        tradingsymbol: params.trading_symbol?.toUpperCase() || params.symbol?.toUpperCase(),
        exchange: params.exchange.toUpperCase(),
        transaction_type: params.transaction_type.toUpperCase(),
        order_type: params.order_type.toUpperCase(),
        quantity: parseInt(params.quantity),
        product: params.product.toUpperCase(),
        validity: params.validity?.toUpperCase() || "DAY"
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
      
      // Add optional parameters
      if (params.disclosed_quantity) orderData.disclosed_quantity = parseInt(params.disclosed_quantity);
      if (params.tag) orderData.tag = params.tag;
      if (params.stoploss) orderData.stoploss = parseFloat(params.stoploss);
      if (params.squareoff) orderData.squareoff = parseFloat(params.squareoff);
      if (params.trailing_stoploss) orderData.trailing_stoploss = parseFloat(params.trailing_stoploss);
      
      // Determine order variety
      const variety = params.variety || this._determineOrderVariety(params);
      
      const result = await this._makeKiteAPICall('POST', `/orders/${variety}`, orderData);
      
      return {
        broker: 'Kite',
        order_id: result.order_id,
        status: 'success',
        variety: variety,
        data: orderData
      };
    } catch (error) {
      throw new Error(`Failed to create Kite order: ${error.message}`);
    }
  }

  async getOrders(params = {}) {
    this._ensureAuthenticated();
    
    try {
      const orders = await this._makeKiteAPICall('GET', '/orders');
      
      return {
        broker: 'Kite',
        data: orders
      };
    } catch (error) {
      throw new Error(`Failed to get Kite orders: ${error.message}`);
    }
  }

  async getQuote(symbols) {
    this._ensureAuthenticated();
    
    try {
      const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
      const quotes = await this._makeKiteAPICall('GET', `/quote?i=${encodeURIComponent(symbolsParam)}`);
      
      return {
        broker: 'Kite',
        data: quotes
      };
    } catch (error) {
      throw new Error(`Failed to get Kite quotes: ${error.message}`);
    }
  }

  async getMargins(segment = null) {
    this._ensureAuthenticated();
    
    try {
      let endpoint = '/user/margins';
      if (segment) {
        endpoint += `/${segment}`;
      }
      
      const margins = await this._makeKiteAPICall('GET', endpoint);
      
      return {
        broker: 'Kite',
        segment: segment || 'all',
        data: margins
      };
    } catch (error) {
      throw new Error(`Failed to get Kite margins: ${error.message}`);
    }
  }
  
  async calculateOrderMargins(orders) {
    this._ensureAuthenticated();
    
    try {
      const response = await this._makeKiteAPICall('POST', '/margins/orders', {
        orders: JSON.stringify(orders)
      });
      
      return {
        broker: 'Kite',
        orderCount: orders.length,
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to calculate Kite order margins: ${error.message}`);
    }
  }
  
  async calculateBasketMargins(orders, considerPositions = true, mode = null) {
    this._ensureAuthenticated();
    
    try {
      const params = { 
        orders: JSON.stringify(orders),
        consider_positions: considerPositions 
      };
      if (mode) params.mode = mode;
      
      const response = await this._makeKiteAPICall('POST', '/margins/basket', params);
      
      return {
        broker: 'Kite',
        orderCount: orders.length,
        considerPositions: considerPositions,
        mode: mode,
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to calculate Kite basket margins: ${error.message}`);
    }
  }
  
  async calculateOrderCharges(orders) {
    this._ensureAuthenticated();
    
    try {
      const response = await this._makeKiteAPICall('POST', '/charges/orders', {
        orders: JSON.stringify(orders)
      });
      
      return {
        broker: 'Kite',
        orderCount: orders.length,
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to calculate Kite order charges: ${error.message}`);
    }
  }

  async getTrades(params = {}) {
    this._ensureAuthenticated();
    
    try {
      const trades = await this._makeKiteAPICall('GET', '/trades');
      
      return {
        broker: 'Kite',
        data: trades
      };
    } catch (error) {
      throw new Error(`Failed to get Kite trades: ${error.message}`);
    }
  }

  async modifyOrder(orderId, params) {
    this._ensureAuthenticated();
    
    try {
      const modifyParams = {
        order_id: orderId
      };

      if (params.quantity) modifyParams.quantity = parseInt(params.quantity);
      if (params.price) modifyParams.price = parseFloat(params.price);
      if (params.order_type) modifyParams.order_type = params.order_type.toUpperCase();
      if (params.validity) modifyParams.validity = params.validity.toUpperCase();
      if (params.trigger_price) modifyParams.trigger_price = parseFloat(params.trigger_price);
      if (params.disclosed_quantity) modifyParams.disclosed_quantity = parseInt(params.disclosed_quantity);
      
      const variety = params.variety || "regular";
      const response = await this._makeKiteAPICall('PUT', `/orders/${variety}/${orderId}`, modifyParams);
      
      return {
        broker: 'Kite',
        order_id: response.order_id,
        status: 'modified',
        variety: variety,
        data: modifyParams
      };
    } catch (error) {
      throw new Error(`Failed to modify Kite order: ${error.message}`);
    }
  }

  async cancelOrder(orderId, variety = "regular") {
    this._ensureAuthenticated();
    
    try {
      const response = await this._makeKiteAPICall('DELETE', `/orders/${variety}/${orderId}`);
      
      return {
        broker: 'Kite',
        order_id: response.order_id,
        status: 'cancelled',
        variety: variety
      };
    } catch (error) {
      throw new Error(`Failed to cancel Kite order: ${error.message}`);
    }
  }

  async getInstruments(exchange = null) {
    this._ensureAuthenticated();
    
    try {
      let endpoint = '/instruments';
      if (exchange) {
        endpoint += `/${exchange}`;
      }
      
      const instruments = await this._makeKiteAPICall('GET', endpoint);
      
      return {
        broker: 'Kite',
        data: instruments
      };
    } catch (error) {
      throw new Error(`Failed to get Kite instruments: ${error.message}`);
    }
  }

  async getProfile() {
    this._ensureAuthenticated();
    
    try {
      const profile = await this._makeKiteAPICall('GET', '/user/profile');
      
      return {
        broker: 'Kite',
        data: profile
      };
    } catch (error) {
      throw new Error(`Failed to get Kite profile: ${error.message}`);
    }
  }

  async getMFHoldings() {
    this._ensureAuthenticated();
    
    try {
      const holdings = await this._makeKiteAPICall('GET', '/mf/holdings');
      
      return {
        broker: 'Kite',
        data: holdings
      };
    } catch (error) {
      throw new Error(`Failed to get Kite MF holdings: ${error.message}`);
    }
  }

  async getMFOrders() {
    this._ensureAuthenticated();
    
    try {
      const orders = await this._makeKiteAPICall('GET', '/mf/orders');
      
      return {
        broker: 'Kite',
        data: orders
      };
    } catch (error) {
      throw new Error(`Failed to get Kite MF orders: ${error.message}`);
    }
  }

  async placeMFOrder(params) {
    this._ensureAuthenticated();
    
    try {
      const mfOrder = {
        tradingsymbol: params.tradingsymbol,
        transaction_type: params.transaction_type.toUpperCase(),
        quantity: params.quantity ? parseInt(params.quantity) : null,
        amount: params.amount ? parseFloat(params.amount) : null,
        tag: params.tag || null
      };

      const response = await this._makeKiteAPICall('POST', '/mf/orders', mfOrder);
      
      return {
        broker: 'Kite',
        order_id: response.order_id,
        status: 'success',
        data: mfOrder
      };
    } catch (error) {
      throw new Error(`Failed to place Kite MF order: ${error.message}`);
    }
  }

  async cancelMFOrder(orderId) {
    this._ensureAuthenticated();
    
    try {
      const response = await this._makeKiteAPICall('DELETE', `/mf/orders/${orderId}`);
      
      return {
        broker: 'Kite',
        order_id: response.order_id,
        status: 'cancelled'
      };
    } catch (error) {
      throw new Error(`Failed to cancel Kite MF order: ${error.message}`);
    }
  }

  async getMFInstruments() {
    this._ensureAuthenticated();
    
    try {
      const instruments = await this._makeKiteAPICall('GET', '/mf/instruments');
      
      return {
        broker: 'Kite',
        data: instruments
      };
    } catch (error) {
      throw new Error(`Failed to get Kite MF instruments: ${error.message}`);
    }
  }

  async getGTTs() {
    this._ensureAuthenticated();
    
    try {
      const gtts = await this._makeKiteAPICall('GET', '/gtt/triggers');
      
      return {
        broker: 'Kite',
        data: gtts
      };
    } catch (error) {
      throw new Error(`Failed to get Kite GTTs: ${error.message}`);
    }
  }

  async placeGTT(params) {
    this._ensureAuthenticated();
    
    try {
      const gttParams = {
        trigger_type: params.trigger_type,
        tradingsymbol: params.tradingsymbol,
        exchange: params.exchange,
        trigger_values: params.trigger_values,
        last_price: params.last_price,
        orders: JSON.stringify(params.orders)
      };

      const response = await this._makeKiteAPICall('POST', '/gtt/triggers', gttParams);
      
      return {
        broker: 'Kite',
        trigger_id: response.trigger_id,
        status: 'success',
        data: gttParams
      };
    } catch (error) {
      throw new Error(`Failed to place Kite GTT: ${error.message}`);
    }
  }

  async modifyGTT(triggerId, params) {
    this._ensureAuthenticated();
    
    try {
      const response = await this._makeKiteAPICall('PUT', `/gtt/triggers/${triggerId}`, params);
      
      return {
        broker: 'Kite',
        trigger_id: response.trigger_id,
        status: 'modified'
      };
    } catch (error) {
      throw new Error(`Failed to modify Kite GTT: ${error.message}`);
    }
  }

  async deleteGTT(triggerId) {
    this._ensureAuthenticated();
    
    try {
      const response = await this._makeKiteAPICall('DELETE', `/gtt/triggers/${triggerId}`);
      
      return {
        broker: 'Kite',
        trigger_id: response.trigger_id,
        status: 'deleted'
      };
    } catch (error) {
      throw new Error(`Failed to delete Kite GTT: ${error.message}`);
    }
  }

  generateLoginUrl() {
    if (!this.apiKey) {
      throw new Error("API key required to generate login URL");
    }
    
    return `https://kite.trade/connect/login?api_key=${this.apiKey}&v=3`;
  }

  logout() {
    super.logout();
    this.apiKey = null;
    this.apiSecret = null;
    this.accessToken = null;
  }

  // Helper method to validate order parameters
  _validateOrderParams(params) {
    const required = ['trading_symbol', 'exchange', 'transaction_type', 'order_type', 'quantity', 'product'];
    
    for (const field of required) {
      if (!params[field] && !params[field.replace('trading_symbol', 'symbol')]) {
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
    
    // Validate product type
    const validProducts = ['CNC', 'MIS', 'NRML', 'CO', 'BO'];
    if (!validProducts.includes(params.product.toUpperCase())) {
      throw new Error(`Invalid product. Must be one of: ${validProducts.join(', ')}`);
    }
    
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
  }
  
  // Helper method to determine order variety
  _determineOrderVariety(params) {
    // Check for iceberg order
    if (params.disclosed_quantity && parseInt(params.disclosed_quantity) < parseInt(params.quantity)) {
      return 'iceberg';
    }
    
    // Check for AMO (After Market Orders)
    if (params.amo || params.variety === 'amo') {
      return 'amo';
    }
    
    // Check for Cover Orders
    if (params.product.toUpperCase() === 'CO') {
      return 'co';
    }
    
    // Check for Bracket Orders
    if (params.product.toUpperCase() === 'BO') {
      return 'bo';
    }
    
    // Default to regular
    return 'regular';
  }

  _ensureAuthenticated() {
    if (!this.isAuthenticated || !this.apiKey || !this.accessToken) {
      throw new Error("Kite broker is not authenticated. Please authenticate first.");
    }
  }
}
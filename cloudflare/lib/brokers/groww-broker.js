// Cloudflare Worker-compatible Groww Broker
// Simplified version focused on core functionality

export class WorkerGrowwBroker {
  constructor() {
    this.brokerName = 'Groww';
    this.baseURL = 'https://api.groww.in/v1';
    this.apiKey = null;
    this.isAuthenticated = false;
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
      
      // Add order reference ID (required by Groww API)
      orderData.order_reference_id = params.order_reference_id || this._generateOrderReferenceId();

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

      const response = await this.makeAPICall('POST', '/order/modify', modifyData);
      
      return {
        broker: 'Groww',
        order_id: response.groww_order_id || response.orderId || orderId,
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
        segment: params.segment || 'CASH' // segment is required for cancel
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
      const response = await this.makeAPICall('GET', '/margins/detail/user');
      
      return {
        broker: 'Groww',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Groww margins: ${error.message}`);
    }
  }

  // Restore authentication state from session
  restoreAuthState(authData) {
    if (authData && authData.credentials) {
      this.apiKey = authData.credentials.access_token || authData.credentials.api_key;
      this.isAuthenticated = true;
    }
  }

  // Helper method to validate order parameters
  _validateOrderParams(params) {
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
    
    // Set default segment if not provided
    if (!params.segment) {
      params.segment = 'CASH';
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
  
  // Helper method to generate a valid order reference ID
  _generateOrderReferenceId() {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceId = `WK-${timestamp}-${randomSuffix}`;
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
    const productMap = {
      'CNC': 'CNC',
      'MIS': 'MIS',
      'NRML': 'NRML',
      'DELIVERY': 'CNC',
      'INTRADAY': 'MIS',
      'NORMAL': 'NRML',
      'MTF': 'MIS',
      'CO': 'MIS',
      'BO': 'MIS'
    };
    return productMap[product.toUpperCase()] || 'CNC';
  }

  _ensureAuthenticated() {
    if (!this.isAuthenticated || !this.apiKey) {
      throw new Error("Groww broker is not authenticated. Please authenticate first.");
    }
  }

  logout() {
    this.apiKey = null;
    this.isAuthenticated = false;
  }
}
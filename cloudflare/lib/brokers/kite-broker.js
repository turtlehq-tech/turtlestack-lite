// Cloudflare Worker-compatible Kite Broker
// Uses native fetch API and Web Crypto for maximum compatibility

export class WorkerKiteBroker {
  constructor() {
    this.brokerName = 'Kite';
    this.apiKey = null;
    this.apiSecret = null;
    this.accessToken = null;
    this.baseURL = 'https://api.kite.trade';
    this.isAuthenticated = false;
  }

  async authenticate(credentials) {
    try {
      // Authentication with request token (full flow)
      if (credentials.request_token && credentials.api_key && credentials.api_secret) {
        this.apiKey = credentials.api_key;
        this.apiSecret = credentials.api_secret;
        
        // Generate access token using Web Crypto API
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
      const errorData = await response.json().catch(() => ({}));
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

  generateLoginUrl() {
    if (!this.apiKey) {
      throw new Error("API key required to generate login URL");
    }
    
    return `https://kite.trade/connect/login?api_key=${this.apiKey}&v=3`;
  }

  // Restore authentication state from session
  restoreAuthState(authData) {
    if (authData && authData.credentials) {
      this.apiKey = authData.credentials.api_key;
      this.accessToken = authData.credentials.access_token;
      this.isAuthenticated = true;
    }
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

  logout() {
    this.apiKey = null;
    this.apiSecret = null;
    this.accessToken = null;
    this.isAuthenticated = false;
  }
}
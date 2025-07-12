// src/brokers/AngelOneBroker.js
// AngelOne SmartAPI broker implementation using curl/fetch-based approach
import { BaseBroker } from './BaseBroker.js';

export class AngelOneBroker extends BaseBroker {
  constructor() {
    super('AngelOne');
    this.clientCode = null;
    this.apiKey = null;
    this.jwtToken = null;
    this.refreshToken = null;
    this.feedToken = null;
    this.baseURL = 'https://apiconnect.angelone.in';
  }

  async authenticate(credentials) {
    try {
      // Handle both client_code and clientcode parameter names
      const clientCode = credentials.clientcode || credentials.client_code;
      const clientId = credentials.client_id || clientCode; // Support both naming conventions
      
      // Primary authentication method: API key + Client ID + PIN/Password + TOTP Secret
      if (credentials.api_key && clientId && credentials.password && credentials.totp_secret) {
        this.clientCode = clientId;
        this.apiKey = credentials.api_key;
        
        // Generate TOTP from secret and authenticate
        const currentTOTP = await this._generateTOTP(credentials.totp_secret);
        const sessionData = await this._generateSession(
          clientId,
          credentials.password,
          currentTOTP
        );
        
        this.jwtToken = sessionData.jwtToken;
        this.refreshToken = sessionData.refreshToken;
        this.feedToken = sessionData.feedToken;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "AngelOne authentication successful!",
          data: {
            jwtToken: sessionData.jwtToken,
            refreshToken: sessionData.refreshToken,
            feedToken: sessionData.feedToken,
            clientCode: sessionData.clientCode,
            method: 'totp_secret',
            note: 'Authentication completed with API key, Client ID, PIN, and TOTP secret'
          }
        };
      }
      
      // Fallback method: Use existing JWT token if provided
      if (credentials.jwtToken && clientId && credentials.api_key) {
        this.clientCode = clientId;
        this.apiKey = credentials.api_key;
        this.jwtToken = credentials.jwtToken;
        this.refreshToken = credentials.refreshToken; // Optional
        this.feedToken = credentials.feedToken; // Optional
        
        // Validate the JWT token by making a test API call
        try {
          await this._validateJWTToken();
          this.isAuthenticated = true;
          
          return { 
            success: true, 
            message: "AngelOne JWT token authentication successful!",
            data: {
              clientCode: this.clientCode,
              method: 'jwt_token'
            }
          };
        } catch (error) {
          // JWT token is invalid or expired
          this.isAuthenticated = false;
          throw new Error(`JWT token validation failed: ${error.message}. Please re-authenticate with credentials.`);
        }
      }
      
      throw new Error("AngelOne authentication requires:\n" +
        "• API Key\n" + 
        "• Client ID\n" +
        "• PIN/Password\n" +
        "• TOTP Secret Key\n\n" +
        "Alternative: Use existing jwtToken + api_key + client_id for quick login");
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`AngelOne authentication failed: ${error.message}`);
    }
  }

  async _generateSession(clientCode, password, totp) {
    try {
      const body = {
        clientcode: clientCode,
        password: password,
        totp: totp
      };

      const response = await fetch(`${this.baseURL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': await this._getLocalIP(),
          'X-ClientPublicIP': await this._getPublicIP(),
          'X-MACAddress': await this._getMACAddress(),
          'X-PrivateKey': this.apiKey
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.errorMessage || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // AngelOne returns data in result.data
      if (result.status && result.data) {
        return {
          jwtToken: result.data.jwtToken,
          refreshToken: result.data.refreshToken,
          feedToken: result.data.feedToken,
          clientCode: result.data.clientcode
        };
      } else {
        throw new Error(result.message || 'Invalid response from AngelOne API');
      }
    } catch (error) {
      throw new Error(`Failed to generate AngelOne session: ${error.message}`);
    }
  }

  async _validateJWTToken() {
    try {
      // Make a lightweight API call to validate the JWT token
      // Using the profile endpoint as it's a simple GET request
      const response = await fetch(`${this.baseURL}/rest/secure/angelbroking/user/v1/getProfile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': await this._getLocalIP(),
          'X-ClientPublicIP': await this._getPublicIP(),
          'X-MACAddress': await this._getMACAddress(),
          'X-PrivateKey': this.apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.errorMessage || `HTTP ${response.status} - Token likely expired or invalid`);
      }

      const result = await response.json();
      
      // Check if we got a valid response
      if (result.status === false) {
        throw new Error(result.message || result.errorMessage || 'JWT token validation failed');
      }
      
      // Token is valid
      return true;
    } catch (error) {
      throw new Error(`JWT token validation failed: ${error.message}`);
    }
  }

  async _generateTOTP(secret) {
    try {
      const { createHmac } = await import('crypto');
      
      // Simple base32 to buffer conversion
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
      let bits = '';
      
      // Convert base32 to binary
      for (let i = 0; i < cleanSecret.length; i++) {
        const val = base32Chars.indexOf(cleanSecret[i]);
        if (val === -1) throw new Error('Invalid base32 character');
        bits += val.toString(2).padStart(5, '0');
      }
      
      // Convert binary to buffer
      const key = Buffer.alloc(Math.floor(bits.length / 8));
      for (let i = 0; i < key.length; i++) {
        key[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
      }
      
      // Get current time step (30-second intervals)
      const timeStep = Math.floor(Date.now() / 1000 / 30);
      
      // Convert time step to 8-byte buffer (big-endian)
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
      timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);
      
      // Generate HMAC-SHA1
      const hmac = createHmac('sha1', key);
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      // Dynamic truncation
      const offset = hash[hash.length - 1] & 0xf;
      const code = (hash.readUInt32BE(offset) & 0x7fffffff) % 1000000;
      
      // Return 6-digit code with leading zeros
      return code.toString().padStart(6, '0');
    } catch (error) {
      throw new Error(`Failed to generate TOTP: ${error.message}. Ensure TOTP secret is valid base32 format.`);
    }
  }

  async _makeAngelOneAPICall(method, endpoint, data = null, headers = {}) {
    this._ensureAuthenticated();
    
    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      'Authorization': `Bearer ${this.jwtToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': await this._getLocalIP(),
      'X-ClientPublicIP': await this._getPublicIP(),
      'X-MACAddress': await this._getMACAddress(),
      'X-PrivateKey': this.apiKey,
      ...headers
    };

    const options = {
      method: method,
      headers: requestHeaders
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.errorMessage || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // AngelOne API returns data in result.data
    if (result.status === false) {
      throw new Error(result.message || result.errorMessage || 'API call failed');
    }
    
    return result.data || result;
  }

  async getPortfolio() {
    this._ensureAuthenticated();
    
    try {
      const holdings = await this._makeAngelOneAPICall('GET', '/rest/secure/angelbroking/portfolio/v1/getHolding');
      
      return {
        broker: 'AngelOne',
        data: holdings.map(holding => ({
          instrument: holding.tradingsymbol,
          quantity: holding.quantity,
          average_price: holding.averageprice,
          last_price: holding.ltp,
          pnl: holding.pnl,
          day_change: holding.daychange,
          day_change_percentage: holding.daychangepercentage,
          current_value: holding.quantity * holding.ltp,
          invested_value: holding.quantity * holding.averageprice,
          exchange: holding.exchange,
          product: holding.producttype,
          symboltoken: holding.symboltoken
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne portfolio: ${error.message}`);
    }
  }

  async getPositions() {
    this._ensureAuthenticated();
    
    try {
      const positions = await this._makeAngelOneAPICall('GET', '/rest/secure/angelbroking/order/v1/getPosition');
      
      return {
        broker: 'AngelOne',
        data: positions
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne positions: ${error.message}`);
    }
  }

  async createOrder(params) {
    this._ensureAuthenticated();
    
    try {
      // Validate required parameters
      this._validateOrderParams(params);
      
      // Build order data exactly as per AngelOne documentation
      const orderData = {
        variety: params.variety || this._determineOrderVariety(params),
        tradingsymbol: (params.trading_symbol || params.symbol).toUpperCase(),
        symboltoken: this._validateSymbolToken(params.symboltoken || params.symbol_token),
        transactiontype: params.transaction_type.toUpperCase(),
        exchange: params.exchange.toUpperCase(),
        ordertype: params.order_type.toUpperCase(),
        producttype: this._mapProductType(params.product),
        duration: params.validity?.toUpperCase() || params.duration?.toUpperCase() || "DAY",
        price: this._getOrderPrice(params),
        squareoff: params.squareoff?.toString() || "0",
        stoploss: params.stoploss?.toString() || "0",
        quantity: params.quantity.toString()
      };

      // Add optional disclosed quantity
      if (params.disclosed_quantity) {
        orderData.disclosedquantity = params.disclosed_quantity.toString();
      }

      // Add trigger price for STOPLOSS orders
      if (params.order_type.toUpperCase().includes('STOPLOSS') && params.trigger_price) {
        orderData.triggerprice = params.trigger_price.toString();
      }
      
      const result = await this._makeAngelOneAPICall('POST', '/rest/secure/angelbroking/order/v1/placeOrder', orderData);
      
      return {
        broker: 'AngelOne',
        order_id: result.orderid,
        unique_order_id: result.uniqueorderid,
        status: 'success',
        data: orderData
      };
    } catch (error) {
      throw new Error(`Failed to create AngelOne order: ${error.message}`);
    }
  }

  async getOrders() {
    this._ensureAuthenticated();
    
    try {
      const orders = await this._makeAngelOneAPICall('GET', '/rest/secure/angelbroking/order/v1/getOrderBook');
      
      return {
        broker: 'AngelOne',
        data: orders
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne orders: ${error.message}`);
    }
  }

  async getQuote(symbolData) {
    this._ensureAuthenticated();
    
    try {
      // AngelOne getLtpData endpoint expects exchange, tradingsymbol, and symboltoken
      // Customer must provide an object with { exchange, tradingsymbol, symboltoken }
      
      let ltpData;
      
      if (typeof symbolData === 'object' && symbolData.tradingsymbol && symbolData.symboltoken) {
        // Customer provided complete data
        ltpData = {
          exchange: symbolData.exchange?.toUpperCase() || "NSE",
          tradingsymbol: symbolData.tradingsymbol.toUpperCase(),
          symboltoken: this._validateSymbolToken(symbolData.symboltoken)
        };
      } else {
        throw new Error('Quote data must include: { exchange, tradingsymbol, symboltoken }. Symbol token is mandatory for AngelOne API.');
      }
      
      const quotes = await this._makeAngelOneAPICall('POST', '/rest/secure/angelbroking/order/v1/getLtpData', ltpData);
      
      return {
        broker: 'AngelOne',
        data: quotes
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne quotes: ${error.message}`);
    }
  }

  async getMargins() {
    this._ensureAuthenticated();
    
    try {
      const margins = await this._makeAngelOneAPICall('GET', '/rest/secure/angelbroking/user/v1/getRMS');
      
      return {
        broker: 'AngelOne',
        data: margins
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne margins: ${error.message}`);
    }
  }

  async modifyOrder(orderId, params) {
    this._ensureAuthenticated();
    
    try {
      // Build modify order data as per AngelOne documentation
      const modifyParams = {
        variety: params.variety || "NORMAL",
        orderid: orderId,
        ordertype: params.order_type || params.ordertype,
        producttype: params.producttype || this._mapProductType(params.product),
        duration: params.duration || params.validity || "DAY",
        quantity: params.quantity ? params.quantity.toString() : undefined,
        price: params.price ? params.price.toString() : undefined
      };

      // Add optional parameters based on documentation
      if (params.tradingsymbol) modifyParams.tradingsymbol = params.tradingsymbol;
      if (params.symboltoken) modifyParams.symboltoken = params.symboltoken;
      if (params.exchange) modifyParams.exchange = params.exchange;
      if (params.trigger_price || params.triggerprice) {
        modifyParams.triggerprice = (params.trigger_price || params.triggerprice).toString();
      }

      // Remove undefined values
      Object.keys(modifyParams).forEach(key => {
        if (modifyParams[key] === undefined) {
          delete modifyParams[key];
        }
      });

      const response = await this._makeAngelOneAPICall('POST', '/rest/secure/angelbroking/order/v1/modifyOrder', modifyParams);
      
      return {
        broker: 'AngelOne',
        order_id: response.orderid,
        unique_order_id: response.uniqueorderid,
        status: 'modified',
        data: modifyParams
      };
    } catch (error) {
      throw new Error(`Failed to modify AngelOne order: ${error.message}`);
    }
  }

  async cancelOrder(orderId, variety = "NORMAL") {
    this._ensureAuthenticated();
    
    try {
      // Build cancel order data as per AngelOne documentation
      const cancelParams = {
        variety: variety,
        orderid: orderId
      };

      const response = await this._makeAngelOneAPICall('POST', '/rest/secure/angelbroking/order/v1/cancelOrder', cancelParams);
      
      return {
        broker: 'AngelOne',
        order_id: response.orderid,
        unique_order_id: response.uniqueorderid,
        status: 'cancelled',
        variety: variety
      };
    } catch (error) {
      throw new Error(`Failed to cancel AngelOne order: ${error.message}`);
    }
  }

  async getTradeBook() {
    this._ensureAuthenticated();
    
    try {
      const trades = await this._makeAngelOneAPICall('GET', '/rest/secure/angelbroking/order/v1/getTradeBook');
      
      return {
        broker: 'AngelOne',
        data: trades
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne trade book: ${error.message}`);
    }
  }

  async getOrderStatus(uniqueOrderId) {
    this._ensureAuthenticated();
    
    try {
      // Use the individual order status endpoint with uniqueorderid
      const orderStatus = await this._makeAngelOneAPICall('GET', `/rest/secure/angelbroking/order/v1/details/${uniqueOrderId}`);
      
      return {
        broker: 'AngelOne',
        data: orderStatus
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne order status: ${error.message}`);
    }
  }

  async getProfile() {
    this._ensureAuthenticated();
    
    try {
      const profile = await this._makeAngelOneAPICall('GET', '/rest/secure/angelbroking/user/v1/getProfile');
      
      return {
        broker: 'AngelOne',
        data: profile
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne profile: ${error.message}`);
    }
  }

  async getCandleData(params) {
    this._ensureAuthenticated();
    
    try {
      const candleParams = {
        exchange: params.exchange || "NSE",
        symboltoken: params.symboltoken || await this._getSymbolToken(),
        interval: params.interval || "ONE_DAY",
        fromdate: params.fromdate,
        todate: params.todate
      };

      const candles = await this._makeAngelOneAPICall('POST', '/rest/secure/angelbroking/historical/v1/getCandleData', candleParams);
      
      return {
        broker: 'AngelOne',
        data: candles
      };
    } catch (error) {
      throw new Error(`Failed to get AngelOne candle data: ${error.message}`);
    }
  }

  // Helper method to validate symbol token is provided
  _validateSymbolToken(symboltoken) {
    if (!symboltoken) {
      throw new Error('Symbol token is required. Please provide the symboltoken for the trading symbol. You can get this from AngelOne symbol master or instrument list.');
    }
    return symboltoken;
  }


  // Helper method to get correct price for order
  _getOrderPrice(params) {
    const orderType = params.order_type.toUpperCase();
    
    if (orderType === 'MARKET') {
      return params.price ? params.price.toString() : "0";
    } else if (orderType === 'LIMIT') {
      if (!params.price) {
        throw new Error('Price is required for LIMIT orders');
      }
      return params.price.toString();
    } else if (orderType.includes('STOPLOSS')) {
      return params.price ? params.price.toString() : "0";
    }
    
    return params.price ? params.price.toString() : "0";
  }

  // Helper method to map TurtleStack product types to AngelOne product types
  _mapProductType(product) {
    const productMap = {
      'CNC': 'DELIVERY',
      'MIS': 'INTRADAY',
      'NRML': 'MARGIN',
      'CO': 'INTRADAY',
      'BO': 'INTRADAY'
    };
    return productMap[product.toUpperCase()] || 'DELIVERY';
  }

  // Helper method to determine order variety
  _determineOrderVariety(params) {
    // AngelOne variety constants: NORMAL, STOPLOSS, ROBO
    if (params.amo || params.variety === 'amo') {
      return 'NORMAL'; // AMO is handled by timing, variety remains NORMAL
    }
    if (params.variety === 'bo' || params.variety === 'ROBO') {
      return 'ROBO'; // Bracket orders use ROBO variety
    }
    if (params.stoploss || params.order_type === 'STOPLOSS' || params.variety === 'STOPLOSS') {
      return 'STOPLOSS';
    }
    return 'NORMAL';
  }

  // Helper method to validate order parameters
  _validateOrderParams(params) {
    const required = ['trading_symbol', 'exchange', 'transaction_type', 'order_type', 'quantity', 'product'];
    
    for (const field of required) {
      if (!params[field] && !params[field.replace('trading_symbol', 'symbol')]) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }
    
    // Validate symbol token is provided
    if (!params.symboltoken && !params.symbol_token) {
      throw new Error('Missing required parameter: symboltoken. Please provide the symbol token for the trading instrument.');
    }
    
    // Validate order type (as per AngelOne documentation)
    const validOrderTypes = ['MARKET', 'LIMIT', 'STOPLOSS_LIMIT', 'STOPLOSS_MARKET'];
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
    
    if (params.order_type.toUpperCase() === 'STOPLOSS' && !params.trigger_price) {
      throw new Error('STOPLOSS orders require a trigger_price parameter');
    }
  }

  generateLoginInstructions() {
    return {
      method: 'primary_method',
      title: 'AngelOne Authentication',
      description: 'Login with your AngelOne credentials. The system will auto-generate TOTP from your secret.',
      required_credentials: [
        'API Key',
        'Client ID', 
        'PIN/Password',
        'TOTP Secret Key'
      ],
      instructions: [
        '1. Obtain your API Key from AngelOne developer portal',
        '2. Use your Client ID (same as login ID)',
        '3. Provide your PIN/Password for login',
        '4. Enter your TOTP Secret Key (base32 format from authenticator setup)',
        '5. System will automatically generate TOTP and authenticate'
      ],
      example: {
        api_key: 'your_api_key_here',
        client_id: 'your_client_id',
        password: 'your_pin_or_password',
        totp_secret: 'your_base32_totp_secret'
      },
      alternative: {
        type: 'jwt_token',
        title: 'Quick Login (If you have JWT token)',
        description: 'Use existing JWT token for faster authentication',
        required_params: ['jwtToken', 'client_id', 'api_key'],
        example: {
          jwtToken: 'your_existing_jwt_token',
          client_id: 'your_client_id',
          api_key: 'your_api_key'
        }
      },
      notes: [
        'Primary method requires all 4 credentials for first-time login',
        'TOTP is generated automatically from your secret - no manual entry needed',
        'JWT token is returned after successful login for future quick access',
        'TOTP secret is the base32 key you received during authenticator app setup',
        'Save the JWT token for subsequent logins to avoid repeated TOTP generation'
      ]
    };
  }

  logout() {
    super.logout();
    this.clientCode = null;
    this.apiKey = null;
    this.jwtToken = null;
    this.refreshToken = null;
    this.feedToken = null;
  }

  async _getLocalIP() {
    try {
      const os = await import('os');
      const nets = os.networkInterfaces();
      
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          // Skip over non-IPv4 and internal addresses
          if (net.family === 'IPv4' && !net.internal) {
            return net.address;
          }
        }
      }
      return '192.168.1.100'; // Fallback
    } catch (error) {
      return '192.168.1.100'; // Fallback if os module not available
    }
  }

  async _getPublicIP() {
    // For now, return a placeholder. In production, you might want to fetch real public IP
    // from a service like https://api.ipify.org or similar
    return await this._getLocalIP(); // Use local IP as fallback
  }

  async _getMACAddress() {
    try {
      const os = await import('os');
      const nets = os.networkInterfaces();
      
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
            return net.mac;
          }
        }
      }
      return '02:00:00:00:00:00'; // Fallback MAC
    } catch (error) {
      return '02:00:00:00:00:00'; // Fallback if os module not available
    }
  }

  _ensureAuthenticated() {
    if (!this.isAuthenticated || !this.jwtToken || !this.clientCode) {
      throw new Error("AngelOne broker is not authenticated. Please authenticate first.");
    }
  }
}
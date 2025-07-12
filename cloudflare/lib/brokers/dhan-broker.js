// Cloudflare Worker-compatible Dhan Broker
// Basic implementation for completeness

export class WorkerDhanBroker {
  constructor() {
    this.brokerName = 'Dhan';
    this.baseURL = 'https://api.dhan.co';
    this.accessToken = null;
    this.isAuthenticated = false;
  }

  async authenticate(credentials) {
    try {
      if (credentials.access_token) {
        this.accessToken = credentials.access_token;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "Dhan access token set successfully!" 
        };
      }
      
      throw new Error("Dhan requires: access_token");
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Dhan authentication failed: ${error.message}`);
    }
  }

  getHeaders() {
    return {
      'access-token': this.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Dhan API Error: ${errorMessage}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Dhan API Error: ${error.message}`);
    }
  }

  async getPortfolio(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/holdings');
      
      return {
        broker: 'Dhan',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan portfolio: ${error.message}`);
    }
  }

  async getPositions(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/positions');
      
      return {
        broker: 'Dhan',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan positions: ${error.message}`);
    }
  }

  async createOrder(params) {
    try {
      // Basic order creation for Dhan
      const orderData = {
        dhanClientId: params.client_id,
        transactionType: params.transaction_type?.toUpperCase(),
        exchangeSegment: params.exchange?.toUpperCase(),
        productType: params.product?.toUpperCase(),
        orderType: params.order_type?.toUpperCase(),
        validity: params.validity?.toUpperCase() || 'DAY',
        securityId: params.security_id,
        quantity: parseInt(params.quantity),
        price: params.price ? parseFloat(params.price) : 0,
        triggerPrice: params.trigger_price ? parseFloat(params.trigger_price) : 0
      };

      const response = await this.makeAPICall('POST', '/orders', orderData);
      
      return {
        broker: 'Dhan',
        order_id: response.orderId,
        status: 'success',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to create Dhan order: ${error.message}`);
    }
  }

  async getOrders(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/orders');
      
      return {
        broker: 'Dhan',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan orders: ${error.message}`);
    }
  }

  async modifyOrder(orderId, params) {
    try {
      const modifyData = {
        orderId: orderId,
        orderType: params.order_type?.toUpperCase(),
        quantity: params.quantity ? parseInt(params.quantity) : undefined,
        price: params.price ? parseFloat(params.price) : undefined,
        triggerPrice: params.trigger_price ? parseFloat(params.trigger_price) : undefined,
        validity: params.validity?.toUpperCase()
      };

      // Remove undefined values
      Object.keys(modifyData).forEach(key => {
        if (modifyData[key] === undefined) {
          delete modifyData[key];
        }
      });

      const response = await this.makeAPICall('PUT', `/orders/${orderId}`, modifyData);
      
      return {
        broker: 'Dhan',
        order_id: orderId,
        status: 'modified',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to modify Dhan order: ${error.message}`);
    }
  }

  async cancelOrder(orderId, params = {}) {
    try {
      const response = await this.makeAPICall('DELETE', `/orders/${orderId}`);
      
      return {
        broker: 'Dhan',
        order_id: orderId,
        status: 'cancelled',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to cancel Dhan order: ${error.message}`);
    }
  }

  async getQuote(symbols) {
    try {
      // For Dhan, we'd need security IDs, but this is a basic implementation
      const response = await this.makeAPICall('GET', `/marketfeed/quote`, {
        symbols: Array.isArray(symbols) ? symbols : [symbols]
      });
      
      return {
        broker: 'Dhan',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan quotes: ${error.message}`);
    }
  }

  async getMargins(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/fundlimit');
      
      return {
        broker: 'Dhan',
        data: response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan margins: ${error.message}`);
    }
  }

  // Restore authentication state from session
  restoreAuthState(authData) {
    if (authData && authData.credentials) {
      this.accessToken = authData.credentials.access_token;
      this.isAuthenticated = true;
    }
  }

  _ensureAuthenticated() {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error("Dhan broker is not authenticated. Please authenticate first.");
    }
  }

  logout() {
    this.accessToken = null;
    this.isAuthenticated = false;
  }
}
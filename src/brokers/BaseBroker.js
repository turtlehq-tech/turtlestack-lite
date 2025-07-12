// src/brokers/BaseBroker.js
// Base Broker Interface - All brokers must implement these methods

export class BaseBroker {
  constructor(name) {
    this.name = name;
    this.isAuthenticated = false;
  }

  /**
   * Authenticate with the broker
   * @param {Object} credentials - Broker-specific credentials
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(credentials) {
    throw new Error(`authenticate() must be implemented by ${this.name}`);
  }

  /**
   * Get portfolio holdings
   * @param {Object} params - Optional parameters
   * @returns {Promise<Object>} Portfolio data
   */
  async getPortfolio(params = {}) {
    throw new Error(`getPortfolio() must be implemented by ${this.name}`);
  }

  /**
   * Get current positions
   * @param {Object} params - Optional parameters
   * @returns {Promise<Object>} Positions data
   */
  async getPositions(params = {}) {
    throw new Error(`getPositions() must be implemented by ${this.name}`);
  }

  /**
   * Create a new order
   * @param {Object} params - Order parameters
   * @returns {Promise<Object>} Order creation result
   */
  async createOrder(params) {
    throw new Error(`createOrder() must be implemented by ${this.name}`);
  }

  /**
   * Get order history
   * @param {Object} params - Optional parameters
   * @returns {Promise<Object>} Orders data
   */
  async getOrders(params = {}) {
    throw new Error(`getOrders() must be implemented by ${this.name}`);
  }

  /**
   * Get live quotes
   * @param {Array} symbols - Array of trading symbols
   * @returns {Promise<Object>} Quote data
   */
  async getQuote(symbols) {
    throw new Error(`getQuote() must be implemented by ${this.name}`);
  }

  /**
   * Get account margins
   * @returns {Promise<Object>} Margins data
   */
  async getMargins() {
    throw new Error(`getMargins() must be implemented by ${this.name}`);
  }

  /**
   * Logout and clear authentication
   */
  logout() {
    this.isAuthenticated = false;
  }

  /**
   * Check if broker is authenticated
   * @returns {boolean} Authentication status
   */
  isReady() {
    return this.isAuthenticated;
  }
}
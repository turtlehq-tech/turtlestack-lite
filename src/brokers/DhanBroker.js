// src/brokers/DhanBroker.js
import axios from 'axios';
import { BaseBroker } from './BaseBroker.js';
import { TechnicalIndicators } from '../utils/technicalIndicators.js';

export class DhanBroker extends BaseBroker {
  constructor() {
    super('Dhan');
    this.baseURL = 'https://api.dhan.co/v2';
    this.accessToken = null;
    this.clientId = null;
  }

  async authenticate(credentials) {
    try {
      if (credentials.access_token && credentials.client_id) {
        this.accessToken = credentials.access_token;
        this.clientId = credentials.client_id;
        this.isAuthenticated = true;
        
        return { 
          success: true, 
          message: "Dhan authentication successful!" 
        };
      }
      
      throw new Error("Dhan requires: access_token and client_id");
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Dhan authentication failed: ${error.message}`);
    }
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'access-token': this.accessToken
    };
  }

  async makeAPICall(method, endpoint, data = null) {
    this._ensureAuthenticated();

    try {
      const config = {
        method: method,
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders()
      };

      if (data) config.data = data;

      const response = await axios(config);
      
      if (response.data.status === 'failure') {
        throw new Error(`Dhan API Error: ${response.data.remarks || 'Unknown error'}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Dhan API Error: ${error.response.status} - ${error.response.data?.remarks || error.message}`);
      }
      throw new Error(`Dhan API Error: ${error.message}`);
    }
  }

  async getPortfolio(params = {}) {
    try {
      const response = await this.makeAPICall('GET', '/holdings');
      
      return {
        broker: 'Dhan',
        data: response.data || response
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
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan positions: ${error.message}`);
    }
  }

  async createOrder(params) {
    try {
      const orderPayload = {
        dhanClientId: this.clientId,
        transactionType: params.transaction_type.toUpperCase(),
        exchangeSegment: this._mapExchange(params.exchange),
        productType: this._mapProduct(params.product),
        orderType: params.order_type.toUpperCase(),
        validity: params.validity?.toUpperCase() || "DAY",
        securityId: params.security_id || params.trading_symbol,
        quantity: params.quantity.toString(),
        disclosedQuantity: "",
        price: params.price ? params.price.toString() : "",
        triggerPrice: params.trigger_price ? params.trigger_price.toString() : "",
        afterMarketOrder: false
      };

      const response = await this.makeAPICall('POST', '/orders', orderPayload);
      
      return {
        broker: 'Dhan',
        order_id: response.data?.orderId || response.orderId,
        status: 'success',
        data: orderPayload
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
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan orders: ${error.message}`);
    }
  }

  async getOrderDetail(orderId) {
    try {
      const response = await this.makeAPICall('GET', `/orders/${orderId}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan order detail: ${error.message}`);
    }
  }

  async getQuote(symbols) {
    try {
      // Note: Dhan might require security IDs instead of symbols
      // This is a placeholder implementation
      const response = await this.makeAPICall('GET', '/marketfeed/quote', {
        symbols: symbols
      });
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan quotes: ${error.message}`);
    }
  }

  async getMargins() {
    try {
      const response = await this.makeAPICall('GET', '/margins');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan margins: ${error.message}`);
    }
  }

  async getFundBalance() {
    try {
      const response = await this.makeAPICall('GET', '/fundlimit');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan fund balance: ${error.message}`);
    }
  }

  async convertPosition(params) {
    try {
      const conversionPayload = {
        dhanClientId: this.clientId,
        fromProductType: params.from_product,
        toProductType: params.to_product,
        exchangeSegment: this._mapExchange(params.exchange),
        positionType: params.position_type,
        securityId: params.security_id,
        convertQty: params.quantity.toString(),
        transactionType: params.transaction_type.toUpperCase()
      };

      const response = await this.makeAPICall('POST', '/positions/convert', conversionPayload);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to convert Dhan position: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await this.makeAPICall('DELETE', `/orders/${orderId}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to cancel Dhan order: ${error.message}`);
    }
  }

  async modifyOrder(orderId, params) {
    try {
      const modifyPayload = {
        dhanClientId: this.clientId,
        orderId: orderId,
        orderType: params.order_type?.toUpperCase(),
        legName: "NEW_LEG",
        quantity: params.quantity?.toString(),
        price: params.price?.toString(),
        triggerPrice: params.trigger_price?.toString(),
        disclosedQuantity: "",
        validity: params.validity?.toUpperCase() || "DAY"
      };

      const response = await this.makeAPICall('PUT', `/orders/${orderId}`, modifyPayload);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to modify Dhan order: ${error.message}`);
    }
  }

  async getInstruments(exchangeSegment = 'NSE_EQ') {
    try {
      const response = await this.makeAPICall('GET', `/instruments/${exchangeSegment}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan instruments: ${error.message}`);
    }
  }

  async searchInstruments(query) {
    try {
      const params = new URLSearchParams({
        query: query
      });
      
      const response = await this.makeAPICall('GET', `/instruments/search?${params.toString()}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to search Dhan instruments: ${error.message}`);
    }
  }

  async getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate) {
    try {
      const params = new URLSearchParams({
        securityId: securityId,
        exchangeSegment: exchangeSegment,
        interval: interval,
        fromDate: fromDate,
        toDate: toDate
      });
      
      const response = await this.makeAPICall('GET', `/historical/data?${params.toString()}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan historical data: ${error.message}`);
    }
  }

  async getLiveFeed(instruments) {
    try {
      const feedData = {
        dhanClientId: this.clientId,
        instruments: instruments
      };

      const response = await this.makeAPICall('POST', '/marketfeed/ltp', feedData);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan live feed: ${error.message}`);
    }
  }

  async getOrderBook() {
    try {
      const response = await this.makeAPICall('GET', '/orderbook');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan order book: ${error.message}`);
    }
  }

  async getTradeBook() {
    try {
      const response = await this.makeAPICall('GET', '/tradebook');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan trade book: ${error.message}`);
    }
  }

  async getSecurityInfo(securityId, exchangeSegment) {
    try {
      const params = new URLSearchParams({
        securityId: securityId,
        exchangeSegment: exchangeSegment
      });
      
      const response = await this.makeAPICall('GET', `/security/info?${params.toString()}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan security info: ${error.message}`);
    }
  }

  async getDematHoldings() {
    try {
      const response = await this.makeAPICall('GET', '/holdings/demat');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan demat holdings: ${error.message}`);
    }
  }

  async getKillSwitch() {
    try {
      const response = await this.makeAPICall('GET', '/killswitch');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan kill switch status: ${error.message}`);
    }
  }

  async toggleKillSwitch(action) {
    try {
      const payload = {
        dhanClientId: this.clientId,
        action: action.toUpperCase() // 'ACTIVATE' or 'DEACTIVATE'
      };

      const response = await this.makeAPICall('POST', '/killswitch', payload);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to toggle Dhan kill switch: ${error.message}`);
    }
  }

  async getExchangeStatus() {
    try {
      const response = await this.makeAPICall('GET', '/exchange/status');
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan exchange status: ${error.message}`);
    }
  }

  async getOptionChain(securityId, exchangeSegment, expiryCode) {
    try {
      const params = new URLSearchParams({
        securityId: securityId,
        exchangeSegment: exchangeSegment,
        expiryCode: expiryCode
      });
      
      const response = await this.makeAPICall('GET', `/optionchain?${params.toString()}`);
      
      return {
        broker: 'Dhan',
        data: response.data || response
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan option chain: ${error.message}`);
    }
  }

  async placeBracketOrder(params) {
    try {
      const bracketOrderPayload = {
        dhanClientId: this.clientId,
        transactionType: params.transaction_type.toUpperCase(),
        exchangeSegment: this._mapExchange(params.exchange),
        productType: 'BO',
        orderType: params.order_type.toUpperCase(),
        validity: 'DAY',
        securityId: params.security_id,
        quantity: params.quantity.toString(),
        price: params.price?.toString() || "",
        stopLoss: params.stop_loss.toString(),
        target: params.target.toString(),
        trailingStopLoss: params.trailing_stop_loss?.toString() || ""
      };

      const response = await this.makeAPICall('POST', '/orders/bracket', bracketOrderPayload);
      
      return {
        broker: 'Dhan',
        order_id: response.data?.orderId || response.orderId,
        status: 'success',
        data: bracketOrderPayload
      };
    } catch (error) {
      throw new Error(`Failed to place Dhan bracket order: ${error.message}`);
    }
  }

  async placeCoverOrder(params) {
    try {
      const coverOrderPayload = {
        dhanClientId: this.clientId,
        transactionType: params.transaction_type.toUpperCase(),
        exchangeSegment: this._mapExchange(params.exchange),
        productType: 'CO',
        orderType: 'MARKET',
        validity: 'DAY',
        securityId: params.security_id,
        quantity: params.quantity.toString(),
        triggerPrice: params.trigger_price.toString()
      };

      const response = await this.makeAPICall('POST', '/orders/cover', coverOrderPayload);
      
      return {
        broker: 'Dhan',
        order_id: response.data?.orderId || response.orderId,
        status: 'success',
        data: coverOrderPayload
      };
    } catch (error) {
      throw new Error(`Failed to place Dhan cover order: ${error.message}`);
    }
  }

  async getTechnicalIndicators(securityId, exchangeSegment, interval, fromDate, toDate, indicators = ['RSI', 'MACD', 'BOLLINGER']) {
    this._ensureAuthenticated();
    
    try {
      // Get historical data first
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for technical analysis');
      }
      
      // Calculate technical indicators
      const technicalData = TechnicalIndicators.processHistoricalData(historicalData.data, indicators);
      
      return {
        broker: 'Dhan',
        data: {
          historical: historicalData.data,
          indicators: technicalData,
          period: { from: fromDate, to: toDate },
          interval: interval,
          securityId: securityId
        }
      };
    } catch (error) {
      throw new Error(`Failed to get Dhan technical indicators: ${error.message}`);
    }
  }

  async getRSI(securityId, exchangeSegment, interval, fromDate, toDate, period = 14) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for RSI calculation');
      }
      
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const rsi = TechnicalIndicators.calculateRSI(closes, period);
      
      return {
        broker: 'Dhan',
        indicator: 'RSI',
        period: period,
        securityId: securityId,
        data: rsi
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan RSI: ${error.message}`);
    }
  }

  async getMACD(securityId, exchangeSegment, interval, fromDate, toDate, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for MACD calculation');
      }
      
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const macd = TechnicalIndicators.calculateMACD(closes, fastPeriod, slowPeriod, signalPeriod);
      
      return {
        broker: 'Dhan',
        indicator: 'MACD',
        parameters: { fastPeriod, slowPeriod, signalPeriod },
        securityId: securityId,
        data: macd
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan MACD: ${error.message}`);
    }
  }

  async getBollingerBands(securityId, exchangeSegment, interval, fromDate, toDate, period = 20, standardDeviations = 2) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for Bollinger Bands calculation');
      }
      
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const bollinger = TechnicalIndicators.calculateBollingerBands(closes, period, standardDeviations);
      
      return {
        broker: 'Dhan',
        indicator: 'Bollinger Bands',
        parameters: { period, standardDeviations },
        securityId: securityId,
        data: bollinger
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan Bollinger Bands: ${error.message}`);
    }
  }

  async getVWAP(securityId, exchangeSegment, interval, fromDate, toDate) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for VWAP calculation');
      }
      
      const vwap = TechnicalIndicators.calculateVWAP(historicalData.data);
      
      return {
        broker: 'Dhan',
        indicator: 'VWAP',
        securityId: securityId,
        data: vwap
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan VWAP: ${error.message}`);
    }
  }

  async getATR(securityId, exchangeSegment, interval, fromDate, toDate, period = 14) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for ATR calculation');
      }
      
      const highs = historicalData.data.map(candle => candle.high || candle.h);
      const lows = historicalData.data.map(candle => candle.low || candle.l);
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const atr = TechnicalIndicators.calculateATR(highs, lows, closes, period);
      
      return {
        broker: 'Dhan',
        indicator: 'ATR',
        period: period,
        securityId: securityId,
        data: atr
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan ATR: ${error.message}`);
    }
  }

  async getADX(securityId, exchangeSegment, interval, fromDate, toDate, period = 14) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for ADX calculation');
      }
      
      const highs = historicalData.data.map(candle => candle.high || candle.h);
      const lows = historicalData.data.map(candle => candle.low || candle.l);
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const adx = TechnicalIndicators.calculateADX(highs, lows, closes, period);
      
      return {
        broker: 'Dhan',
        indicator: 'ADX',
        period: period,
        securityId: securityId,
        data: adx
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan ADX: ${error.message}`);
    }
  }

  async getParabolicSAR(securityId, exchangeSegment, interval, fromDate, toDate, acceleration = 0.02, maximum = 0.2) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for Parabolic SAR calculation');
      }
      
      const highs = historicalData.data.map(candle => candle.high || candle.h);
      const lows = historicalData.data.map(candle => candle.low || candle.l);
      const sar = TechnicalIndicators.calculateParabolicSAR(highs, lows, acceleration, maximum);
      
      return {
        broker: 'Dhan',
        indicator: 'Parabolic SAR',
        parameters: { acceleration, maximum },
        securityId: securityId,
        data: sar
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan Parabolic SAR: ${error.message}`);
    }
  }

  async getOBV(securityId, exchangeSegment, interval, fromDate, toDate) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for OBV calculation');
      }
      
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const volumes = historicalData.data.map(candle => candle.volume || candle.v || 0);
      const obv = TechnicalIndicators.calculateOBV(closes, volumes);
      
      return {
        broker: 'Dhan',
        indicator: 'OBV',
        securityId: securityId,
        data: obv
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan OBV: ${error.message}`);
    }
  }

  async getMFI(securityId, exchangeSegment, interval, fromDate, toDate, period = 14) {
    this._ensureAuthenticated();
    
    try {
      const historicalData = await this.getHistoricalData(securityId, exchangeSegment, interval, fromDate, toDate);
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available for MFI calculation');
      }
      
      const highs = historicalData.data.map(candle => candle.high || candle.h);
      const lows = historicalData.data.map(candle => candle.low || candle.l);
      const closes = historicalData.data.map(candle => candle.close || candle.c);
      const volumes = historicalData.data.map(candle => candle.volume || candle.v || 0);
      const mfi = TechnicalIndicators.calculateMFI(highs, lows, closes, volumes, period);
      
      return {
        broker: 'Dhan',
        indicator: 'MFI',
        period: period,
        securityId: securityId,
        data: mfi
      };
    } catch (error) {
      throw new Error(`Failed to calculate Dhan MFI: ${error.message}`);
    }
  }

  // Helper methods to map parameters
  _mapExchange(exchange) {
    const exchangeMap = {
      'NSE': 'NSE_EQ',
      'BSE': 'BSE_EQ',
      'NFO': 'NSE_FNO',
      'BFO': 'BSE_FNO',
      'MCX': 'MCX_COMM'
    };
    return exchangeMap[exchange.toUpperCase()] || 'NSE_EQ';
  }

  _mapProduct(product) {
    const productMap = {
      'CNC': 'CNC',
      'MIS': 'INTRADAY',
      'NRML': 'MARGIN',
      'CO': 'CO',
      'BO': 'BO'
    };
    return productMap[product.toUpperCase()] || 'CNC';
  }

  logout() {
    super.logout();
    this.accessToken = null;
    this.clientId = null;
  }

  _ensureAuthenticated() {
    if (!this.isAuthenticated || !this.accessToken || !this.clientId) {
      throw new Error("Dhan broker is not authenticated. Please authenticate first.");
    }
  }
}
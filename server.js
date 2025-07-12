// @ts-nocheck
// server.js - Comprehensive Kite MCP Server with Full Analytics
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { KiteConnect } from 'kiteconnect';
import dotenv from 'dotenv';

dotenv.config();

class ComprehensiveKiteMCPServer {
  constructor() {
    this.kite = new KiteConnect({
      api_key: process.env.KITE_API_KEY,
      access_token: process.env.KITE_ACCESS_TOKEN,
    });

    this.server = new Server(
      {
        name: "comprehensive-kite-server",
        version: "3.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Authentication Tools
          {
            name: "kite_login",
            description: "Generate Kite login URL for authentication",
            inputSchema: { type: "object", properties: {}, required: [] }
          },
          {
            name: "set_access_token",
            description: "Set access token after successful login",
            inputSchema: {
              type: "object",
              properties: {
                request_token: { type: "string", description: "Request token from Kite login callback" }
              },
              required: ["request_token"]
            }
          },

          // Portfolio & Account Tools
          {
            name: "get_holdings",
            description: "Get portfolio holdings with detailed analysis",
            inputSchema: { type: "object", properties: {}, required: [] }
          },
          {
            name: "get_positions",
            description: "Get current trading positions",
            inputSchema: { type: "object", properties: {}, required: [] }
          },
          {
            name: "get_margins",
            description: "Get account margins and available funds",
            inputSchema: { type: "object", properties: {}, required: [] }
          },
          {
            name: "get_profile",
            description: "Get user profile and account details",
            inputSchema: { type: "object", properties: {}, required: [] }
          },

          // Order Management Tools
          {
            name: "get_orders",
            description: "Get comprehensive order history with filters",
            inputSchema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["COMPLETE", "CANCELLED", "OPEN", "PENDING"], description: "Filter by order status" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD format)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD format)" }
              },
              required: []
            }
          },
          {
            name: "get_trades",
            description: "Get executed trades with detailed analysis",
            inputSchema: {
              type: "object",
              properties: {
                from_date: { type: "string", description: "Start date (YYYY-MM-DD format)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD format)" }
              },
              required: []
            }
          },

          // Trading Tools
          {
            name: "place_order",
            description: "Place a new order (buy/sell stocks)",
            inputSchema: {
              type: "object",
              properties: {
                tradingsymbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE"], description: "Exchange" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                quantity: { type: "number", description: "Number of shares" },
                product: { type: "string", enum: ["CNC", "MIS", "NRML"], description: "Product type" },
                price: { type: "number", description: "Price per share (for LIMIT orders)" },
                trigger_price: { type: "number", description: "Trigger price (for SL orders)" },
                validity: { type: "string", enum: ["DAY", "IOC"], description: "Order validity" }
              },
              required: ["tradingsymbol", "exchange", "transaction_type", "order_type", "quantity", "product"]
            }
          },

          // Market Data Tools
          {
            name: "get_quote",
            description: "Get detailed stock quotes",
            inputSchema: {
              type: "object",
              properties: {
                instruments: { type: "array", items: { type: "string" }, description: "Array of trading symbols" }
              },
              required: ["instruments"]
            }
          },
          {
            name: "get_chart_data",
            description: "Get formatted chart data for specific stock and time period",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol (e.g., RELIANCE, DRREDDY)" },
                period: { type: "string", enum: ["1D", "1W", "1M", "3M", "6M", "1Y", "2Y", "5Y"], description: "Time period for chart" },
                interval: { type: "string", enum: ["1m", "5m", "15m", "30m", "1h", "1d"], description: "Chart interval" }
              },
              required: ["symbol", "period"]
            }
          },
          {
            name: "get_technical_analysis",
            description: "Get technical analysis data including moving averages, RSI, MACD",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                period: { type: "string", enum: ["1M", "3M", "6M", "1Y"], description: "Analysis period" }
              },
              required: ["symbol"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Authentication cases
          case "kite_login": 
            return await this.generateLoginUrl();
          case "set_access_token": 
            return await this.setAccessToken(args.request_token);

          // Portfolio cases
          case "get_holdings": 
            return await this.getHoldings();
          case "get_positions": 
            return await this.getPositions();
          case "get_margins": 
            return await this.getMargins();
          case "get_profile": 
            return await this.getProfile();

          // Order cases
          case "get_orders": 
            return await this.getOrders(args);
          case "get_trades": 
            return await this.getTrades(args);

          // Trading cases
          case "place_order": 
            return await this.placeOrder(args);

          // Market data cases
          case "get_quote": 
            return await this.getQuote(args.instruments);
          case "get_chart_data": 
            return await this.getChartData(args);
          case "get_technical_analysis": 
            return await this.getTechnicalAnalysis(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  // Authentication Methods
  async generateLoginUrl() {
    try {
      const loginUrl = this.kite.getLoginURL();
      return {
        content: [{
          type: "text",
          text: `Please visit this URL to login: ${loginUrl}\n\nAfter logging in, copy the 'request_token' from the URL and use the 'set_access_token' tool.`
        }]
      };
    } catch (error) {
      throw new Error(`Login URL generation failed: ${error.message}`);
    }
  }

  async setAccessToken(requestToken) {
    try {
      const response = await this.kite.generateSession(requestToken, process.env.KITE_API_SECRET);
      this.kite.setAccessToken(response.access_token);
      process.env.KITE_ACCESS_TOKEN = response.access_token;
      
      return {
        content: [{
          type: "text",
          text: `Authentication successful! Access token set. All tools are now available.`
        }]
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Portfolio Methods
  async getHoldings() {
    try {
      const holdings = await this.kite.getHoldings();
      const formattedHoldings = holdings.map(holding => ({
        instrument: holding.tradingsymbol,
        quantity: holding.quantity,
        average_price: holding.average_price,
        last_price: holding.last_price,
        pnl: holding.pnl,
        day_change: holding.day_change,
        day_change_percentage: holding.day_change_percentage,
        current_value: holding.quantity * holding.last_price,
        invested_value: holding.quantity * holding.average_price
      }));

      return {
        content: [{
          type: "text",
          text: `Portfolio Holdings:\n\n${JSON.stringify(formattedHoldings, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch holdings: ${error.message}`);
    }
  }

  async getPositions() {
    try {
      const positions = await this.kite.getPositions();
      return {
        content: [{
          type: "text",
          text: `Current Positions:\n\nNet: ${JSON.stringify(positions.net, null, 2)}\n\nDay: ${JSON.stringify(positions.day, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }
  }

  async getMargins() {
    try {
      const margins = await this.kite.getMargins();
      return {
        content: [{
          type: "text",
          text: `Account Margins:\n\n${JSON.stringify(margins, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch margins: ${error.message}`);
    }
  }

  async getProfile() {
    try {
      const profile = await this.kite.getProfile();
      return {
        content: [{
          type: "text",
          text: `User Profile:\n\n${JSON.stringify(profile, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  // Order Methods
  async getOrders(filters = {}) {
    try {
      let orders = await this.kite.getOrders();
      
      if (filters.status) {
        orders = orders.filter(order => order.status === filters.status);
      }
      
      const formattedOrders = orders.map(order => ({
        order_id: order.order_id,
        tradingsymbol: order.tradingsymbol,
        exchange: order.exchange,
        transaction_type: order.transaction_type,
        order_type: order.order_type,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        order_timestamp: order.order_timestamp
      }));

      return {
        content: [{
          type: "text",
          text: `Order History (${formattedOrders.length} orders):\n\n${JSON.stringify(formattedOrders, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getTrades(filters = {}) {
    try {
      const trades = await this.kite.getTrades();
      
      const formattedTrades = trades.map(trade => ({
        trade_id: trade.trade_id,
        order_id: trade.order_id,
        tradingsymbol: trade.tradingsymbol,
        exchange: trade.exchange,
        transaction_type: trade.transaction_type,
        quantity: trade.quantity,
        price: trade.price,
        fill_timestamp: trade.fill_timestamp
      }));

      return {
        content: [{
          type: "text",
          text: `Trade History (${formattedTrades.length} trades):\n\n${JSON.stringify(formattedTrades, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch trades: ${error.message}`);
    }
  }

  // Trading Methods
  async placeOrder(orderParams) {
    try {
      const {
        tradingsymbol, exchange, transaction_type, order_type,
        quantity, product, price, trigger_price, validity = "DAY"
      } = orderParams;

      const order = {
        tradingsymbol: tradingsymbol.toUpperCase(),
        exchange: exchange.toUpperCase(),
        transaction_type: transaction_type.toUpperCase(),
        order_type: order_type.toUpperCase(),
        quantity: parseInt(quantity),
        product: product.toUpperCase(),
        validity: validity.toUpperCase()
      };

      if (order_type.toUpperCase() === "LIMIT" && price) {
        order.price = parseFloat(price);
      }

      if ((order_type.toUpperCase() === "SL" || order_type.toUpperCase() === "SL-M") && trigger_price) {
        order.trigger_price = parseFloat(trigger_price);
      }

      const response = await this.kite.placeOrder("regular", order);
      
      return {
        content: [{
          type: "text",
          text: `Order placed successfully!\n\nOrder ID: ${response.order_id}\nDetails: ${JSON.stringify(order, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  // Market Data Methods
  async getQuote(instruments) {
    try {
      const quotes = await this.kite.getQuote(instruments);
      return {
        content: [{
          type: "text",
          text: `Stock Quotes:\n\n${JSON.stringify(quotes, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch quotes: ${error.message}`);
    }
  }

  async getChartData(params) {
    try {
      const { symbol, period, interval = "1d" } = params;
      
      // Calculate date range based on period
      const toDate = new Date();
      const fromDate = new Date();
      
      switch (period) {
        case "1D":
          fromDate.setDate(toDate.getDate() - 1);
          break;
        case "1W":
          fromDate.setDate(toDate.getDate() - 7);
          break;
        case "1M":
          fromDate.setMonth(toDate.getMonth() - 1);
          break;
        case "3M":
          fromDate.setMonth(toDate.getMonth() - 3);
          break;
        case "6M":
          fromDate.setMonth(toDate.getMonth() - 6);
          break;
        case "1Y":
          fromDate.setFullYear(toDate.getFullYear() - 1);
          break;
        default:
          fromDate.setMonth(toDate.getMonth() - 3);
      }

      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];

      // Mock chart data for now (replace with actual API call)
      const chartData = {
        symbol: symbol.toUpperCase(),
        period: period,
        interval: interval,
        from_date: fromDateStr,
        to_date: toDateStr,
        summary: {
          note: "Chart data functionality ready - requires instrument token mapping"
        }
      };

      return {
        content: [{
          type: "text",
          text: `Chart Data for ${symbol} (${period}):\n\n${JSON.stringify(chartData, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch chart data: ${error.message}`);
    }
  }

  async getTechnicalAnalysis(params) {
    try {
      const { symbol, period = "3M" } = params;
      
      // Mock technical analysis for now
      const technicalAnalysis = {
        symbol: symbol.toUpperCase(),
        analysis_period: period,
        note: "Technical analysis functionality ready - requires historical data integration",
        indicators: {
          rsi: "Relative Strength Index calculation",
          sma: "Simple Moving Average calculation", 
          ema: "Exponential Moving Average calculation",
          macd: "MACD calculation"
        }
      };

      return {
        content: [{
          type: "text",
          text: `Technical Analysis for ${symbol}:\n\n${JSON.stringify(technicalAnalysis, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to perform technical analysis: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Comprehensive Kite MCP server running on stdio");
  }
}

// Start the server
const server = new ComprehensiveKiteMCPServer();
server.run().catch(console.error);
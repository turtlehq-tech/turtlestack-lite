// src/server/TurtleStack.js
// TurtleStack - Multi-Broker Trading MCP Server with Session-Aware Architecture
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SessionManager } from '../utils/SessionManager.js';
import { Logger } from '../utils/logger.js';
import { DataFormatter } from '../utils/formatters.js';

export class TurtleStack {
  constructor() {
    // Initialize session manager for multi-user support
    this.sessionManager = new SessionManager();

    this.server = new Server(
      {
        name: "turtle-stack",
        version: "2.1.0", // Updated version for multi-user support
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    Logger.info("TurtleStack initialized with multi-user support");
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Broker Management
          {
            name: "list_brokers",
            description: "List all available brokers and their authentication status for your session",
            inputSchema: { type: "object", properties: {}, required: [] }
          },
          {
            name: "set_active_broker", 
            description: "Set the active broker for trading operations in your session",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Broker name" }
              },
              required: ["broker"]
            }
          },
          {
            name: "authenticate_broker",
            description: "Authenticate with a specific broker using credentials (session-isolated)",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Broker name" },
                access_token: { type: "string", description: "Access token" },
                request_token: { type: "string", description: "Request token (for Kite)" },
                api_key: { type: "string", description: "API key (required for Kite)" },
                api_secret: { type: "string", description: "API secret (required for Kite with request_token)" },
                client_code: { type: "string", description: "Client code (for AngelOne)" },
                client_id: { type: "string", description: "Client ID (for AngelOne and Dhan)" },
                password: { type: "string", description: "PIN/Password (for AngelOne)" },
                totp_secret: { type: "string", description: "TOTP Secret Key (for AngelOne, automated TOTP generation)" },
                jwtToken: { type: "string", description: "JWT Token (for AngelOne, recommended for repeat logins)" },
                refreshToken: { type: "string", description: "Refresh Token (for AngelOne, optional)" },
                feedToken: { type: "string", description: "Feed Token (for AngelOne, optional)" }
              },
              required: ["broker"]
            }
          },
          {
            name: "logout_broker",
            description: "Logout from a specific broker or all brokers in your session",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone", "all"], description: "Broker name or 'all'" }
              },
              required: []
            }
          },
          {
            name: "get_broker_login_instructions",
            description: "Get detailed login instructions for a specific broker",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Broker name" }
              },
              required: ["broker"]
            }
          },
          {
            name: "get_session_info",
            description: "Get information about your current session",
            inputSchema: { type: "object", properties: {}, required: [] }
          },

          // Portfolio & Account
          {
            name: "get_portfolio",
            description: "Get portfolio holdings from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" }
              },
              required: []
            }
          },
          {
            name: "get_positions",
            description: "Get current trading positions from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" }
              },
              required: []
            }
          },
          {
            name: "get_margins",
            description: "Get account margins from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                segment: { type: "string", enum: ["equity", "commodity"], description: "Specific segment for Kite broker (optional)" }
              },
              required: []
            }
          },
          {
            name: "calculate_kite_order_margins",
            description: "Calculate required margins for Kite orders",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite"], description: "Must be kite for order margin calculation" },
                orders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "CDS", "MCX"], description: "Exchange" },
                      tradingsymbol: { type: "string", description: "Trading symbol" },
                      transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                      variety: { type: "string", enum: ["regular", "amo", "co", "bo", "iceberg"], description: "Order variety" },
                      product: { type: "string", enum: ["CNC", "MIS", "NRML", "CO", "BO"], description: "Product type" },
                      order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                      quantity: { type: "number", description: "Quantity" },
                      price: { type: "number", description: "Price (optional)" },
                      trigger_price: { type: "number", description: "Trigger price (optional)" }
                    },
                    required: ["exchange", "tradingsymbol", "transaction_type", "variety", "product", "order_type", "quantity"]
                  },
                  description: "Array of order objects"
                }
              },
              required: ["orders"]
            }
          },
          {
            name: "calculate_kite_basket_margins",
            description: "Calculate basket margins for spread orders on Kite",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite"], description: "Must be kite for basket margin calculation" },
                orders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "CDS", "MCX"], description: "Exchange" },
                      tradingsymbol: { type: "string", description: "Trading symbol" },
                      transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                      variety: { type: "string", enum: ["regular", "amo", "co", "bo", "iceberg"], description: "Order variety" },
                      product: { type: "string", enum: ["CNC", "MIS", "NRML", "CO", "BO"], description: "Product type" },
                      order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                      quantity: { type: "number", description: "Quantity" },
                      price: { type: "number", description: "Price (optional)" },
                      trigger_price: { type: "number", description: "Trigger price (optional)" }
                    },
                    required: ["exchange", "tradingsymbol", "transaction_type", "variety", "product", "order_type", "quantity"]
                  },
                  description: "Array of order objects for basket"
                },
                consider_positions: { type: "boolean", description: "Consider existing positions (default: true)" },
                mode: { type: "string", enum: ["compact"], description: "Calculation mode (optional)" }
              },
              required: ["orders"]
            }
          },
          {
            name: "calculate_kite_order_charges",
            description: "Get detailed charges breakdown for Kite orders",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite"], description: "Must be kite for order charges calculation" },
                orders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "CDS", "MCX"], description: "Exchange" },
                      tradingsymbol: { type: "string", description: "Trading symbol" },
                      transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                      variety: { type: "string", enum: ["regular", "amo", "co", "bo", "iceberg"], description: "Order variety" },
                      product: { type: "string", enum: ["CNC", "MIS", "NRML", "CO", "BO"], description: "Product type" },
                      order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                      quantity: { type: "number", description: "Quantity" },
                      price: { type: "number", description: "Price (optional)" },
                      trigger_price: { type: "number", description: "Trigger price (optional)" },
                      order_id: { type: "string", description: "Order ID (optional)" },
                      average_price: { type: "number", description: "Average price (optional)" }
                    },
                    required: ["exchange", "tradingsymbol", "transaction_type", "variety", "product", "order_type", "quantity"]
                  },
                  description: "Array of order objects for charges calculation"
                }
              },
              required: ["orders"]
            }
          },
          {
            name: "calculate_order_margin",
            description: "Calculate required margin for a specific order (Groww only)",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["groww"], description: "Must be groww for margin calculation" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "MCX"], description: "Exchange" },
                segment: { type: "string", enum: ["CASH", "FNO", "COMM", "CURRENCY"], description: "Market segment" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                quantity: { type: "number", description: "Number of shares" },
                product: { type: "string", enum: ["CNC", "MIS", "NRML"], description: "Product type" },
                price: { type: "number", description: "Price (required for LIMIT/SL orders)" },
                trigger_price: { type: "number", description: "Trigger price (required for SL/SL-M orders)" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "order_type", "quantity", "product"]
            }
          },
          {
            name: "get_margin_for_orders",
            description: "Calculate required margin for multiple orders (Groww only)",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["groww"], description: "Must be groww for bulk margin calculation" },
                orders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tradingSymbol: { type: "string", description: "Trading symbol" },
                      transactionType: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                      quantity: { type: "number", description: "Quantity" },
                      orderType: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                      productType: { type: "string", enum: ["DELIVERY", "INTRADAY", "MTF", "NORMAL"], description: "Product type" },
                      price: { type: "number", description: "Price (optional)" },
                      triggerPrice: { type: "number", description: "Trigger price (optional)" }
                    },
                    required: ["tradingSymbol", "transactionType", "quantity", "orderType", "productType"]
                  },
                  description: "Array of order objects"
                },
                segment: { type: "string", enum: ["CASH", "FNO", "COMM", "CURRENCY"], description: "Market segment (default: CASH)" }
              },
              required: ["orders"]
            }
          },

          // Trading Operations
          {
            name: "create_order",
            description: "Create a new trading order with full support for all Kite order types and varieties",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                trading_symbol: { type: "string", description: "Trading symbol (e.g., RELIANCE-EQ, INFY-EQ)" },
                symboltoken: { type: "string", description: "Symbol token (required for AngelOne, unique identifier for instrument)" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "CDS", "MCX"], description: "Exchange" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                quantity: { type: "number", description: "Number of shares" },
                product: { type: "string", enum: ["CNC", "MIS", "NRML", "CO", "BO"], description: "Product type" },
                variety: { type: "string", enum: ["regular", "amo", "co", "bo", "iceberg"], description: "Order variety (optional, auto-determined)" },
                price: { type: "number", description: "Price per share (required for LIMIT/SL orders)" },
                trigger_price: { type: "number", description: "Trigger price (required for SL/SL-M orders)" },
                stoploss: { type: "number", description: "Stop loss price (required for CO/BO orders)" },
                squareoff: { type: "number", description: "Square off price (required for BO orders)" },
                trailing_stoploss: { type: "number", description: "Trailing stop loss (optional for CO orders)" },
                disclosed_quantity: { type: "number", description: "Disclosed quantity for iceberg orders" },
                validity: { type: "string", enum: ["DAY", "IOC", "TTL"], description: "Order validity" },
                tag: { type: "string", description: "Order tag for tracking" },
                amo: { type: "boolean", description: "Place as After Market Order" },
                segment: { type: "string", enum: ["CASH", "FNO", "COMM", "CURRENCY"], description: "Market segment (required for Groww)" },
                order_reference_id: { type: "string", description: "Custom order reference ID (8-20 alphanumeric chars, max 2 hyphens, auto-generated if not provided)" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "order_type", "quantity", "product"]
            }
          },
          {
            name: "place_amo",
            description: "Place After Market Order (AMO) for next day execution",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "CDS", "MCX"], description: "Exchange" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "Order type" },
                quantity: { type: "number", description: "Number of shares" },
                product: { type: "string", enum: ["CNC", "MIS", "NRML"], description: "Product type" },
                price: { type: "number", description: "Price (required for LIMIT/SL orders)" },
                trigger_price: { type: "number", description: "Trigger price (required for SL/SL-M orders)" },
                validity: { type: "string", enum: ["DAY", "IOC"], description: "Order validity" },
                tag: { type: "string", description: "Order tag" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "order_type", "quantity", "product"]
            }
          },
          {
            name: "place_cover_order",
            description: "Place Cover Order (CO) - intraday order with compulsory stop loss",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO"], description: "Exchange" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT"], description: "Order type" },
                quantity: { type: "number", description: "Number of shares" },
                price: { type: "number", description: "Price (required for LIMIT orders)" },
                stoploss: { type: "number", description: "Stop loss price (mandatory)" },
                trailing_stoploss: { type: "number", description: "Trailing stop loss (optional)" },
                tag: { type: "string", description: "Order tag" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "order_type", "quantity", "stoploss"]
            }
          },
          {
            name: "place_bracket_order",
            description: "Place Bracket Order (BO) - order with both stop loss and target",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO"], description: "Exchange" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                quantity: { type: "number", description: "Number of shares" },
                price: { type: "number", description: "Limit price (mandatory for BO)" },
                stoploss: { type: "number", description: "Stop loss price (mandatory)" },
                squareoff: { type: "number", description: "Square off/target price (mandatory)" },
                trailing_stoploss: { type: "number", description: "Trailing stop loss (optional)" },
                tag: { type: "string", description: "Order tag" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "quantity", "price", "stoploss", "squareoff"]
            }
          },
          {
            name: "place_iceberg_order",
            description: "Place Iceberg Order - large order split into smaller disclosed quantities",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO"], description: "Exchange" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                quantity: { type: "number", description: "Total order quantity" },
                disclosed_quantity: { type: "number", description: "Quantity disclosed to market (must be less than total)" },
                price: { type: "number", description: "Limit price (mandatory for iceberg)" },
                product: { type: "string", enum: ["CNC", "MIS", "NRML"], description: "Product type" },
                validity: { type: "string", enum: ["DAY", "IOC"], description: "Order validity" },
                tag: { type: "string", description: "Order tag" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "quantity", "disclosed_quantity", "price", "product"]
            }
          },
          {
            name: "get_order_types_info",
            description: "Get information about supported order types, varieties, and their parameters",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" }
              },
              required: []
            }
          },
          {
            name: "place_groww_gtd_order",
            description: "Place Good Till Date (GTD) order on Groww - valid until specified date",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["groww"], description: "Must be groww for GTD orders" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO", "MCX"], description: "Exchange" },
                segment: { type: "string", enum: ["CASH", "FNO", "COMM", "CURRENCY"], description: "Market segment" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["LIMIT", "SL", "SL-M"], description: "Order type (GTD not available for MARKET)" },
                quantity: { type: "number", description: "Number of shares" },
                price: { type: "number", description: "Price (required for LIMIT/SL orders)" },
                trigger_price: { type: "number", description: "Trigger price (required for SL/SL-M orders)" },
                validity_date: { type: "string", description: "Date until which order is valid (YYYY-MM-DD)" },
                product: { type: "string", enum: ["CNC", "MIS", "NRML"], description: "Product type" },
                order_reference_id: { type: "string", description: "Custom order reference ID" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "order_type", "quantity", "validity_date", "product"]
            }
          },
          {
            name: "place_groww_bracket_order",
            description: "Place Bracket Order on Groww - order with stop loss and target",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["groww"], description: "Must be groww for bracket orders" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO"], description: "Exchange" },
                segment: { type: "string", enum: ["CASH", "FNO"], description: "Market segment" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                quantity: { type: "number", description: "Number of shares" },
                price: { type: "number", description: "Entry price (mandatory for bracket orders)" },
                stop_loss: { type: "number", description: "Stop loss price (mandatory)" },
                target: { type: "number", description: "Target price (mandatory)" },
                order_reference_id: { type: "string", description: "Custom order reference ID" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "quantity", "price", "stop_loss", "target"]
            }
          },
          {
            name: "place_groww_cover_order",
            description: "Place Cover Order on Groww - order with mandatory stop loss",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["groww"], description: "Must be groww for cover orders" },
                trading_symbol: { type: "string", description: "Trading symbol" },
                exchange: { type: "string", enum: ["NSE", "BSE", "NFO"], description: "Exchange" },
                segment: { type: "string", enum: ["CASH", "FNO"], description: "Market segment" },
                transaction_type: { type: "string", enum: ["BUY", "SELL"], description: "Transaction type" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT"], description: "Order type" },
                quantity: { type: "number", description: "Number of shares" },
                price: { type: "number", description: "Price (required for LIMIT orders)" },
                stop_loss: { type: "number", description: "Stop loss price (mandatory)" },
                order_reference_id: { type: "string", description: "Custom order reference ID" }
              },
              required: ["trading_symbol", "exchange", "transaction_type", "order_type", "quantity", "stop_loss"]
            }
          },
          {
            name: "get_orders",
            description: "Get order history from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" }
              },
              required: []
            }
          },
          {
            name: "modify_order",
            description: "Modify an existing order with support for all order varieties",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                order_id: { type: "string", description: "Order ID to modify" },
                variety: { type: "string", enum: ["regular", "amo", "co", "bo", "iceberg"], description: "Order variety" },
                quantity: { type: "number", description: "New quantity" },
                price: { type: "number", description: "New price" },
                order_type: { type: "string", enum: ["MARKET", "LIMIT", "SL", "SL-M"], description: "New order type" },
                trigger_price: { type: "number", description: "New trigger price" },
                disclosed_quantity: { type: "number", description: "New disclosed quantity (for iceberg)" },
                validity: { type: "string", enum: ["DAY", "IOC", "TTL"], description: "New validity" }
              },
              required: ["order_id"]
            }
          },
          {
            name: "cancel_order",
            description: "Cancel an existing order with support for all order varieties",
            inputSchema: {
              type: "object",
              properties: {
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" },
                order_id: { type: "string", description: "Order ID to cancel" },
                variety: { type: "string", enum: ["regular", "amo", "co", "bo", "iceberg"], description: "Order variety" }
              },
              required: ["order_id"]
            }
          },

          // Market Data
          {
            name: "get_quote",
            description: "Get live market quotes from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbols: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      tradingsymbol: { type: "string", description: "Trading symbol (e.g., SBIN-EQ)" },
                      symboltoken: { type: "string", description: "Symbol token (required for AngelOne)" },
                      exchange: { type: "string", description: "Exchange (default: NSE)" }
                    },
                    required: ["tradingsymbol", "symboltoken"]
                  }, 
                  description: "Array of symbol objects with trading symbol and token" 
                },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional, uses active if not specified)" }
              },
              required: ["symbols"]
            }
          },

          // Multi-Broker Operations (Session-Scoped)
          {
            name: "compare_portfolios",
            description: "Compare portfolios across multiple authenticated brokers in your session",
            inputSchema: {
              type: "object",
              properties: {
                brokers: { type: "array", items: { type: "string" }, description: "Array of broker names to compare (optional, compares all authenticated if not specified)" }
              },
              required: []
            }
          },
          {
            name: "get_consolidated_portfolio",
            description: "Get consolidated view of all holdings across all authenticated brokers in your session",
            inputSchema: {
              type: "object",
              properties: {},
              required: []
            }
          },

          // Technical Analysis Tools (Session-Scoped)
          {
            name: "get_technical_indicators",
            description: "Get multiple technical indicators for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                indicators: { type: "array", items: { type: "string" }, description: "Array of indicators (RSI, MACD, BOLLINGER, SMA, EMA, etc.)" },
                period: { type: "number", description: "Period for calculation (default: 14)" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "get_rsi",
            description: "Get RSI (Relative Strength Index) for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                period: { type: "number", description: "RSI period (default: 14)" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "get_macd",
            description: "Get MACD (Moving Average Convergence Divergence) for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                fast_period: { type: "number", description: "Fast EMA period (default: 12)" },
                slow_period: { type: "number", description: "Slow EMA period (default: 26)" },
                signal_period: { type: "number", description: "Signal line period (default: 9)" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "get_bollinger_bands",
            description: "Get Bollinger Bands for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                period: { type: "number", description: "Period (default: 20)" },
                standard_deviations: { type: "number", description: "Standard deviations (default: 2)" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "get_vwap",
            description: "Get VWAP (Volume Weighted Average Price) for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "get_atr",
            description: "Get ATR (Average True Range) for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                period: { type: "number", description: "ATR period (default: 14)" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "get_adx",
            description: "Get ADX (Average Directional Index) for a symbol from active or specific broker in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                period: { type: "number", description: "ADX period (default: 14)" },
                interval: { type: "string", description: "Time interval (1m, 5m, 15m, 1h, 1d)" },
                from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                broker: { type: "string", enum: ["kite", "groww", "dhan", "angelone"], description: "Specific broker (optional)" }
              },
              required: ["symbol"]
            }
          },
          {
            name: "compare_technical_indicators",
            description: "Compare same technical indicator across multiple brokers in your session",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                indicator: { type: "string", enum: ["RSI", "MACD", "BOLLINGER", "VWAP", "ATR", "ADX"], description: "Technical indicator" },
                period: { type: "number", description: "Period for calculation" },
                brokers: { type: "array", items: { type: "string" }, description: "Brokers to compare" }
              },
              required: ["symbol", "indicator"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Get or create session for this connection
        const connectionId = this.getConnectionId(request);
        const sessionId = this.sessionManager.getSessionId(connectionId);
        
        Logger.debug(`Processing tool call: ${name}`, { 
          args, 
          sessionId: sessionId.substring(0, 8) + '...',
          connectionId 
        });

        switch (name) {
          case "list_brokers":
            return await this.listBrokers(sessionId);
          case "set_active_broker":
            return await this.setActiveBroker(sessionId, args.broker);
          case "authenticate_broker":
            return await this.authenticateBroker(sessionId, args);
          case "logout_broker":
            return await this.logoutBroker(sessionId, args);
          case "get_broker_login_instructions":
            return await this.getBrokerLoginInstructions(sessionId, args);
          case "get_session_info":
            return await this.getSessionInfo(sessionId);
          case "get_portfolio":
            return await this.getPortfolio(sessionId, args);
          case "get_positions":
            return await this.getPositions(sessionId, args);
          case "get_margins":
            return await this.getMargins(sessionId, args);
          case "calculate_order_margin":
            return await this.calculateOrderMargin(sessionId, args);
          case "get_margin_for_orders":
            return await this.getMarginForOrders(sessionId, args);
          case "calculate_kite_order_margins":
            return await this.calculateKiteOrderMargins(sessionId, args);
          case "calculate_kite_basket_margins":
            return await this.calculateKiteBasketMargins(sessionId, args);
          case "calculate_kite_order_charges":
            return await this.calculateKiteOrderCharges(sessionId, args);
          case "create_order":
            return await this.createOrder(sessionId, args);
          case "place_amo":
            return await this.placeAMO(sessionId, args);
          case "place_cover_order":
            return await this.placeCoverOrder(sessionId, args);
          case "place_bracket_order":
            return await this.placeBracketOrder(sessionId, args);
          case "place_iceberg_order":
            return await this.placeIcebergOrder(sessionId, args);
          case "place_groww_gtd_order":
            return await this.placeGrowwGTDOrder(sessionId, args);
          case "place_groww_bracket_order":
            return await this.placeGrowwBracketOrder(sessionId, args);
          case "place_groww_cover_order":
            return await this.placeGrowwCoverOrder(sessionId, args);
          case "get_order_types_info":
            return await this.getOrderTypesInfo(sessionId, args);
          case "get_orders":
            return await this.getOrders(sessionId, args);
          case "modify_order":
            return await this.modifyOrder(sessionId, args);
          case "cancel_order":
            return await this.cancelOrder(sessionId, args);
          case "get_quote":
            return await this.getQuote(sessionId, args);
          case "compare_portfolios":
            return await this.comparePortfolios(sessionId, args);
          case "get_consolidated_portfolio":
            return await this.getConsolidatedPortfolio(sessionId);
          case "get_technical_indicators":
            return await this.getTechnicalIndicators(sessionId, args);
          case "get_rsi":
            return await this.getRSI(sessionId, args);
          case "get_macd":
            return await this.getMACD(sessionId, args);
          case "get_bollinger_bands":
            return await this.getBollingerBands(sessionId, args);
          case "get_vwap":
            return await this.getVWAP(sessionId, args);
          case "get_atr":
            return await this.getATR(sessionId, args);
          case "get_adx":
            return await this.getADX(sessionId, args);
          case "compare_technical_indicators":
            return await this.compareTechnicalIndicators(sessionId, args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        Logger.error(`Tool execution failed: ${name}`, { error: error.message, args });
        return DataFormatter.formatErrorResponse(error);
      }
    });
  }

  /**
   * Generate a connection ID from the request
   * In a real deployment, this could be based on client IP, user agent, etc.
   */
  getConnectionId(request) {
    // Use a combination of request metadata to create a stable connection ID
    // This should be consistent across requests from the same client
    const clientInfo = request.meta?.progressToken || 
                      request.meta?.clientId || 
                      JSON.stringify(request.meta || {}) ||
                      'default_client';
    
    // Create a stable connection ID based only on client info (no timestamp/random)
    // This ensures the same client gets the same connection ID across requests
    return `conn_${Buffer.from(clientInfo).toString('base64').slice(0, 16)}`;
  }

  /**
   * Get session-specific broker helper
   */
  getBroker(sessionId, brokerName) {
    const targetBroker = brokerName || this.sessionManager.getActiveBroker(sessionId);
    if (!targetBroker) {
      throw new Error("No active broker set. Use set_active_broker first or specify a broker.");
    }
    
    const broker = this.sessionManager.getBroker(sessionId, targetBroker);
    if (!broker.isAuthenticated) {
      throw new Error(`Broker ${targetBroker} is not authenticated. Use authenticate_broker first.`);
    }
    return broker;
  }

  async listBrokers(sessionId) {
    const session = this.sessionManager.getSession(sessionId);
    const brokerList = Object.keys(session.brokers).map(key => ({
      name: key,
      displayName: session.brokers[key].name,
      authenticated: session.brokers[key].isAuthenticated,
      active: session.activeBroker === key
    }));

    return DataFormatter.formatMCPResponse({
      brokers: brokerList,
      activeBroker: session.activeBroker || 'None',
      sessionId: sessionId.substring(0, 8) + '...',
      summary: {
        total: brokerList.length,
        authenticated: brokerList.filter(b => b.authenticated).length,
        available: brokerList.filter(b => !b.authenticated).length
      }
    }, "Available Brokers (Your Session)");
  }

  async setActiveBroker(sessionId, brokerName) {
    const session = this.sessionManager.getSession(sessionId);
    if (!session.brokers[brokerName]) {
      throw new Error(`Unknown broker: ${brokerName}`);
    }

    this.sessionManager.setActiveBroker(sessionId, brokerName);
    Logger.info(`Active broker set to: ${brokerName}`, { 
      sessionId: sessionId.substring(0, 8) + '...' 
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Active broker set to: ${session.brokers[brokerName].name}`,
      broker: brokerName,
      authenticated: session.brokers[brokerName].isAuthenticated,
      sessionId: sessionId.substring(0, 8) + '...'
    });
  }

  async authenticateBroker(sessionId, params) {
    const { broker, ...credentials } = params;
    const session = this.sessionManager.getSession(sessionId);
    
    if (!session.brokers[broker]) {
      throw new Error(`Unknown broker: ${broker}`);
    }

    const result = await session.brokers[broker].authenticate(credentials);
    Logger.info(`Broker authentication: ${broker}`, { 
      success: result.success,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      broker: broker,
      sessionId: sessionId.substring(0, 8) + '...',
      ...result
    });
  }

  async logoutBroker(sessionId, params = {}) {
    const { broker } = params;
    const session = this.sessionManager.getSession(sessionId);

    if (broker === 'all') {
      Object.values(session.brokers).forEach(b => b.logout());
      session.activeBroker = null;
      Logger.info("All brokers logged out", { 
        sessionId: sessionId.substring(0, 8) + '...' 
      });
      
      return DataFormatter.formatMCPResponse({
        message: "Logged out from all brokers",
        activeBroker: null,
        sessionId: sessionId.substring(0, 8) + '...'
      });
    }

    if (broker && session.brokers[broker]) {
      session.brokers[broker].logout();
      if (session.activeBroker === broker) {
        session.activeBroker = null;
      }
      Logger.info(`Broker logged out: ${broker}`, { 
        sessionId: sessionId.substring(0, 8) + '...' 
      });
      
      return DataFormatter.formatMCPResponse({
        message: `Logged out from ${broker}`,
        broker: broker,
        sessionId: sessionId.substring(0, 8) + '...'
      });
    }

    throw new Error("Invalid broker specified for logout");
  }

  async getBrokerLoginInstructions(sessionId, args) {
    const { broker } = args;
    const session = this.sessionManager.getSession(sessionId);
    
    if (!session.brokers[broker]) {
      throw new Error(`Unknown broker: ${broker}`);
    }

    let instructions;
    const brokerInstance = session.brokers[broker];
    
    switch (broker) {
      case 'kite':
        if (typeof brokerInstance.generateLoginUrl === 'function') {
          const loginUrl = brokerInstance.generateLoginUrl();
          instructions = {
            broker: 'Kite',
            method: 'web_login',
            loginUrl: loginUrl,
            steps: [
              '1. Visit the login URL',
              '2. Login with your Kite credentials',
              '3. Authorize the application',
              '4. Copy the request_token from the redirect URL',
              '5. Use authenticate_broker with api_key, api_secret, and request_token'
            ],
            required_params: ['api_key', 'api_secret', 'request_token']
          };
        } else {
          instructions = {
            broker: 'Kite',
            method: 'token_based',
            steps: [
              '1. Obtain access_token from Kite Connect',
              '2. Use authenticate_broker with api_key and access_token'
            ],
            required_params: ['api_key', 'access_token']
          };
        }
        break;
        
      case 'angelone':
        if (typeof brokerInstance.generateLoginInstructions === 'function') {
          instructions = {
            broker: 'AngelOne',
            ...brokerInstance.generateLoginInstructions()
          };
        } else {
          instructions = {
            broker: 'AngelOne',
            method: 'multiple_options',
            options: [
              {
                type: 'recommended',
                title: 'JWT Token Authentication',
                required_params: ['jwtToken', 'clientcode', 'api_key']
              },
              {
                type: 'auto_totp',
                title: 'TOTP Secret Authentication (Automated)',
                required_params: ['clientcode', 'password', 'totp_secret', 'api_key']
              },
              {
                type: 'manual_totp',
                title: 'Manual TOTP Authentication',
                required_params: ['clientcode', 'password', 'totp', 'api_key']
              }
            ]
          };
        }
        break;
        
      case 'groww':
        instructions = {
          broker: 'Groww',
          method: 'api_key_based',
          steps: [
            '1. Obtain API key from Groww developer portal',
            '2. Use authenticate_broker with api_key'
          ],
          required_params: ['api_key']
        };
        break;
        
      case 'dhan':
        instructions = {
          broker: 'Dhan',
          method: 'token_based',
          steps: [
            '1. Obtain access_token and client_id from Dhan',
            '2. Use authenticate_broker with access_token and client_id'
          ],
          required_params: ['access_token', 'client_id']
        };
        break;
        
      default:
        throw new Error(`No login instructions available for broker: ${broker}`);
    }

    return DataFormatter.formatMCPResponse({
      ...instructions,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Login Instructions for ${broker.charAt(0).toUpperCase() + broker.slice(1)} (Your Session)`);
  }

  async getSessionInfo(sessionId) {
    const session = this.sessionManager.getSession(sessionId);
    const sessionInfo = {
      sessionId: sessionId.substring(0, 8) + '...',
      createdAt: new Date(session.createdAt).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      activeBroker: session.activeBroker,
      authenticatedBrokers: Object.keys(session.brokers).filter(
        key => session.brokers[key].isAuthenticated
      ),
      totalSessions: this.sessionManager.getSessionsInfo().totalSessions
    };

    return DataFormatter.formatMCPResponse(sessionInfo, "Session Information");
  }

  async getPortfolio(sessionId, args = {}) {
    const broker = this.getBroker(sessionId, args.broker);
    const result = await broker.getPortfolio(args);
    const formatted = DataFormatter.formatPortfolio(result);
    
    return DataFormatter.formatMCPResponse({
      ...formatted,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Portfolio from ${result.broker} (Your Session)`);
  }

  async getPositions(sessionId, args = {}) {
    const broker = this.getBroker(sessionId, args.broker);
    const result = await broker.getPositions(args);
    
    return DataFormatter.formatMCPResponse({
      ...result,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Positions from ${result.broker} (Your Session)`);
  }

  async getMargins(sessionId, args = {}) {
    const broker = this.getBroker(sessionId, args.broker);
    const result = await broker.getMargins(args.segment);
    
    return DataFormatter.formatMCPResponse({
      ...result,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Margins from ${result.broker} (Your Session)`);
  }
  
  async calculateKiteOrderMargins(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`Kite order margin calculation is only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    if (typeof broker.calculateOrderMargins !== 'function') {
      throw new Error(`Order margin calculation not available for ${broker.name}`);
    }
    
    const result = await broker.calculateOrderMargins(args.orders);
    
    Logger.info(`Order margins calculated via ${result.broker}`, { 
      orderCount: result.orderCount,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Margins calculated successfully for ${result.orderCount} orders`,
      broker: result.broker,
      orderCount: result.orderCount,
      orders: args.orders,
      marginData: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Kite Order Margins Calculation Result (Your Session)");
  }
  
  async calculateKiteBasketMargins(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`Kite basket margin calculation is only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    if (typeof broker.calculateBasketMargins !== 'function') {
      throw new Error(`Basket margin calculation not available for ${broker.name}`);
    }
    
    const considerPositions = args.consider_positions !== undefined ? args.consider_positions : true;
    const result = await broker.calculateBasketMargins(args.orders, considerPositions, args.mode);
    
    Logger.info(`Basket margins calculated via ${result.broker}`, { 
      orderCount: result.orderCount,
      considerPositions: result.considerPositions,
      mode: result.mode,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Basket margins calculated successfully for ${result.orderCount} orders`,
      broker: result.broker,
      orderCount: result.orderCount,
      considerPositions: result.considerPositions,
      mode: result.mode,
      orders: args.orders,
      marginData: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Kite Basket Margins Calculation Result (Your Session)");
  }
  
  async calculateKiteOrderCharges(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`Kite order charges calculation is only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    if (typeof broker.calculateOrderCharges !== 'function') {
      throw new Error(`Order charges calculation not available for ${broker.name}`);
    }
    
    const result = await broker.calculateOrderCharges(args.orders);
    
    Logger.info(`Order charges calculated via ${result.broker}`, { 
      orderCount: result.orderCount,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Order charges calculated successfully for ${result.orderCount} orders`,
      broker: result.broker,
      orderCount: result.orderCount,
      orders: args.orders,
      chargesData: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Kite Order Charges Calculation Result (Your Session)");
  }
  
  async calculateOrderMargin(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Groww') {
      throw new Error(`Order margin calculation is only supported by Groww broker. Current broker: ${broker.name}`);
    }
    
    if (typeof broker.calculateOrderMargin !== 'function') {
      throw new Error(`Margin calculation not available for ${broker.name}`);
    }
    
    const result = await broker.calculateOrderMargin(args);
    
    Logger.info(`Margin calculated for order via ${result.broker}`, { 
      symbol: args.trading_symbol,
      quantity: args.quantity,
      segment: args.segment,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Margin calculated successfully for ${args.trading_symbol}`,
      broker: result.broker,
      segment: result.segment,
      orderDetails: {
        trading_symbol: args.trading_symbol,
        transaction_type: args.transaction_type,
        order_type: args.order_type,
        quantity: args.quantity,
        product: args.product
      },
      marginData: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Order Margin Calculation Result (Your Session)");
  }
  
  async getMarginForOrders(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Groww') {
      throw new Error(`Bulk margin calculation is only supported by Groww broker. Current broker: ${broker.name}`);
    }
    
    if (typeof broker.getMarginForOrders !== 'function') {
      throw new Error(`Bulk margin calculation not available for ${broker.name}`);
    }
    
    const segment = args.segment || 'CASH';
    const result = await broker.getMarginForOrders(args.orders, segment);
    
    Logger.info(`Bulk margin calculated via ${result.broker}`, { 
      orderCount: args.orders.length,
      segment: segment,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Margin calculated successfully for ${args.orders.length} orders`,
      broker: result.broker,
      segment: result.segment,
      orderCount: args.orders.length,
      orders: args.orders,
      marginData: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Bulk Margin Calculation Result (Your Session)");
  }

  async createOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const result = await broker.createOrder(args);
    
    Logger.info(`Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      broker: result.broker,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Order Creation Result (Your Session)");
  }

  async getOrders(sessionId, args = {}) {
    const broker = this.getBroker(sessionId, args.broker);
    const result = await broker.getOrders(args);
    
    return DataFormatter.formatMCPResponse({
      ...result,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Orders from ${result.broker} (Your Session)`);
  }

  // Enhanced Order Methods for All Kite Order Types
  
  async placeAMO(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`AMO orders are only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeAMO(args);
    
    Logger.info(`AMO created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'amo'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `After Market Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "AMO Creation Result (Your Session)");
  }
  
  async placeCoverOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`Cover Orders are only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeCoverOrder(args);
    
    Logger.info(`Cover Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'co'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Cover Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Cover Order Creation Result (Your Session)");
  }
  
  async placeBracketOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`Bracket Orders are only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeBracketOrder(args);
    
    Logger.info(`Bracket Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'bo'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Bracket Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Bracket Order Creation Result (Your Session)");
  }
  
  async placeIcebergOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Kite') {
      throw new Error(`Iceberg Orders are only supported by Kite broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeIcebergOrder(args);
    
    Logger.info(`Iceberg Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'iceberg'
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Iceberg Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Iceberg Order Creation Result (Your Session)");
  }
  
  async getOrderTypesInfo(sessionId, args = {}) {
    const broker = this.getBroker(sessionId, args.broker);
    
    let orderTypesInfo;
    if ((broker.name === 'Kite' || broker.name === 'Groww') && typeof broker.getOrderTypesInfo === 'function') {
      orderTypesInfo = broker.getOrderTypesInfo();
    } else {
      // Fallback info for other brokers
      orderTypesInfo = {
        order_types: {
          MARKET: {
            description: 'Market order - executed at current market price',
            required_params: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'product']
          },
          LIMIT: {
            description: 'Limit order - executed at specified price or better',
            required_params: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'product', 'price']
          }
        },
        varieties: {
          regular: {
            description: 'Regular order placed during market hours',
            supported_order_types: ['MARKET', 'LIMIT']
          }
        },
        products: {
          CNC: 'Cash and Carry (delivery)',
          MIS: 'Margin Intraday Square-off',
          NRML: 'Normal (overnight positions)'
        }
      };
    }
    
    return DataFormatter.formatMCPResponse({
      broker: broker.name,
      orderTypesInfo,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Order Types Information - ${broker.name} (Your Session)`);
  }
  
  // Enhanced Groww-specific order methods
  
  async placeGrowwGTDOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Groww') {
      throw new Error(`GTD orders are only supported by Groww broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeGTDOrder(args);
    
    Logger.info(`GTD Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'gtd',
      validityDate: args.validity_date
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Good Till Date Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      validityDate: args.validity_date,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "GTD Order Creation Result (Your Session)");
  }
  
  async placeGrowwBracketOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Groww') {
      throw new Error(`Bracket orders are only supported by Groww broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeBracketOrder(args);
    
    Logger.info(`Bracket Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'bracket',
      stopLoss: args.stop_loss,
      target: args.target
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Bracket Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      stopLoss: args.stop_loss,
      target: args.target,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Bracket Order Creation Result (Your Session)");
  }
  
  async placeGrowwCoverOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    if (broker.name !== 'Groww') {
      throw new Error(`Cover orders are only supported by Groww broker. Current broker: ${broker.name}`);
    }
    
    const result = await broker.placeCoverOrder(args);
    
    Logger.info(`Cover Order created via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: 'cover',
      stopLoss: args.stop_loss
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Cover Order created successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      stopLoss: args.stop_loss,
      orderDetails: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Cover Order Creation Result (Your Session)");
  }
  
  async modifyOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const { order_id, variety = 'regular', ...modifyParams } = args;
    
    const result = await broker.modifyOrder(order_id, { ...modifyParams, variety });
    
    Logger.info(`Order modified via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: result.variety
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Order modified successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      modifications: result.data,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Order Modification Result (Your Session)");
  }
  
  async cancelOrder(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const { order_id, variety = 'regular' } = args;
    
    const result = await broker.cancelOrder(order_id, variety);
    
    Logger.info(`Order cancelled via ${result.broker}`, { 
      orderId: result.order_id,
      sessionId: sessionId.substring(0, 8) + '...',
      variety: result.variety
    });
    
    return DataFormatter.formatMCPResponse({
      message: `Order cancelled successfully via ${result.broker}`,
      orderId: result.order_id,
      status: result.status,
      variety: result.variety,
      broker: result.broker,
      sessionId: sessionId.substring(0, 8) + '...'
    }, "Order Cancellation Result (Your Session)");
  }

  async getQuote(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    
    // Handle different quote formats based on broker
    let result;
    if (broker.name === 'AngelOne') {
      // AngelOne expects individual symbol objects with token
      // For now, handle single symbol (can be enhanced for multiple)
      if (args.symbols && args.symbols.length > 0) {
        result = await broker.getQuote(args.symbols[0]);
      } else {
        throw new Error('AngelOne requires symbol data with tradingsymbol and symboltoken');
      }
    } else {
      // Other brokers can use the traditional string array
      const symbolNames = args.symbols.map(s => typeof s === 'object' ? s.tradingsymbol : s);
      result = await broker.getQuote(symbolNames);
    }
    
    return DataFormatter.formatMCPResponse({
      ...result,
      sessionId: sessionId.substring(0, 8) + '...'
    }, `Quotes from ${result.broker} (Your Session)`);
  }

  async comparePortfolios(sessionId, args = {}) {
    const session = this.sessionManager.getSession(sessionId);
    const brokersToCompare = args.brokers || Object.keys(session.brokers).filter(b => session.brokers[b].isAuthenticated);
    
    if (brokersToCompare.length === 0) {
      throw new Error("No authenticated brokers available for comparison in your session");
    }

    const portfolios = {};
    
    for (const brokerName of brokersToCompare) {
      try {
        if (session.brokers[brokerName] && session.brokers[brokerName].isAuthenticated) {
          const result = await session.brokers[brokerName].getPortfolio();
          const formatted = DataFormatter.formatPortfolio(result);
          portfolios[brokerName] = formatted;
        }
      } catch (error) {
        portfolios[brokerName] = { error: error.message };
        Logger.warn(`Failed to get portfolio for ${brokerName}`, { 
          error: error.message,
          sessionId: sessionId.substring(0, 8) + '...'
        });
      }
    }

    return DataFormatter.formatMCPResponse({
      portfolios,
      sessionId: sessionId.substring(0, 8) + '...',
      comparedBrokers: brokersToCompare
    }, "Portfolio Comparison (Your Session)");
  }

  async getConsolidatedPortfolio(sessionId) {
    const session = this.sessionManager.getSession(sessionId);
    const authenticatedBrokers = Object.keys(session.brokers).filter(b => session.brokers[b].isAuthenticated);
    
    if (authenticatedBrokers.length === 0) {
      throw new Error("No authenticated brokers available in your session");
    }

    const consolidatedHoldings = new Map();
    const brokerData = {};

    for (const brokerName of authenticatedBrokers) {
      try {
        const result = await session.brokers[brokerName].getPortfolio();
        const formatted = DataFormatter.formatPortfolio(result);
        brokerData[brokerName] = formatted;

        // Consolidate holdings by symbol
        if (formatted.data && Array.isArray(formatted.data)) {
          formatted.data.forEach(holding => {
            const symbol = holding.symbol;
            if (consolidatedHoldings.has(symbol)) {
              const existing = consolidatedHoldings.get(symbol);
              existing.quantity += holding.quantity || 0;
              existing.currentValue += holding.currentValue || 0;
              existing.investedValue += holding.investedValue || 0;
              existing.brokers.push(brokerName);
            } else {
              consolidatedHoldings.set(symbol, {
                symbol: symbol,
                quantity: holding.quantity || 0,
                currentValue: holding.currentValue || 0,
                investedValue: holding.investedValue || 0,
                brokers: [brokerName]
              });
            }
          });
        }
      } catch (error) {
        Logger.warn(`Failed to get portfolio for ${brokerName}`, { 
          error: error.message,
          sessionId: sessionId.substring(0, 8) + '...'
        });
        brokerData[brokerName] = { error: error.message };
      }
    }

    const consolidated = Array.from(consolidatedHoldings.values()).map(holding => ({
      ...holding,
      avgPrice: holding.investedValue > 0 ? holding.investedValue / holding.quantity : 0,
      currentPrice: holding.currentValue > 0 ? holding.currentValue / holding.quantity : 0,
      pnl: holding.currentValue - holding.investedValue,
      pnlPercent: holding.investedValue > 0 ? ((holding.currentValue - holding.investedValue) / holding.investedValue) * 100 : 0
    }));

    return DataFormatter.formatMCPResponse({
      consolidated: consolidated,
      summary: DataFormatter.calculatePortfolioSummary(consolidated),
      brokerBreakdown: brokerData,
      sessionId: sessionId.substring(0, 8) + '...',
      authenticatedBrokers: authenticatedBrokers
    }, "Consolidated Portfolio (Your Session)");
  }

  // Technical Analysis Methods
  async getTechnicalIndicators(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      indicators = ['RSI', 'MACD', 'BOLLINGER'],
      period = 14,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getTechnicalIndicators(symbol, interval, from_date, to_date, indicators);
      } else if (broker.name === 'Groww') {
        const indicatorResults = {};
        for (const indicator of indicators) {
          try {
            const data = await broker.getTechnicalIndicators(symbol, indicator, period);
            indicatorResults[indicator] = data;
          } catch (error) {
            indicatorResults[indicator] = { error: error.message };
          }
        }
        result = {
          broker: 'Groww',
          data: {
            indicators: indicatorResults,
            symbol: symbol,
            period: period
          }
        };
      } else if (broker.name === 'Dhan') {
        result = await broker.getTechnicalIndicators(symbol, 'NSE_EQ', interval, from_date, to_date, indicators);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `Technical Indicators for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get technical indicators: ${error.message}`);
    }
  }

  // Individual Technical Analysis Methods

  async getRSI(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      period = 14,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getRSI(symbol, interval, from_date, to_date, period);
      } else if (broker.name === 'Groww') {
        result = await broker.getTechnicalIndicators(symbol, 'RSI', period);
      } else if (broker.name === 'Dhan') {
        result = await broker.getRSI(symbol, 'NSE_EQ', interval, from_date, to_date, period);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `RSI for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get RSI: ${error.message}`);
    }
  }

  async getMACD(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      fast_period = 12,
      slow_period = 26,
      signal_period = 9,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getMACD(symbol, interval, from_date, to_date, fast_period, slow_period, signal_period);
      } else if (broker.name === 'Groww') {
        result = await broker.getTechnicalIndicators(symbol, 'MACD');
      } else if (broker.name === 'Dhan') {
        result = await broker.getMACD(symbol, 'NSE_EQ', interval, from_date, to_date, fast_period, slow_period, signal_period);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `MACD for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get MACD: ${error.message}`);
    }
  }

  async getBollingerBands(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      period = 20,
      standard_deviations = 2,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getBollingerBands(symbol, interval, from_date, to_date, period, standard_deviations);
      } else if (broker.name === 'Groww') {
        result = await broker.getTechnicalIndicators(symbol, 'BOLLINGER', period);
      } else if (broker.name === 'Dhan') {
        result = await broker.getBollingerBands(symbol, 'NSE_EQ', interval, from_date, to_date, period, standard_deviations);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `Bollinger Bands for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get Bollinger Bands: ${error.message}`);
    }
  }

  async getVWAP(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getVWAP(symbol, interval, from_date, to_date);
      } else if (broker.name === 'Groww') {
        result = await broker.getTechnicalIndicators(symbol, 'VWAP');
      } else if (broker.name === 'Dhan') {
        result = await broker.getVWAP(symbol, 'NSE_EQ', interval, from_date, to_date);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `VWAP for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get VWAP: ${error.message}`);
    }
  }

  async getATR(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      period = 14,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getATR(symbol, interval, from_date, to_date, period);
      } else if (broker.name === 'Groww') {
        result = await broker.getTechnicalIndicators(symbol, 'ATR', period);
      } else if (broker.name === 'Dhan') {
        result = await broker.getATR(symbol, 'NSE_EQ', interval, from_date, to_date, period);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `ATR for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get ATR: ${error.message}`);
    }
  }

  async getADX(sessionId, args) {
    const broker = this.getBroker(sessionId, args.broker);
    const {
      symbol,
      period = 14,
      interval = '1d',
      from_date,
      to_date
    } = args;

    try {
      let result;
      
      if (broker.name === 'Kite') {
        result = await broker.getADX(symbol, interval, from_date, to_date, period);
      } else if (broker.name === 'Groww') {
        result = await broker.getTechnicalIndicators(symbol, 'ADX', period);
      } else if (broker.name === 'Dhan') {
        result = await broker.getADX(symbol, 'NSE_EQ', interval, from_date, to_date, period);
      }

      return DataFormatter.formatMCPResponse({
        ...result,
        sessionId: sessionId.substring(0, 8) + '...'
      }, `ADX for ${symbol} from ${broker.name} (Your Session)`);
    } catch (error) {
      throw new Error(`Failed to get ADX: ${error.message}`);
    }
  }

  async compareTechnicalIndicators(sessionId, args) {
    const session = this.sessionManager.getSession(sessionId);
    const {
      symbol,
      indicator,
      period = 14,
      brokers = Object.keys(session.brokers).filter(b => session.brokers[b].isAuthenticated)
    } = args;

    if (brokers.length === 0) {
      throw new Error("No authenticated brokers available for comparison in your session");
    }

    const results = {};
    
    for (const brokerName of brokers) {
      try {
        if (session.brokers[brokerName] && session.brokers[brokerName].isAuthenticated) {
          const result = await this.getTechnicalIndicators(sessionId, { 
            symbol, 
            indicators: [indicator], 
            period, 
            broker: brokerName 
          });
          results[brokerName] = result.content[0].text;
        }
      } catch (error) {
        results[brokerName] = { error: error.message };
        Logger.warn(`Failed to get ${indicator} for ${brokerName}`, { 
          error: error.message,
          sessionId: sessionId.substring(0, 8) + '...'
        });
      }
    }

    return DataFormatter.formatMCPResponse({
      symbol: symbol,
      indicator: indicator,
      period: period,
      comparison: results,
      sessionId: sessionId.substring(0, 8) + '...',
      comparedBrokers: brokers,
      summary: `${indicator} comparison for ${symbol} across ${Object.keys(results).length} brokers in your session`
    }, `${indicator} Comparison for ${symbol} (Your Session)`);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    Logger.info("TurtleStack MCP server running on stdio with multi-user support");
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    Logger.info("Shutting down TurtleStack Server");
    this.sessionManager.shutdown();
  }
}
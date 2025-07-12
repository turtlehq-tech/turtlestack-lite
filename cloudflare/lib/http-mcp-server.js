// HTTP-based MCP Server for Cloudflare Workers
// Converts stdio-based MCP protocol to HTTP endpoints

import { WorkerKiteBroker } from './brokers/kite-broker.js';
import { WorkerGrowwBroker } from './brokers/groww-broker.js';
import { WorkerDhanBroker } from './brokers/dhan-broker.js';
import { ErrorHandler } from './error-handler.js';

export class HTTPMCPServer {
  constructor(sessionManager, env) {
    this.sessionManager = sessionManager;
    this.env = env;
    this.tools = this.initializeTools();
  }

  // Initialize available MCP tools
  initializeTools() {
    return {
      // Authentication tools
      authenticate_broker: {
        name: 'authenticate_broker',
        description: 'Authenticate with a trading broker (Kite, Groww, or Dhan)',
        inputSchema: {
          type: 'object',
          properties: {
            broker: {
              type: 'string',
              enum: ['kite', 'groww', 'dhan'],
              description: 'The broker to authenticate with'
            },
            credentials: {
              type: 'object',
              description: 'Broker-specific authentication credentials',
              properties: {
                api_key: { type: 'string' },
                access_token: { type: 'string' },
                request_token: { type: 'string' },
                api_secret: { type: 'string' }
              }
            }
          },
          required: ['broker', 'credentials']
        }
      },

      // Portfolio tools
      get_portfolio: {
        name: 'get_portfolio',
        description: 'Get portfolio holdings for the authenticated broker',
        inputSchema: {
          type: 'object',
          properties: {
            broker: {
              type: 'string',
              enum: ['kite', 'groww', 'dhan'],
              description: 'The broker to get portfolio from'
            }
          }
        }
      },

      get_positions: {
        name: 'get_positions',
        description: 'Get current positions for the authenticated broker',
        inputSchema: {
          type: 'object',
          properties: {
            broker: {
              type: 'string',
              enum: ['kite', 'groww', 'dhan'],
              description: 'The broker to get positions from'
            }
          }
        }
      },

      // Order management tools
      create_order: {
        name: 'create_order',
        description: 'Place a new order with the specified broker',
        inputSchema: {
          type: 'object',
          properties: {
            broker: {
              type: 'string',
              enum: ['kite', 'groww', 'dhan'],
              description: 'The broker to place order with'
            },
            trading_symbol: { type: 'string', description: 'Trading symbol (e.g., RELIANCE, INFY)' },
            exchange: { type: 'string', enum: ['NSE', 'BSE', 'NFO', 'MCX', 'CDS'] },
            transaction_type: { type: 'string', enum: ['BUY', 'SELL'] },
            order_type: { type: 'string', enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'] },
            quantity: { type: 'number', description: 'Number of shares/contracts' },
            product: { type: 'string', enum: ['CNC', 'MIS', 'NRML', 'CO', 'BO'] },
            price: { type: 'number', description: 'Price for LIMIT orders' },
            trigger_price: { type: 'number', description: 'Trigger price for SL orders' },
            validity: { type: 'string', enum: ['DAY', 'IOC', 'GTD', 'GTC'], default: 'DAY' }
          },
          required: ['broker', 'trading_symbol', 'exchange', 'transaction_type', 'order_type', 'quantity', 'product']
        }
      },

      get_orders: {
        name: 'get_orders',
        description: 'Get all orders for the authenticated broker',
        inputSchema: {
          type: 'object',
          properties: {
            broker: {
              type: 'string',
              enum: ['kite', 'groww', 'dhan'],
              description: 'The broker to get orders from'
            }
          }
        }
      },

      modify_order: {
        name: 'modify_order',
        description: 'Modify an existing order',
        inputSchema: {
          type: 'object',
          properties: {
            broker: { type: 'string', enum: ['kite', 'groww', 'dhan'] },
            order_id: { type: 'string', description: 'Order ID to modify' },
            quantity: { type: 'number' },
            price: { type: 'number' },
            order_type: { type: 'string', enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'] },
            trigger_price: { type: 'number' },
            validity: { type: 'string', enum: ['DAY', 'IOC', 'GTD', 'GTC'] }
          },
          required: ['broker', 'order_id']
        }
      },

      cancel_order: {
        name: 'cancel_order',
        description: 'Cancel an existing order',
        inputSchema: {
          type: 'object',
          properties: {
            broker: { type: 'string', enum: ['kite', 'groww', 'dhan'] },
            order_id: { type: 'string', description: 'Order ID to cancel' },
            variety: { type: 'string', default: 'regular' }
          },
          required: ['broker', 'order_id']
        }
      },

      // Market data tools
      get_quote: {
        name: 'get_quote',
        description: 'Get real-time quotes for instruments',
        inputSchema: {
          type: 'object',
          properties: {
            broker: { type: 'string', enum: ['kite', 'groww', 'dhan'] },
            symbols: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Trading symbols to get quotes for'
            }
          },
          required: ['broker', 'symbols']
        }
      },

      // Margin tools
      get_margins: {
        name: 'get_margins',
        description: 'Get available margin information',
        inputSchema: {
          type: 'object',
          properties: {
            broker: { type: 'string', enum: ['kite', 'groww', 'dhan'] },
            segment: { type: 'string', enum: ['equity', 'commodity'] }
          },
          required: ['broker']
        }
      },

      // Session management
      get_session_info: {
        name: 'get_session_info',
        description: 'Get current session information',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      set_active_broker: {
        name: 'set_active_broker',
        description: 'Set the active broker for the session',
        inputSchema: {
          type: 'object',
          properties: {
            broker: { type: 'string', enum: ['kite', 'groww', 'dhan'] }
          },
          required: ['broker']
        }
      }
    };
  }

  // List all available tools
  async listTools(sessionId) {
    try {
      return {
        tools: Object.values(this.tools)
      };
    } catch (error) {
      console.error('Failed to list tools:', error);
      return { tools: [] };
    }
  }

  // Execute a tool call
  async callTool(toolName, args, sessionId) {
    try {
      // Ensure session exists
      if (sessionId !== 'default') {
        await this.sessionManager.getSession(sessionId);
      }

      // Route to appropriate handler
      switch (toolName) {
        case 'authenticate_broker':
          return await this.handleAuthenticate(args, sessionId);
        
        case 'get_portfolio':
          return await this.handleGetPortfolio(args, sessionId);
        
        case 'get_positions':
          return await this.handleGetPositions(args, sessionId);
        
        case 'create_order':
          return await this.handleCreateOrder(args, sessionId);
        
        case 'get_orders':
          return await this.handleGetOrders(args, sessionId);
        
        case 'modify_order':
          return await this.handleModifyOrder(args, sessionId);
        
        case 'cancel_order':
          return await this.handleCancelOrder(args, sessionId);
        
        case 'get_quote':
          return await this.handleGetQuote(args, sessionId);
        
        case 'get_margins':
          return await this.handleGetMargins(args, sessionId);
        
        case 'get_session_info':
          return await this.handleGetSessionInfo(args, sessionId);
        
        case 'set_active_broker':
          return await this.handleSetActiveBroker(args, sessionId);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      return {
        error: true,
        message: error.message,
        tool: toolName
      };
    }
  }

  // Get broker instance
  async getBrokerInstance(brokerName, sessionId) {
    const brokerAuth = await this.sessionManager.getBrokerAuth(sessionId, brokerName);
    
    let broker;
    switch (brokerName) {
      case 'kite':
        broker = new WorkerKiteBroker();
        break;
      case 'groww':
        broker = new WorkerGrowwBroker();
        break;
      case 'dhan':
        broker = new WorkerDhanBroker();
        break;
      default:
        throw new Error(`Unknown broker: ${brokerName}`);
    }

    // Restore authentication state
    if (brokerAuth.isAuthenticated && brokerAuth.data) {
      broker.restoreAuthState(brokerAuth.data);
    }

    return broker;
  }

  // Tool handlers
  async handleAuthenticate(args, sessionId) {
    const { broker, credentials } = args;
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    
    const result = await brokerInstance.authenticate(credentials);
    
    if (result.success) {
      await this.sessionManager.updateBrokerAuth(sessionId, broker, {
        credentials: credentials,
        authResult: result,
        timestamp: Date.now()
      });
    }
    
    return result;
  }

  async handleGetPortfolio(args, sessionId) {
    const broker = args.broker || (await this.sessionManager.getSession(sessionId)).activeBroker;
    if (!broker) throw new Error('No broker specified or active');
    
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.getPortfolio(args);
  }

  async handleGetPositions(args, sessionId) {
    const broker = args.broker || (await this.sessionManager.getSession(sessionId)).activeBroker;
    if (!broker) throw new Error('No broker specified or active');
    
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.getPositions(args);
  }

  async handleCreateOrder(args, sessionId) {
    const { broker } = args;
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.createOrder(args);
  }

  async handleGetOrders(args, sessionId) {
    const broker = args.broker || (await this.sessionManager.getSession(sessionId)).activeBroker;
    if (!broker) throw new Error('No broker specified or active');
    
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.getOrders(args);
  }

  async handleModifyOrder(args, sessionId) {
    const { broker, order_id, ...modifyParams } = args;
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.modifyOrder(order_id, modifyParams);
  }

  async handleCancelOrder(args, sessionId) {
    const { broker, order_id, variety } = args;
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.cancelOrder(order_id, variety);
  }

  async handleGetQuote(args, sessionId) {
    const { broker, symbols } = args;
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.getQuote(symbols);
  }

  async handleGetMargins(args, sessionId) {
    const { broker, segment } = args;
    const brokerInstance = await this.getBrokerInstance(broker, sessionId);
    return await brokerInstance.getMargins(segment);
  }

  async handleGetSessionInfo(args, sessionId) {
    return await this.sessionManager.getSessionInfo(sessionId);
  }

  async handleSetActiveBroker(args, sessionId) {
    const { broker } = args;
    await this.sessionManager.setActiveBroker(sessionId, broker);
    return { success: true, activeBroker: broker };
  }

  // Handle direct API calls (bypass MCP protocol)
  async handleDirectAPI(broker, operation, request, sessionId) {
    try {
      const brokerInstance = await this.getBrokerInstance(broker, sessionId);
      const requestBody = request.method === 'POST' ? await request.json() : {};
      
      // Route to broker method based on operation
      switch (operation) {
        case 'portfolio':
          return await brokerInstance.getPortfolio(requestBody);
        case 'positions':
          return await brokerInstance.getPositions(requestBody);
        case 'orders':
          if (request.method === 'POST') {
            return await brokerInstance.createOrder(requestBody);
          } else {
            return await brokerInstance.getOrders(requestBody);
          }
        case 'quotes':
          return await brokerInstance.getQuote(requestBody.symbols);
        case 'margins':
          return await brokerInstance.getMargins(requestBody.segment);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Direct API error for ${broker}/${operation}:`, error);
      return {
        error: true,
        message: error.message,
        broker: broker,
        operation: operation
      };
    }
  }
}
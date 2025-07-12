// TurtleStack MCP Server - Cloudflare Worker Implementation
// Optimized for free tier with robust error handling

import { WorkerSessionManager } from './lib/session-manager.js';
import { HTTPMCPServer } from './lib/http-mcp-server.js';
import { WorkerKiteBroker } from './lib/brokers/kite-broker.js';
import { WorkerGrowwBroker } from './lib/brokers/groww-broker.js';
import { WorkerDhanBroker } from './lib/brokers/dhan-broker.js';
import { ErrorHandler } from './lib/error-handler.js';
import { RateLimiter } from './lib/rate-limiter.js';

export default {
  async fetch(request, env, ctx) {
    // Initialize core components
    const sessionManager = new WorkerSessionManager(env.SESSIONS_KV);
    const rateLimiter = new RateLimiter(env.SESSIONS_KV);
    const mcpServer = new HTTPMCPServer(sessionManager, env);

    // Add CORS headers for browser compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
      'Access-Control-Max-Age': '86400',
    };

    try {
      // Handle preflight OPTIONS requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Extract client IP for rate limiting
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                       request.headers.get('X-Forwarded-For') || 
                       'anonymous';

      // Apply rate limiting (free tier: 100k requests per day = ~1.15 per second)
      const rateLimitResult = await rateLimiter.checkLimit(clientIP, 60, 60); // 60 requests per minute
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Parse URL and route request
      const url = new URL(request.url);
      const path = url.pathname;

      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // MCP Tools listing endpoint
      if (path === '/mcp/tools' && request.method === 'GET') {
        const sessionId = request.headers.get('X-Session-ID') || 'default';
        const tools = await mcpServer.listTools(sessionId);
        
        return new Response(JSON.stringify(tools), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // MCP Tool execution endpoint
      if (path === '/mcp/call' && request.method === 'POST') {
        const sessionId = request.headers.get('X-Session-ID') || 'default';
        
        let requestBody;
        try {
          requestBody = await request.json();
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Invalid JSON in request body'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { tool, arguments: args } = requestBody;
        if (!tool) {
          return new Response(JSON.stringify({
            error: 'Missing tool name in request'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Execute tool with comprehensive error handling
        const result = await ErrorHandler.safeExecute(async () => {
          return await mcpServer.callTool(tool, args || {}, sessionId);
        }, `tool_${tool}`);

        // Log to analytics for monitoring
        if (env.ANALYTICS) {
          ctx.waitUntil(env.ANALYTICS.writeDataPoint({
            blobs: [tool, sessionId, clientIP],
            doubles: [result.error ? 0 : 1], // Success rate
            indexes: [clientIP]
          }));
        }

        return new Response(JSON.stringify(result), {
          status: result.error ? 500 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Session management endpoints
      if (path === '/session/create' && request.method === 'POST') {
        const sessionId = await sessionManager.createSession();
        return new Response(JSON.stringify({ sessionId }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/session/info' && request.method === 'GET') {
        const sessionId = request.headers.get('X-Session-ID');
        if (!sessionId) {
          return new Response(JSON.stringify({
            error: 'Missing X-Session-ID header'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const sessionInfo = await sessionManager.getSessionInfo(sessionId);
        return new Response(JSON.stringify(sessionInfo), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Broker-specific endpoints for direct API access
      if (path.startsWith('/api/')) {
        const pathParts = path.split('/');
        const broker = pathParts[2]; // /api/{broker}/...
        const operation = pathParts[3]; // /api/{broker}/{operation}
        
        if (!['kite', 'groww', 'dhan'].includes(broker)) {
          return new Response(JSON.stringify({
            error: 'Invalid broker. Supported: kite, groww, dhan'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const sessionId = request.headers.get('X-Session-ID') || 'default';
        const result = await mcpServer.handleDirectAPI(broker, operation, request, sessionId);
        
        return new Response(JSON.stringify(result), {
          status: result.error ? 500 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Default: Return available endpoints
      return new Response(JSON.stringify({
        name: 'TurtleStack MCP Server',
        version: '2.0.0',
        endpoints: {
          health: 'GET /health',
          tools: 'GET /mcp/tools',
          call: 'POST /mcp/call',
          session_create: 'POST /session/create',
          session_info: 'GET /session/info',
          direct_api: 'POST /api/{broker}/{operation}'
        },
        supported_brokers: ['kite', 'groww', 'dhan'],
        headers_required: {
          'X-Session-ID': 'Required for most operations',
          'Content-Type': 'application/json for POST requests'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      // Global error handler
      console.error('Worker error:', error);
      
      // Log error to analytics
      if (env.ANALYTICS) {
        ctx.waitUntil(env.ANALYTICS.writeDataPoint({
          blobs: ['global_error', error.message],
          doubles: [0], // Error indicator
          indexes: [clientIP]
        }));
      }

      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: env.DEBUG_MODE === 'true' ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
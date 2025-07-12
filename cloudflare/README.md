# TurtleStack MCP Server - Cloudflare Workers

A robust, production-ready Cloudflare Worker implementation of the TurtleStack MCP (Model Context Protocol) server for multi-broker trading operations.

## 🚀 Features

- **Multi-Broker Support**: Kite, Groww, and Dhan
- **HTTP-based MCP Protocol**: RESTful API endpoints for all MCP operations
- **Session Management**: Persistent session storage using Cloudflare KV
- **Rate Limiting**: Built-in rate limiting optimized for free tier
- **Error Handling**: Comprehensive error handling to prevent 500 errors
- **Free Tier Optimized**: Designed to work within Cloudflare's free tier limits

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Trading Account**: Valid API credentials for Kite, Groww, or Dhan

## 🛠️ Setup Instructions

### 1. Create KV Namespace

```bash
# Create KV namespace for session storage
wrangler kv:namespace create SESSIONS_KV

# Create preview namespace for development
wrangler kv:namespace create SESSIONS_KV --preview
```

### 2. Update wrangler.toml

Replace the KV namespace ID in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "your-kv-namespace-id-here"  # Replace with actual ID from step 1
```

### 3. Deploy to Cloudflare Workers

```bash
# Install dependencies
npm install

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### 4. Set Environment Variables (Optional)

```bash
# Set via Cloudflare Dashboard > Workers > Settings > Environment Variables
# Or via CLI:
wrangler secret put KITE_API_KEY
wrangler secret put KITE_API_SECRET
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Session Management
```
POST /session/create          # Create new session
GET /session/info             # Get session info (requires X-Session-ID header)
```

### MCP Protocol
```
GET /mcp/tools                # List available tools
POST /mcp/call                # Execute tool (requires X-Session-ID header)
```

### Direct Broker API
```
POST /api/{broker}/orders     # Create order
GET /api/{broker}/portfolio   # Get portfolio
GET /api/{broker}/positions   # Get positions
GET /api/{broker}/quotes      # Get quotes
```

## 🔧 Usage Examples

### 1. Create Session
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/session/create
# Returns: {"sessionId": "session_1234567890_abcdef"}
```

### 2. Authenticate with Kite
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp/call \
  -H "X-Session-ID: session_1234567890_abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "authenticate_broker",
    "arguments": {
      "broker": "kite",
      "credentials": {
        "api_key": "your_kite_api_key",
        "access_token": "your_kite_access_token"
      }
    }
  }'
```

### 3. Get Portfolio
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp/call \
  -H "X-Session-ID: session_1234567890_abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_portfolio",
    "arguments": {
      "broker": "kite"
    }
  }'
```

### 4. Place Order
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp/call \
  -H "X-Session-ID: session_1234567890_abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_order",
    "arguments": {
      "broker": "kite",
      "trading_symbol": "RELIANCE",
      "exchange": "NSE",
      "transaction_type": "BUY",
      "order_type": "MARKET",
      "quantity": 1,
      "product": "CNC"
    }
  }'
```

## 🔒 Security Features

- **Rate Limiting**: 60 requests per minute per IP
- **Session Isolation**: Each session has isolated broker instances
- **Credential Protection**: Sensitive data is sanitized in logs
- **Error Sanitization**: Detailed errors only in debug mode

## 📊 Monitoring

### View Logs
```bash
npm run logs
```

### Analytics
The worker automatically tracks:
- Request success/failure rates
- Tool usage statistics
- Error categorization
- Session activity

## 🎯 Free Tier Limits

The implementation is optimized for Cloudflare's free tier:

- **Requests**: 100,000 per day
- **KV Operations**: 100,000 reads, 1,000 writes per day
- **CPU Time**: 10ms per request
- **Memory**: 128MB
- **Workers**: 100 total

## 🛠️ Development

### Local Development
```bash
npm run dev
```

### Deployment
```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## 📋 Available MCP Tools

1. **authenticate_broker** - Authenticate with trading broker
2. **get_portfolio** - Retrieve portfolio holdings
3. **get_positions** - Get current positions
4. **create_order** - Place new orders
5. **get_orders** - List all orders
6. **modify_order** - Modify existing orders
7. **cancel_order** - Cancel orders
8. **get_quote** - Get real-time quotes
9. **get_margins** - Check available margins
10. **get_session_info** - Session information
11. **set_active_broker** - Set active broker

## 🐛 Troubleshooting

### Common Issues

1. **KV Namespace Error**
   - Ensure KV namespace is created and ID is correct in wrangler.toml

2. **Rate Limit Exceeded**
   - Worker implements 60 requests/minute limit
   - Wait or contact support for higher limits

3. **Authentication Errors**
   - Verify broker API credentials are correct
   - Check if broker platform is operational

4. **Session Expired**
   - Sessions expire after 1 hour of inactivity
   - Create a new session

### Debug Mode
Set `DEBUG_MODE = "true"` in environment variables for detailed error messages.

## 📞 Support

For issues specific to:
- **Kite API**: [Kite Connect Documentation](https://kite.trade/docs/connect/)
- **Groww API**: [Groww Trade API](https://groww.in/trade-api/docs/)
- **Dhan API**: [Dhan API Documentation](https://api.dhan.co/)
- **Cloudflare Workers**: [Workers Documentation](https://developers.cloudflare.com/workers/)

## 📄 License

MIT License - see LICENSE file for details.
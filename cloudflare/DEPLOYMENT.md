# 🚀 Cloudflare Worker Deployment Guide

This guide will help you deploy the TurtleStack MCP Server to Cloudflare Workers with zero 500 errors.

## 📋 Pre-Deployment Checklist

### 1. Cloudflare Account Setup
- [ ] Create account at [cloudflare.com](https://cloudflare.com)
- [ ] Verify email and complete account setup
- [ ] Note your account ID from the dashboard

### 2. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 3. Verify Project Structure
Ensure you have these files in the `cloudflare/` directory:
- [ ] `wrangler.toml`
- [ ] `worker.js`
- [ ] `package.json`
- [ ] `lib/` directory with all modules

## 🔧 Step-by-Step Deployment

### Step 1: Create KV Namespace
```bash
cd cloudflare/
wrangler kv:namespace create SESSIONS_KV
```

**Copy the output ID** and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "paste-your-kv-namespace-id-here"
```

### Step 2: Create Preview Namespace (for testing)
```bash
wrangler kv:namespace create SESSIONS_KV --preview
```

Add the preview ID to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "your-production-id"
preview_id = "your-preview-id"
```

### Step 3: Deploy to Staging
```bash
npm install
wrangler deploy --env staging
```

### Step 4: Test Deployment
```bash
# Test health endpoint
curl https://turtlestack-mcp-server-staging.your-subdomain.workers.dev/health

# Should return:
# {"status":"healthy","timestamp":"...","version":"2.0.0"}
```

### Step 5: Deploy to Production
```bash
wrangler deploy --env production
```

## 🔐 Environment Variables (Optional)

Set sensitive data via Cloudflare Dashboard or CLI:

```bash
# Via CLI
wrangler secret put KITE_API_KEY --env production
wrangler secret put KITE_API_SECRET --env production

# Or via Cloudflare Dashboard:
# Workers > your-worker > Settings > Environment Variables
```

## 🧪 Testing Your Deployment

### 1. Basic Health Check
```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

### 2. Create Session
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/session/create
```

### 3. List Available Tools
```bash
curl https://your-worker.your-subdomain.workers.dev/mcp/tools
```

### 4. Test Authentication
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp/call \
  -H "X-Session-ID: your-session-id" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "authenticate_broker",
    "arguments": {
      "broker": "kite",
      "credentials": {
        "api_key": "your_api_key",
        "access_token": "your_access_token"
      }
    }
  }'
```

## 📊 Monitoring and Maintenance

### View Real-time Logs
```bash
wrangler tail --env production
```

### Check Analytics
Visit Cloudflare Dashboard > Workers > your-worker > Analytics

### Monitor KV Usage
Dashboard > Workers > KV > SESSIONS_KV > Metrics

## ⚠️ Free Tier Optimization

The worker is optimized for Cloudflare's free tier:

| Resource | Free Limit | Our Usage |
|----------|------------|-----------|
| Requests/day | 100,000 | ~5,000-10,000 typical |
| KV Reads/day | 100,000 | ~200-500 per session |
| KV Writes/day | 1,000 | ~10-20 per session |
| CPU time | 10ms | ~5-8ms average |
| Memory | 128MB | ~20-40MB usage |

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "namespace not found" Error
```bash
# Create KV namespace
wrangler kv:namespace create SESSIONS_KV
# Update wrangler.toml with the returned ID
```

#### 2. "exceeded CPU time limit"
- The worker is optimized for <10ms execution
- Check for infinite loops or heavy computations
- Consider caching frequently accessed data

#### 3. "Rate limit exceeded"
```bash
# Check current rate limits
curl -H "X-Session-ID: test" https://your-worker.workers.dev/health
```

#### 4. Authentication Errors
- Verify broker API credentials
- Check if broker's platform is operational
- Ensure session hasn't expired (1-hour timeout)

#### 5. CORS Issues
- Worker includes comprehensive CORS headers
- For custom domains, update CORS origin settings

### Debug Mode
Set environment variable in Cloudflare Dashboard:
```
DEBUG_MODE = "true"
```

This will:
- Show detailed error messages
- Include stack traces in responses
- Log additional debugging information

## 🚀 Advanced Configuration

### Custom Domain Setup
1. Add domain to Cloudflare
2. Workers > your-worker > Triggers > Custom Domains
3. Add your domain

### Analytics Engine Setup
```bash
wrangler analytics-engine create mcp_analytics
```

Update `wrangler.toml`:
```toml
[analytics_engine_datasets]
[[analytics_engine_datasets.bindings]]
name = "ANALYTICS"
dataset = "mcp_analytics"
```

### Durable Objects (Future Enhancement)
For real-time session management:
```bash
wrangler deploy --with-durable-objects
```

## 📈 Performance Optimization

### Best Practices Implemented

1. **Session Management**: KV storage with TTL
2. **Error Handling**: Comprehensive error categorization
3. **Rate Limiting**: Per-IP request limiting
4. **Caching**: Efficient session data caching
5. **Logging**: Structured logging for debugging

### Performance Metrics to Monitor

- **Response Time**: Should be <200ms
- **Success Rate**: Target >99.9%
- **KV Operations**: Monitor read/write ratio
- **Memory Usage**: Should stay <50MB
- **CPU Time**: Target <8ms average

## 🆘 Emergency Procedures

### Rollback Deployment
```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

### Disable Worker Temporarily
```bash
# Stop routing traffic
wrangler route delete [route-id]
```

### Clear All Sessions
```bash
# Clear KV namespace (nuclear option)
wrangler kv:bulk delete --namespace-id your-kv-id
```

## 📞 Support Resources

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **KV Storage Docs**: https://developers.cloudflare.com/workers/runtime-apis/kv/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community Discord**: https://discord.cloudflare.com

## ✅ Post-Deployment Verification

After successful deployment, verify:

- [ ] Health endpoint returns 200
- [ ] Session creation works
- [ ] Tools listing returns expected tools
- [ ] Authentication with broker succeeds
- [ ] Order placement works (test with small quantity)
- [ ] Portfolio retrieval functions
- [ ] Error handling graceful (test with invalid data)
- [ ] Rate limiting active
- [ ] Logs are clean (no unexpected errors)

## 🎯 Success Metrics

Your deployment is successful when:

- ✅ All endpoints respond within 200ms
- ✅ Zero 500 errors in the first 24 hours
- ✅ Session management working correctly
- ✅ All broker integrations functional
- ✅ Rate limiting preventing abuse
- ✅ Analytics showing healthy metrics

## 🔄 Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor success rates
- [ ] Verify KV usage within limits

### Weekly
- [ ] Review analytics data
- [ ] Check for new Wrangler updates
- [ ] Test backup/restore procedures

### Monthly
- [ ] Security review
- [ ] Performance optimization
- [ ] Cost analysis and optimization

---

**🎉 Congratulations!** Your TurtleStack MCP Server is now running on Cloudflare Workers with enterprise-grade reliability and performance!
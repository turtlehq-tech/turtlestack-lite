#!/bin/bash

# Navigate to the cloudflare directory
cd "$(dirname "$0")"

echo "🚀 Deploying TurtleStack MCP Server to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it with: npm install -g wrangler"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to production
echo "🚀 Deploying to production (turtle-stack-free)..."
wrangler deploy

# Test deployment
echo "🧪 Testing deployment..."
sleep 2
curl -s "https://YOUR_WORKER_SUBDOMAIN.YOUR_USERNAME.workers.dev/health" | jq '.'

echo "✅ Deployment complete! Your worker is available at:"
echo "🌐 https://YOUR_WORKER_SUBDOMAIN.YOUR_USERNAME.workers.dev"
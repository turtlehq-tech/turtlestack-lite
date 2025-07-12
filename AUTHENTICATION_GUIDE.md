# 🔐 Authentication Guide for Unified Trading Server

## ✅ **Issues Fixed**

The authentication and session persistence issues have been resolved:

- ✅ **Groww authentication now accepts `access_token`**
- ✅ **Session persistence fixed** (no more session ID changes)
- ✅ **Connection stability improved**
- ✅ **Authentication state properly maintained**

## 🚀 **How to Authenticate with Claude**

### **1. Connect to Claude**

Configure Claude Desktop with this MCP server:

```json
{
  "mcpServers": {
    "unified-trading-server": {
      "command": "node",
      "args": ["/Users/shubham/Desktop/my-kite-mcp-server/src/index.js"]
    }
  }
}
```

### **2. Available Brokers**

Ask Claude: `"List available brokers"`

You'll see:
- **kite** (Zerodha) - Not authenticated
- **groww** - Not authenticated  
- **dhan** - Not authenticated

### **3. Authenticate with Groww**

Use your JWT access token:

```
"Authenticate groww with access_token: YOUR_TOKEN_HERE"
```

**Get your token from Groww web app:**
```
YOUR_GROWW_JWT_TOKEN_HERE
```

### **4. Set Active Broker**

```
"Set groww as active broker"
```

### **5. Verify Authentication**

```
"List brokers"
"Show session info"
```

You should see:
- ✅ **groww** - Authenticated ✅ Active

## 📊 **What You Can Do Now**

### **Portfolio Management:**
```
"Show my portfolio"
"Get my positions"  
"Get my margins"
```

### **Market Data:**
```
"Get quote for RELIANCE,INFY,TCS"
```

### **Technical Analysis:**
```
"Get RSI for RELIANCE"
"Get MACD for INFY"
"Get Bollinger Bands for HDFC"
"Get technical indicators RSI,MACD,BOLLINGER for TCS"
```

### **Trading (if supported by your token permissions):**
```
"Create buy order for RELIANCE 1 share at market price"
"Show my order history"
```

## 🔧 **Authentication Parameters by Broker**

### **Kite (Zerodha)**
```
"Authenticate kite with api_key: YOUR_API_KEY and access_token: YOUR_ACCESS_TOKEN"
```
OR
```
"Authenticate kite with api_key: YOUR_API_KEY, api_secret: YOUR_SECRET, and request_token: YOUR_REQUEST_TOKEN"
```

### **Groww** ✅ 
```
"Authenticate groww with access_token: YOUR_JWT_TOKEN"
```

### **Dhan**
```
"Authenticate dhan with access_token: YOUR_ACCESS_TOKEN and client_id: YOUR_CLIENT_ID"
```

## 🛠️ **Troubleshooting**

### **If Authentication Fails:**

1. **Check Token Format**: Ensure you're using the complete JWT token
2. **Check Expiry**: Your token expires on `2025-04-26` (timestamp: 1750984200)
3. **Check Permissions**: Your token has: `order-basic`, `live_data-basic`, `non_trading-basic`, `order_read_only-basic`

### **If Session Doesn't Persist:**

1. **Restart Claude Desktop** - This reloads the MCP connection
2. **Check Server Status** - Make sure the server is running
3. **Verify Configuration** - Ensure Claude config points to correct path

### **Common Commands:**
```
"List brokers"                    # See authentication status
"Show session info"               # Check your session details
"Logout from groww"              # Logout specific broker
"Logout from all brokers"        # Clear all authentication
```

## ✅ **Success Indicators**

When everything works correctly:

1. **Authentication Response**: "Groww access token set successfully!"
2. **Broker List**: Shows "groww" as ✅ Authenticated ✅ Active
3. **Session Info**: Shows your session ID and authenticated brokers
4. **Portfolio Access**: Can fetch portfolio, positions, quotes

## 🎯 **Your Token Details**

- **Broker**: Groww
- **User ID**: eb11b9e8-1f09-43e3-a0ed-51bccea3aa8  
- **Device ID**: 5ac32e03-8bb7-5a62-9d9f-879b0dfe5b05
- **Session ID**: 00fd373c-62ac-4057-b359-e56eb48894a3
- **Expires**: April 26, 2025
- **Permissions**: Basic trading, live data, non-trading operations

You're all set to start trading! 🚀
# 📈 Complete Kite Order Types Guide

## 🎯 **All Kite Connect Order Types Now Supported!**

The unified trading server now supports **ALL** Kite Connect order types and varieties as documented at https://kite.trade/docs/connect/v3/orders/

---

## 🛍️ **Order Types**

### 1. **MARKET Orders**
Execute immediately at current market price.

```bash
"Create MARKET order for RELIANCE 1 share BUY CNC on NSE"
```

**MCP Call:**
```json
{
  "trading_symbol": "RELIANCE",
  "exchange": "NSE", 
  "transaction_type": "BUY",
  "order_type": "MARKET",
  "quantity": 1,
  "product": "CNC"
}
```

### 2. **LIMIT Orders**
Execute at specified price or better.

```bash
"Create LIMIT order for INFY 5 shares BUY MIS at price 1500 on NSE"
```

**MCP Call:**
```json
{
  "trading_symbol": "INFY",
  "exchange": "NSE",
  "transaction_type": "BUY", 
  "order_type": "LIMIT",
  "quantity": 5,
  "product": "MIS",
  "price": 1500.50
}
```

### 3. **Stop Loss (SL) Orders**
Limit order triggered when price hits trigger price.

```bash
"Create SL order for TCS 2 shares SELL CNC with trigger 3150 and price 3200 on NSE"
```

**MCP Call:**
```json
{
  "trading_symbol": "TCS",
  "exchange": "NSE",
  "transaction_type": "SELL",
  "order_type": "SL", 
  "quantity": 2,
  "product": "CNC",
  "trigger_price": 3150.00,
  "price": 3200.00
}
```

### 4. **Stop Loss Market (SL-M) Orders**
Market order triggered when price hits trigger price.

```bash
"Create SL-M order for HDFC 1 share SELL MIS with trigger 1600 on NSE"
```

**MCP Call:**
```json
{
  "trading_symbol": "HDFC",
  "exchange": "NSE",
  "transaction_type": "SELL",
  "order_type": "SL-M",
  "quantity": 1, 
  "product": "MIS",
  "trigger_price": 1600.00
}
```

---

## 🎭 **Order Varieties**

### 1. **Regular Orders** (Default)
Standard orders placed during market hours.

```bash
"Create regular LIMIT order for RELIANCE 1 share BUY CNC at 2500 on NSE"
```

### 2. **After Market Orders (AMO)**
Orders placed after market hours for next day execution.

```bash
"Place AMO for RELIANCE 1 share BUY CNC LIMIT at 2500 on NSE"
```

**MCP Call:**
```json
{
  "trading_symbol": "RELIANCE",
  "exchange": "NSE",
  "transaction_type": "BUY",
  "order_type": "LIMIT", 
  "quantity": 1,
  "product": "CNC",
  "price": 2500.00,
  "amo": true
}
```

### 3. **Cover Orders (CO)**
Intraday orders with compulsory stop loss.

```bash
"Place cover order for INFY 10 shares BUY MARKET with stoploss 1450"
```

**MCP Call:**
```json
{
  "trading_symbol": "INFY",
  "exchange": "NSE", 
  "transaction_type": "BUY",
  "order_type": "MARKET",
  "quantity": 10,
  "stoploss": 1450.00
}
```

### 4. **Bracket Orders (BO)**
Orders with both stop loss and target price.

```bash
"Place bracket order for TCS 1 share BUY at 3300 with stoploss 3250 and target 3350"
```

**MCP Call:**
```json
{
  "trading_symbol": "TCS",
  "exchange": "NSE",
  "transaction_type": "BUY", 
  "quantity": 1,
  "price": 3300.00,
  "stoploss": 3250.00,
  "squareoff": 3350.00
}
```

### 5. **Iceberg Orders**
Large orders split into smaller disclosed quantities.

```bash
"Place iceberg order for HDFC 100 shares BUY LIMIT at 1650 with disclosed quantity 10"
```

**MCP Call:**
```json
{
  "trading_symbol": "HDFC",
  "exchange": "NSE",
  "transaction_type": "BUY",
  "order_type": "LIMIT",
  "quantity": 100,
  "disclosed_quantity": 10,
  "price": 1650.00,
  "product": "CNC"
}
```

---

## 🏷️ **Product Types**

- **CNC**: Cash and Carry (delivery)
- **MIS**: Margin Intraday Square-off  
- **NRML**: Normal (overnight positions)
- **CO**: Cover Order (auto-assigned)
- **BO**: Bracket Order (auto-assigned)

---

## 🏦 **Supported Exchanges**

- **NSE**: National Stock Exchange
- **BSE**: Bombay Stock Exchange  
- **NFO**: NSE Futures & Options
- **CDS**: Currency Derivatives Segment
- **MCX**: Multi Commodity Exchange

---

## ⏰ **Validity Options**

- **DAY**: Valid for the day (default)
- **IOC**: Immediate or Cancel
- **TTL**: Till Triggered (for stop loss orders)

---

## 🎮 **Advanced Features**

### **Order Tags**
Add custom tags for tracking:
```json
{
  "tag": "portfolio_rebalance_2024"
}
```

### **Trailing Stop Loss**
For Cover Orders:
```json
{
  "trailing_stoploss": 5.00
}
```

### **Auction Orders**
For auction sessions:
```json
{
  "auction_number": "AUC230101"
}
```

---

## 🛠️ **Order Management**

### **Modify Orders**
```bash
"Modify order 240626000012345 change quantity to 5 and price to 1550"
```

**MCP Call:**
```json
{
  "order_id": "240626000012345",
  "variety": "regular",
  "quantity": 5,
  "price": 1550.00
}
```

### **Cancel Orders** 
```bash
"Cancel order 240626000012345 variety regular"
```

**MCP Call:**
```json
{
  "order_id": "240626000012345", 
  "variety": "regular"
}
```

---

## 📊 **Get Order Information**

### **Order Types Info**
```bash
"Get order types information for kite broker"
```

### **Order History**
```bash
"Get orders from kite broker"
```

---

## ✅ **Validation Features**

- ✅ **Required parameter validation**
- ✅ **Order type specific validation**  
- ✅ **Product compatibility checks**
- ✅ **Automatic variety detection**
- ✅ **Enhanced error messages**

---

## 🎯 **Quick Examples**

### **Simple Market Buy**
```bash
"Buy 1 RELIANCE at market price for delivery"
```

### **Stop Loss Protection**
```bash  
"Sell 5 INFY shares with stop loss at 1450 and limit at 1500"
```

### **After Hours Trading**
```bash
"Place AMO to buy 10 TCS shares at 3300 tomorrow"
```

### **Risk-Managed Intraday**
```bash
"Place cover order: buy 20 HDFC at market with stop loss 1600"
```

### **Large Order Execution**
```bash
"Place iceberg order: buy 1000 RELIANCE at 2500, show only 50 shares"
```

---

## 🎉 **Success! All Kite Order Types Supported**

Your unified trading server now supports the complete Kite Connect order ecosystem:

- **4 Order Types**: MARKET, LIMIT, SL, SL-M
- **5 Order Varieties**: regular, amo, co, bo, iceberg  
- **5 Product Types**: CNC, MIS, NRML, CO, BO
- **5 Exchanges**: NSE, BSE, NFO, CDS, MCX
- **3 Validity Options**: DAY, IOC, TTL

**Start trading with confidence using any order type that suits your strategy!** 🚀
# 🌱 Complete Groww Order Types Guide

## 🎯 **All Groww Trading API Order Types Now Supported!**

The unified trading server now supports **ALL** Groww trading API order types and varieties as documented at https://groww.in/trade-api/docs/curl/orders

---

## 🛍️ **Order Types**

### 1. **MARKET Orders**
Execute immediately at current market price.

```bash
"Create MARKET order for RELIANCE 1 share BUY DELIVERY on NSE CASH segment"
```

**MCP Call:**
```json
{
  "trading_symbol": "RELIANCE",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "MARKET",
  "quantity": 1,
  "product": "DELIVERY"
}
```

### 2. **LIMIT Orders**
Execute at specified price or better.

```bash
"Create LIMIT order for INFY 5 shares BUY INTRADAY at price 1500 on NSE CASH"
```

**MCP Call:**
```json
{
  "trading_symbol": "INFY",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "LIMIT",
  "quantity": 5,
  "product": "INTRADAY",
  "price": 1500.50
}
```

### 3. **Stop Loss (SL) Orders**
Limit order triggered when price hits trigger price.

```bash
"Create SL order for TCS 2 shares SELL DELIVERY with trigger 3150 and price 3200 on NSE CASH"
```

**MCP Call:**
```json
{
  "trading_symbol": "TCS",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "SELL",
  "order_type": "SL",
  "quantity": 2,
  "product": "DELIVERY",
  "trigger_price": 3150.00,
  "price": 3200.00
}
```

### 4. **Stop Loss Market (SL-M) Orders**
Market order triggered when price hits trigger price.

```bash
"Create SL-M order for HDFC 1 share SELL INTRADAY with trigger 1600 on NSE CASH"
```

**MCP Call:**
```json
{
  "trading_symbol": "HDFC",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "SELL",
  "order_type": "SL-M",
  "quantity": 1,
  "product": "INTRADAY",
  "trigger_price": 1600.00
}
```

---

## 🎭 **Order Varieties**

### 1. **Regular Orders** (Default)
Standard orders placed during market hours.

```bash
"Create regular LIMIT order for RELIANCE 1 share BUY DELIVERY at 2500 on NSE CASH"
```

### 2. **After Market Orders (AMO)**
Orders placed after market hours for next day execution.

```bash
"Place AMO for RELIANCE 1 share BUY DELIVERY LIMIT at 2500 on NSE CASH"
```

**MCP Call:**
```json
{
  "trading_symbol": "RELIANCE",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "LIMIT",
  "quantity": 1,
  "product": "DELIVERY",
  "price": 2500.00,
  "amo": true
}
```

### 3. **Good Till Date (GTD) Orders**
Orders valid until specified date.

```bash
"Place Groww GTD order for INFY 1 share BUY DELIVERY LIMIT at 1500 valid till 2024-12-31"
```

**MCP Call:**
```json
{
  "broker": "groww",
  "trading_symbol": "INFY",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "LIMIT",
  "quantity": 1,
  "product": "DELIVERY",
  "price": 1500.00,
  "validity_date": "2024-12-31"
}
```

### 4. **Iceberg Orders**
Large orders split into smaller disclosed quantities.

```bash
"Place iceberg order for TCS 100 shares BUY LIMIT at 3300 with disclosed quantity 10"
```

**MCP Call:**
```json
{
  "trading_symbol": "TCS",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "LIMIT",
  "quantity": 100,
  "disclosed_quantity": 10,
  "price": 3300.00,
  "product": "DELIVERY"
}
```

### 5. **Bracket Orders**
Orders with both stop loss and target price.

```bash
"Place Groww bracket order for HDFC 1 share BUY at 1650 with stop loss 1600 and target 1700"
```

**MCP Call:**
```json
{
  "broker": "groww",
  "trading_symbol": "HDFC",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "quantity": 1,
  "price": 1650.00,
  "stop_loss": 1600.00,
  "target": 1700.00
}
```

### 6. **Cover Orders**
Orders with mandatory stop loss.

```bash
"Place Groww cover order for RELIANCE 10 shares BUY MARKET with stop loss 2450"
```

**MCP Call:**
```json
{
  "broker": "groww",
  "trading_symbol": "RELIANCE",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "MARKET",
  "quantity": 10,
  "stop_loss": 2450.00
}
```

---

## 🏷️ **Product Types**

- **DELIVERY**: Cash and Carry (delivery)
- **INTRADAY**: Margin Intraday Square-off
- **MTF**: Margin Trading Facility
- **NORMAL**: Normal (overnight positions)
- **CO**: Cover Order (auto-assigned)
- **BO**: Bracket Order (auto-assigned)

---

## 🏦 **Market Segments**

- **CASH**: Cash/Equity segment
- **FNO**: Futures and Options
- **COMM**: Commodity
- **CURRENCY**: Currency derivatives

---

## 🏪 **Supported Exchanges**

- **NSE**: National Stock Exchange
- **BSE**: Bombay Stock Exchange
- **NFO**: NSE Futures & Options
- **MCX**: Multi Commodity Exchange

---

## ⏰ **Validity Options**

- **DAY**: Valid for the day (default)
- **IOC**: Immediate or Cancel
- **GTD**: Good Till Date (requires validity_date)
- **GTC**: Good Till Cancelled

---

## 🎮 **Advanced Groww Features**

### **Order Reference IDs**
Add custom tracking IDs:
```json
{
  "order_reference_id": "my_portfolio_rebalance_001"
}
```

### **Disclosed Quantity**
For iceberg orders:
```json
{
  "disclosed_quantity": 10,
  "quantity": 100
}
```

### **Validity Dates**
For GTD orders:
```json
{
  "validity": "GTD",
  "validity_date": "2024-12-31"
}
```

### **After Market Orders**
Place orders after market hours:
```json
{
  "amo": true
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
  "quantity": 5,
  "price": 1550.00,
  "disclosed_quantity": 15
}
```

### **Cancel Orders**
```bash
"Cancel order 240626000012345"
```

**MCP Call:**
```json
{
  "order_id": "240626000012345"
}
```

---

## 📊 **Get Order Information**

### **Order Types Info**
```bash
"Get order types information for groww broker"
```

### **Order History**
```bash
"Get orders from groww broker"
```

---

## 💰 **Margin Management**

### **Get Available Margin**
Check your available trading margin:
```bash
"Get margins from groww broker"
```

**API Endpoint**: `GET /v1/margins/detail/user`

### **Calculate Order Margin**
Calculate required margin for a specific order:
```bash
"Calculate order margin for RELIANCE 1 share BUY DELIVERY MARKET on NSE CASH"
```

**MCP Call:**
```json
{
  "broker": "groww",
  "trading_symbol": "RELIANCE",
  "exchange": "NSE",
  "segment": "CASH",
  "transaction_type": "BUY",
  "order_type": "MARKET",
  "quantity": 1,
  "product": "DELIVERY"
}
```

### **Bulk Margin Calculation**
Calculate margin for multiple orders at once:
```bash
"Get margin for multiple orders on groww"
```

**MCP Call:**
```json
{
  "broker": "groww",
  "orders": [
    {
      "tradingSymbol": "RELIANCE",
      "transactionType": "BUY",
      "quantity": 1,
      "orderType": "MARKET",
      "productType": "DELIVERY"
    },
    {
      "tradingSymbol": "INFY",
      "transactionType": "BUY",
      "quantity": 5,
      "orderType": "LIMIT",
      "productType": "INTRADAY",
      "price": 1500.50
    }
  ],
  "segment": "CASH"
}
```

**API Endpoint**: `POST /v1/margins/detail/orders`

---

## ✅ **Validation Features**

- ✅ **Required parameter validation**
- ✅ **Order type specific validation**
- ✅ **Segment requirement validation**
- ✅ **Product compatibility checks**
- ✅ **Automatic variety detection**
- ✅ **Enhanced error messages**
- ✅ **GTD date validation**
- ✅ **Iceberg quantity validation**

---

## 🎯 **Quick Examples**

### **Simple Market Buy**
```bash
"Buy 1 RELIANCE at market price for delivery on NSE cash segment"
```

### **Stop Loss Protection**
```bash
"Sell 5 INFY shares with stop loss at 1450 and limit at 1500 on cash segment"
```

### **After Hours Trading**
```bash
"Place AMO to buy 10 TCS shares at 3300 tomorrow on cash segment"
```

### **Time-Limited Order**
```bash
"Place GTD order: buy 5 HDFC at 1650 valid until 2024-12-31"
```

### **Large Order Execution**
```bash
"Place iceberg order: buy 1000 RELIANCE at 2500, show only 50 shares"
```

### **Risk-Managed Trading**
```bash
"Place bracket order: buy 10 INFY at 1500 with stop 1450 and target 1550"
```

---

## 🔧 **Groww-Specific MCP Tools**

### **Specialized Groww Tools**
- `place_groww_gtd_order` - Good Till Date orders
- `place_groww_bracket_order` - Bracket orders with SL & target
- `place_groww_cover_order` - Cover orders with mandatory SL

### **Universal Tools (Support Groww)**
- `create_order` - All order types with auto-detection
- `place_amo` - After Market Orders
- `place_iceberg_order` - Large order splitting
- `modify_order` - Order modifications
- `cancel_order` - Order cancellations
- `get_order_types_info` - Complete order documentation
- `get_margins` - Available account margin

### **Groww Margin Tools**
- `calculate_order_margin` - Calculate margin for single order
- `get_margin_for_orders` - Calculate margin for multiple orders

---

## 🎉 **Success! All Groww Order Types Supported**

Your unified trading server now supports the complete Groww trading ecosystem:

- **4 Order Types**: MARKET, LIMIT, SL, SL-M
- **6 Order Varieties**: regular, amo, gtd, iceberg, bracket, cover
- **6 Product Types**: DELIVERY, INTRADAY, MTF, NORMAL, CO, BO
- **4 Market Segments**: CASH, FNO, COMM, CURRENCY
- **4 Validity Options**: DAY, IOC, GTD, GTC

### **Groww-Unique Features**
- ✅ **Order Reference IDs** for custom tracking
- ✅ **Good Till Date (GTD)** orders with validity dates
- ✅ **Disclosed Quantity** for iceberg execution
- ✅ **Market Segment** requirement compliance
- ✅ **Enhanced bracket/cover orders** with risk management
- ✅ **Comprehensive Margin API** with single & bulk calculation
- ✅ **Real-time Margin Requirements** for order planning

**Start trading with the full power of Groww's trading API!** 🌱🚀
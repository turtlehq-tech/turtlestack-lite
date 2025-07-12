# 📊 Complete Kite/Zerodha Margin API Guide

## 🎯 **All Kite Connect Margin APIs Now Supported!**

The unified trading server now supports **ALL** Kite Connect margin calculation APIs as documented at https://kite.trade/docs/connect/v3/user/ and https://kite.trade/docs/connect/v3/margins/

---

## 💰 **Available Margin APIs**

### 1. **User Margins**
Get available cash and margin information for all segments.

```bash
"Get margins from kite broker"
```

**API Endpoint**: `GET /user/margins`

**MCP Call:**
```json
{
  "broker": "kite"
}
```

### 2. **Segment-Specific Margins**
Get detailed margin information for equity or commodity segments.

```bash
"Get equity segment margins from kite broker"
```

**API Endpoint**: `GET /user/margins/equity` or `/user/margins/commodity`

**MCP Call:**
```json
{
  "broker": "kite",
  "segment": "equity"
}
```

---

## 🧮 **Margin Calculation APIs**

### 3. **Order Margins**
Calculate required margins for multiple orders considering existing positions.

```bash
"Calculate Kite order margins for multiple orders"
```

**API Endpoint**: `POST /margins/orders`

**MCP Call:**
```json
{
  "broker": "kite",
  "orders": [
    {
      "exchange": "NSE",
      "tradingsymbol": "RELIANCE",
      "transaction_type": "BUY",
      "variety": "regular",
      "product": "CNC",
      "order_type": "MARKET",
      "quantity": 1
    },
    {
      "exchange": "NSE",
      "tradingsymbol": "INFY",
      "transaction_type": "BUY",
      "variety": "regular",
      "product": "MIS",
      "order_type": "LIMIT",
      "quantity": 5,
      "price": 1500.50
    }
  ]
}
```

### 4. **Basket Margins**
Calculate margins for spread orders and basket strategies.

```bash
"Calculate Kite basket margins with position consideration"
```

**API Endpoint**: `POST /margins/basket`

**MCP Call:**
```json
{
  "broker": "kite",
  "orders": [
    {
      "exchange": "NSE",
      "tradingsymbol": "RELIANCE",
      "transaction_type": "BUY",
      "variety": "regular",
      "product": "CNC",
      "order_type": "LIMIT",
      "quantity": 1,
      "price": 2500.00
    },
    {
      "exchange": "NSE",
      "tradingsymbol": "RELIANCE",
      "transaction_type": "SELL",
      "variety": "regular",
      "product": "CNC",
      "order_type": "LIMIT",
      "quantity": 1,
      "price": 2600.00
    }
  ],
  "consider_positions": true,
  "mode": "compact"
}
```

### 5. **Order Charges**
Get detailed charges breakdown for orders (virtual contract note).

```bash
"Calculate Kite order charges breakdown"
```

**API Endpoint**: `POST /charges/orders`

**MCP Call:**
```json
{
  "broker": "kite",
  "orders": [
    {
      "exchange": "NSE",
      "tradingsymbol": "RELIANCE",
      "transaction_type": "BUY",
      "variety": "regular",
      "product": "CNC",
      "order_type": "MARKET",
      "quantity": 1,
      "order_id": "240626000012345",
      "average_price": 2500.00
    }
  ]
}
```

---

## 🎛️ **Advanced Features**

### **Segment Support**
- **equity**: NSE/BSE equity markets
- **commodity**: MCX commodity markets

### **Position Consideration**
For basket margins, you can:
- `consider_positions: true` - Include existing positions in calculation
- `consider_positions: false` - Calculate margins without existing positions

### **Compact Mode**
For basket margins:
- `mode: "compact"` - Simplified response format
- `mode: null` - Full detailed response

### **All Order Parameters**
Support for all Kite order parameters:
- `exchange`, `tradingsymbol`, `transaction_type`
- `variety`, `product`, `order_type`, `quantity`
- `price`, `trigger_price` (when applicable)
- `order_id`, `average_price` (for charges calculation)

---

## 🛠️ **MCP Tools Available**

### **Universal Margin Tools**
- `get_margins` - Get account margins (supports segment parameter for Kite)

### **Kite-Specific Margin Tools**
- `calculate_kite_order_margins` - Calculate margins for multiple orders
- `calculate_kite_basket_margins` - Calculate basket/spread margins
- `calculate_kite_order_charges` - Get detailed charges breakdown

---

## 📋 **Order Parameter Format**

### **Required Parameters**
```json
{
  "exchange": "NSE|BSE|NFO|CDS|MCX",
  "tradingsymbol": "SYMBOL_NAME",
  "transaction_type": "BUY|SELL",
  "variety": "regular|amo|co|bo|iceberg",
  "product": "CNC|MIS|NRML|CO|BO",
  "order_type": "MARKET|LIMIT|SL|SL-M",
  "quantity": 123
}
```

### **Optional Parameters**
```json
{
  "price": 1500.50,
  "trigger_price": 1450.00,
  "order_id": "240626000012345",
  "average_price": 1525.75
}
```

---

## 🎯 **Quick Examples**

### **Check Available Margin**
```bash
"Get margins from kite broker"
"Get equity segment margins from kite"
"Get commodity segment margins from kite"
```

### **Single Order Margin**
```bash
"Calculate Kite order margins for RELIANCE 1 share BUY CNC MARKET"
```

### **Multiple Orders Margin**
```bash
"Calculate Kite order margins for portfolio of 3 stocks"
```

### **Spread Strategy Margin**
```bash
"Calculate Kite basket margins for RELIANCE buy-sell spread"
```

### **Order Charges Breakdown**
```bash
"Calculate Kite order charges for executed trades"
```

---

## 📊 **Response Data**

### **User Margins Response**
- Net cash balance
- Available cash
- Opening balance
- Utilized margins (SPAN, exposure, etc.)
- Segment-wise breakdown

### **Order Margins Response**
- Required margin for each order
- SPAN margins
- Exposure margins
- Premium required
- Total margin requirement

### **Basket Margins Response**
- Combined margin for all orders
- Margin benefit from hedging
- Net margin requirement
- Individual order margins

### **Order Charges Response**
- Brokerage charges
- STT (Securities Transaction Tax)
- Exchange charges
- GST
- SEBI charges
- Total charges breakdown

---

## ✅ **Validation Features**

- ✅ **Complete parameter validation**
- ✅ **Order type compatibility checks**
- ✅ **Segment validation** (equity/commodity)
- ✅ **Variety support** for all order types
- ✅ **Price validation** for LIMIT/SL orders
- ✅ **Enhanced error messages**
- ✅ **Session isolation** for multi-user support

---

## 🔧 **Integration Examples**

### **Portfolio Planning**
```bash
"Calculate margins needed for buying 10 different stocks"
```

### **Risk Management**
```bash
"Check available margin before placing large order"
```

### **Strategy Analysis**
```bash
"Calculate basket margins for pairs trading strategy"
```

### **Cost Analysis**
```bash
"Get detailed charges breakdown for day trading plan"
```

---

## 🎉 **Success! Complete Kite Margin API Support**

Your unified trading server now supports the complete Kite Connect margin ecosystem:

### **📊 Margin Information**
- ✅ **User Margins** - Available cash and margins
- ✅ **Segment Margins** - Equity and commodity specific
- ✅ **Real-time Data** - Current margin status

### **🧮 Margin Calculations**
- ✅ **Order Margins** - Required margins for orders
- ✅ **Basket Margins** - Spread and strategy margins
- ✅ **Position Aware** - Considers existing positions
- ✅ **Compact Mode** - Simplified responses

### **💳 Charges Calculation**
- ✅ **Order Charges** - Detailed cost breakdown
- ✅ **All Fees Included** - Brokerage, taxes, charges
- ✅ **Virtual Contract** - Pre-execution estimates

### **🎯 Advanced Features**
- ✅ **All Order Types** - MARKET, LIMIT, SL, SL-M
- ✅ **All Varieties** - regular, amo, co, bo, iceberg
- ✅ **All Products** - CNC, MIS, NRML, CO, BO
- ✅ **Multi-Exchange** - NSE, BSE, NFO, CDS, MCX

**Start trading with complete margin visibility and cost transparency!** 📊🚀
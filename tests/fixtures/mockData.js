// tests/fixtures/mockData.js
// Mock data for testing brokers and technical indicators

export const mockHistoricalData = [
  { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 10000 },
  { date: '2024-01-02', open: 103, high: 107, low: 101, close: 105, volume: 12000 },
  { date: '2024-01-03', open: 105, high: 108, low: 103, close: 107, volume: 11000 },
  { date: '2024-01-04', open: 107, high: 110, low: 105, close: 109, volume: 13000 },
  { date: '2024-01-05', open: 109, high: 112, low: 107, close: 111, volume: 14000 },
  { date: '2024-01-06', open: 111, high: 114, low: 109, close: 113, volume: 15000 },
  { date: '2024-01-07', open: 113, high: 116, low: 111, close: 115, volume: 16000 },
  { date: '2024-01-08', open: 115, high: 118, low: 113, close: 117, volume: 17000 },
  { date: '2024-01-09', open: 117, high: 120, low: 115, close: 119, volume: 18000 },
  { date: '2024-01-10', open: 119, high: 122, low: 117, close: 121, volume: 19000 }
];

export const mockPortfolioData = {
  kite: {
    broker: 'Kite',
    data: [
      {
        instrument: 'RELIANCE',
        quantity: 100,
        average_price: 2500,
        last_price: 2600,
        pnl: 10000,
        day_change: 50,
        day_change_percentage: 2.0,
        current_value: 260000,
        invested_value: 250000
      },
      {
        instrument: 'INFY',
        quantity: 50,
        average_price: 1800,
        last_price: 1850,
        pnl: 2500,
        day_change: 25,
        day_change_percentage: 1.37,
        current_value: 92500,
        invested_value: 90000
      }
    ]
  },
  groww: {
    broker: 'Groww',
    data: [
      {
        symbol: 'HDFC',
        quantity: 75,
        avgPrice: 1600,
        ltp: 1650,
        pnl: 3750,
        dayChange: 30,
        dayChangePercentage: 1.85
      }
    ]
  },
  dhan: {
    broker: 'Dhan',
    data: [
      {
        securityId: 'TCS',
        quantity: 25,
        avgPrice: 3200,
        ltp: 3300,
        pnl: 2500,
        dayChange: 50,
        dayChangePercentage: 1.54
      }
    ]
  }
};

export const mockOrderData = {
  kite: {
    broker: 'Kite',
    order_id: 'KT123456',
    status: 'success',
    data: {
      tradingsymbol: 'RELIANCE',
      exchange: 'NSE',
      transaction_type: 'BUY',
      order_type: 'LIMIT',
      quantity: 10,
      product: 'CNC',
      price: 2550
    }
  },
  groww: {
    broker: 'Groww',
    order_id: 'GW789012',
    status: 'success',
    data: {
      tradingSymbol: 'INFY',
      exchange: 'NSE',
      transactionType: 'BUY',
      orderType: 'MARKET',
      quantity: 5,
      productType: 'DELIVERY'
    }
  }
};

export const mockTechnicalIndicatorData = {
  rsi: [45.23, 48.67, 52.34, 55.89, 58.12, 61.45, 64.78, 67.23, 69.56, 71.89],
  macd: {
    macdLine: [1.23, 1.45, 1.67, 1.89, 2.12, 2.34, 2.56, 2.78, 3.01, 3.23],
    signalLine: [1.12, 1.34, 1.56, 1.78, 2.01, 2.23, 2.45, 2.67, 2.89, 3.12],
    histogram: [0.11, 0.11, 0.11, 0.11, 0.11, 0.11, 0.11, 0.11, 0.12, 0.11]
  },
  bollingerBands: {
    upperBand: [125.67, 126.78, 127.89, 128.90, 129.12],
    middleBand: [119.50, 120.25, 121.00, 121.75, 122.50],
    lowerBand: [113.33, 113.72, 114.11, 114.60, 115.88]
  },
  vwap: [102.45, 104.67, 106.89, 109.12, 111.34, 113.56, 115.78, 118.01, 120.23, 122.45]
};

export const mockBrokerCredentials = {
  kite: {
    api_key: 'test_kite_api_key',
    access_token: 'test_kite_access_token'
  },
  groww: {
    api_key: 'test_groww_api_key'
  },
  dhan: {
    access_token: 'test_dhan_access_token',
    client_id: 'test_dhan_client_id'
  }
};

export const mockMarginData = {
  kite: {
    broker: 'Kite',
    data: {
      available: {
        adhoc_margin: 0,
        cash: 50000,
        collateral: 0,
        intraday_payin: 0,
        live_balance: 50000
      },
      utilised: {
        debits: 25000,
        exposure: 15000,
        m2m_realised: 2000,
        m2m_unrealised: -500,
        option_premium: 0,
        payout: 0,
        span: 8000,
        holding_sales: 0,
        turnover: 0
      }
    }
  }
};

export const mockQuoteData = {
  'NSE:RELIANCE': {
    instrument_token: 738561,
    last_price: 2600,
    last_quantity: 1,
    last_trade_time: '2024-01-10 15:29:59',
    change: 50,
    change_percent: 1.96,
    volume: 1234567,
    buy_quantity: 500,
    sell_quantity: 750,
    ohlc: {
      open: 2550,
      high: 2650,
      low: 2540,
      close: 2550
    }
  }
};
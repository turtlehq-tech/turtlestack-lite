// src/utils/formatters.js
// Utility functions for formatting trading data

export class DataFormatter {
  /**
   * Format portfolio data for consistent display
   */
  static formatPortfolio(portfolioData) {
    if (!portfolioData.data || !Array.isArray(portfolioData.data)) {
      return portfolioData;
    }

    const formatted = portfolioData.data.map(holding => ({
      symbol: holding.instrument || holding.tradingsymbol || holding.symbol,
      quantity: holding.quantity || 0,
      avgPrice: holding.average_price || holding.avg_price || 0,
      currentPrice: holding.last_price || holding.current_price || 0,
      pnl: holding.pnl || 0,
      pnlPercent: holding.day_change_percentage || 0,
      currentValue: holding.current_value || 0,
      investedValue: holding.invested_value || 0
    }));

    return {
      ...portfolioData,
      data: formatted,
      summary: this.calculatePortfolioSummary(formatted)
    };
  }

  /**
   * Calculate portfolio summary statistics
   */
  static calculatePortfolioSummary(holdings) {
    const totalInvested = holdings.reduce((sum, h) => sum + (h.investedValue || 0), 0);
    const totalCurrent = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalHoldings: holdings.length,
      totalInvested: this.formatCurrency(totalInvested),
      totalCurrent: this.formatCurrency(totalCurrent),
      totalPnl: this.formatCurrency(totalPnl),
      totalPnlPercent: this.formatPercent(totalPnlPercent),
      profitableStocks: holdings.filter(h => (h.pnl || 0) > 0).length,
      losingStocks: holdings.filter(h => (h.pnl || 0) < 0).length
    };
  }

  /**
   * Format order data for display
   */
  static formatOrder(orderData) {
    return {
      orderId: orderData.order_id || orderData.orderId,
      symbol: orderData.tradingsymbol || orderData.trading_symbol || orderData.symbol,
      side: orderData.transaction_type || orderData.side,
      type: orderData.order_type || orderData.type,
      quantity: orderData.quantity,
      price: orderData.price || 0,
      status: orderData.status,
      timestamp: orderData.order_timestamp || orderData.timestamp,
      exchange: orderData.exchange
    };
  }

  /**
   * Format currency values
   */
  static formatCurrency(amount, currency = '₹') {
    if (typeof amount !== 'number') return `${currency}0.00`;
    return `${currency}${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  /**
   * Format percentage values
   */
  static formatPercent(percent) {
    if (typeof percent !== 'number') return '0.00%';
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  }

  /**
   * Format response for MCP
   */
  static formatMCPResponse(data, title = '') {
    return {
      content: [{
        type: "text",
        text: title ? `${title}:\n\n${JSON.stringify(data, null, 2)}` : JSON.stringify(data, null, 2)
      }]
    };
  }

  /**
   * Format error response for MCP
   */
  static formatErrorResponse(error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error: ${error.message}` 
      }],
      isError: true
    };
  }
}
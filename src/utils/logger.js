// src/utils/logger.js
// Simple logging utility for the trading server

export class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };

    // Log to stderr so it doesn't interfere with MCP protocol
    console.error(JSON.stringify(logEntry));
  }

  static info(message, data = null) {
    this.log('info', message, data);
  }

  static warn(message, data = null) {
    this.log('warn', message, data);
  }

  static error(message, data = null) {
    this.log('error', message, data);
  }

  static debug(message, data = null) {
    if (process.env.DEBUG === 'true') {
      this.log('debug', message, data);
    }
  }
}
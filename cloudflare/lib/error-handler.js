// Comprehensive Error Handler for Cloudflare Workers
// Prevents 500 errors and provides detailed logging

export class ErrorHandler {
  // Safe execution wrapper with comprehensive error handling
  static async safeExecute(fn, context = 'unknown') {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      console.error(`Error in ${context}:`, {
        message: error.message,
        stack: error.stack,
        context: context,
        timestamp: new Date().toISOString()
      });

      // Return structured error response instead of throwing
      return {
        error: true,
        message: error.message,
        context: context,
        timestamp: new Date().toISOString(),
        type: this.categorizeError(error)
      };
    }
  }

  // Categorize errors for better handling
  static categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'AUTHENTICATION_ERROR';
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT_ERROR';
    }
    
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('missing parameter')) {
      return 'VALIDATION_ERROR';
    }
    
    if (message.includes('broker') && message.includes('api')) {
      return 'BROKER_API_ERROR';
    }
    
    if (message.includes('session') || message.includes('expired')) {
      return 'SESSION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  // Format error for API response
  static formatErrorResponse(error, context = 'unknown') {
    const errorType = this.categorizeError(error);
    
    const baseResponse = {
      error: true,
      context: context,
      timestamp: new Date().toISOString(),
      type: errorType
    };

    // Customize response based on error type
    switch (errorType) {
      case 'AUTHENTICATION_ERROR':
        return {
          ...baseResponse,
          message: 'Authentication failed. Please check your credentials.',
          code: 'AUTH_001',
          suggestion: 'Verify your API keys and access tokens are correct.'
        };
      
      case 'RATE_LIMIT_ERROR':
        return {
          ...baseResponse,
          message: 'Rate limit exceeded. Please slow down your requests.',
          code: 'RATE_001',
          suggestion: 'Wait before making additional requests.'
        };
      
      case 'NETWORK_ERROR':
        return {
          ...baseResponse,
          message: 'Network error occurred. Please retry.',
          code: 'NET_001',
          suggestion: 'Check your internet connection and retry the request.'
        };
      
      case 'VALIDATION_ERROR':
        return {
          ...baseResponse,
          message: error.message, // Keep original validation message
          code: 'VAL_001',
          suggestion: 'Check the request parameters and try again.'
        };
      
      case 'BROKER_API_ERROR':
        return {
          ...baseResponse,
          message: 'Broker API error. The trading platform may be experiencing issues.',
          code: 'BROKER_001',
          suggestion: 'Check if the broker\'s platform is operational.'
        };
      
      case 'SESSION_ERROR':
        return {
          ...baseResponse,
          message: 'Session expired or invalid. Please create a new session.',
          code: 'SESSION_001',
          suggestion: 'Create a new session or re-authenticate.'
        };
      
      default:
        return {
          ...baseResponse,
          message: 'An unexpected error occurred.',
          code: 'UNKNOWN_001',
          suggestion: 'Please try again or contact support if the issue persists.'
        };
    }
  }

  // Handle async operations with timeout
  static async withTimeout(promise, timeoutMs = 30000) {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeout]);
    } catch (error) {
      throw error;
    }
  }

  // Retry mechanism for transient errors
  static async retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain error types
        const errorType = this.categorizeError(error);
        if (['AUTHENTICATION_ERROR', 'VALIDATION_ERROR'].includes(errorType)) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Validate request parameters
  static validateRequired(params, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  // Sanitize sensitive data for logging
  static sanitizeForLogging(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'api_key', 'access_token', 
      'refresh_token', 'authorization', 'auth', 'credential', 'checksum'
    ];
    
    const sanitized = { ...data };
    
    const sanitizeValue = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        
        if (sensitiveFields.some(field => keyLower.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeValue(value);
        }
      }
    };
    
    sanitizeValue(sanitized);
    return sanitized;
  }

  // Log error with context
  static logError(error, context = 'unknown', additionalData = {}) {
    const sanitizedData = this.sanitizeForLogging(additionalData);
    
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      context: context,
      type: this.categorizeError(error),
      timestamp: new Date().toISOString(),
      ...sanitizedData
    });
  }

  // Create a circuit breaker for external API calls
  static createCircuitBreaker(name, failureThreshold = 5, timeoutMs = 60000) {
    return {
      name,
      failures: 0,
      failureThreshold,
      timeout: timeoutMs,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailureTime: null,
      
      async execute(fn) {
        // Check if circuit is open
        if (this.state === 'OPEN') {
          if (Date.now() - this.lastFailureTime > this.timeout) {
            this.state = 'HALF_OPEN';
          } else {
            throw new Error(`Circuit breaker ${this.name} is OPEN`);
          }
        }
        
        try {
          const result = await fn();
          
          // Reset on success
          if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            this.failures = 0;
          }
          
          return result;
        } catch (error) {
          this.failures++;
          this.lastFailureTime = Date.now();
          
          if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
          }
          
          throw error;
        }
      }
    };
  }
}
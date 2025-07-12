// Rate Limiter for Cloudflare Workers Free Tier
// Optimized for KV storage limitations

export class RateLimiter {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
  }

  // Check if request is within rate limit
  async checkLimit(identifier, windowSizeSeconds = 60, maxRequests = 60) {
    const key = `ratelimit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSizeSeconds;

    try {
      // Get current request data
      const data = await this.kv.get(key, 'json');
      
      if (!data) {
        // First request from this identifier
        await this.kv.put(key, JSON.stringify({
          requests: [now],
          count: 1
        }), { expirationTtl: windowSizeSeconds * 2 });
        
        return { allowed: true, remaining: maxRequests - 1 };
      }

      // Filter out old requests
      const validRequests = data.requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= maxRequests) {
        // Rate limit exceeded
        const oldestRequest = Math.min(...validRequests);
        const retryAfter = oldestRequest + windowSizeSeconds - now;
        
        return { 
          allowed: false, 
          remaining: 0,
          retryAfter: Math.max(1, retryAfter)
        };
      }

      // Add current request
      validRequests.push(now);
      
      await this.kv.put(key, JSON.stringify({
        requests: validRequests,
        count: validRequests.length
      }), { expirationTtl: windowSizeSeconds * 2 });

      return { 
        allowed: true, 
        remaining: maxRequests - validRequests.length
      };

    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request (fail open)
      return { allowed: true, remaining: maxRequests };
    }
  }

  // Get rate limit status without incrementing
  async getStatus(identifier, windowSizeSeconds = 60, maxRequests = 60) {
    const key = `ratelimit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSizeSeconds;

    try {
      const data = await this.kv.get(key, 'json');
      
      if (!data) {
        return { remaining: maxRequests, resetTime: now + windowSizeSeconds };
      }

      const validRequests = data.requests.filter(timestamp => timestamp > windowStart);
      const remaining = Math.max(0, maxRequests - validRequests.length);
      const oldestRequest = validRequests.length > 0 ? Math.min(...validRequests) : now;
      const resetTime = oldestRequest + windowSizeSeconds;

      return { remaining, resetTime };

    } catch (error) {
      console.error('Rate limiter status error:', error);
      return { remaining: maxRequests, resetTime: now + windowSizeSeconds };
    }
  }

  // Reset rate limit for an identifier (admin function)
  async resetLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    try {
      await this.kv.delete(key);
      return true;
    } catch (error) {
      console.error('Rate limiter reset error:', error);
      return false;
    }
  }
}
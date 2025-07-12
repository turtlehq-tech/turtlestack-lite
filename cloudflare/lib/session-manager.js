// Worker-compatible Session Manager using Cloudflare KV
// Optimized for free tier with efficient KV operations

export class WorkerSessionManager {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
    this.sessionTimeout = 3600000; // 1 hour in milliseconds
    this.maxSessions = 50; // Free tier limit
  }

  // Generate a unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Create a new session
  async createSession(connectionId = null) {
    try {
      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        connectionId: connectionId,
        brokers: {
          kite: { isAuthenticated: false, data: null },
          groww: { isAuthenticated: false, data: null },
          dhan: { isAuthenticated: false, data: null }
        },
        activeBroker: null,
        metadata: {
          userAgent: null,
          clientInfo: null
        }
      };

      // Store session in KV with TTL
      await this.kv.put(
        `session:${sessionId}`, 
        JSON.stringify(session),
        { expirationTtl: this.sessionTimeout / 1000 } // KV TTL is in seconds
      );

      // Update session count (for monitoring)
      await this.updateSessionCount(1);

      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  // Get session by ID
  async getSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const sessionData = await this.kv.get(`session:${sessionId}`, 'json');
      if (!sessionData) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Check if session has expired
      const now = Date.now();
      if (now - sessionData.lastActivity > this.sessionTimeout) {
        await this.deleteSession(sessionId);
        throw new Error(`Session expired: ${sessionId}`);
      }

      // Update last activity
      sessionData.lastActivity = now;
      await this.kv.put(
        `session:${sessionId}`, 
        JSON.stringify(sessionData),
        { expirationTtl: this.sessionTimeout / 1000 }
      );

      return sessionData;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  }

  // Delete a session
  async deleteSession(sessionId) {
    try {
      await this.kv.delete(`session:${sessionId}`);
      await this.updateSessionCount(-1);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  // Get or create session by connection ID
  async getSessionByConnection(connectionId) {
    try {
      if (!connectionId) {
        return await this.createSession();
      }

      // Try to find existing session by connection ID
      const connectionMapping = await this.kv.get(`connection:${connectionId}`, 'text');
      
      if (connectionMapping) {
        try {
          const session = await this.getSession(connectionMapping);
          return session.id;
        } catch (error) {
          // Session expired or not found, create new one
          await this.kv.delete(`connection:${connectionId}`);
        }
      }

      // Create new session and map connection
      const sessionId = await this.createSession(connectionId);
      await this.kv.put(
        `connection:${connectionId}`, 
        sessionId,
        { expirationTtl: this.sessionTimeout / 1000 }
      );

      return sessionId;
    } catch (error) {
      console.error('Failed to get session by connection:', error);
      throw error;
    }
  }

  // Update broker authentication state
  async updateBrokerAuth(sessionId, brokerName, authData) {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session.brokers[brokerName]) {
        throw new Error(`Unknown broker: ${brokerName}`);
      }

      session.brokers[brokerName] = {
        isAuthenticated: true,
        data: authData,
        authenticatedAt: Date.now()
      };

      session.lastActivity = Date.now();

      await this.kv.put(
        `session:${sessionId}`, 
        JSON.stringify(session),
        { expirationTtl: this.sessionTimeout / 1000 }
      );

      return true;
    } catch (error) {
      console.error('Failed to update broker auth:', error);
      throw error;
    }
  }

  // Get broker instance for session
  async getBrokerAuth(sessionId, brokerName) {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session.brokers[brokerName]) {
        throw new Error(`Unknown broker: ${brokerName}`);
      }

      return session.brokers[brokerName];
    } catch (error) {
      console.error('Failed to get broker auth:', error);
      throw error;
    }
  }

  // Set active broker for session
  async setActiveBroker(sessionId, brokerName) {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session.brokers[brokerName]) {
        throw new Error(`Unknown broker: ${brokerName}`);
      }

      session.activeBroker = brokerName;
      session.lastActivity = Date.now();

      await this.kv.put(
        `session:${sessionId}`, 
        JSON.stringify(session),
        { expirationTtl: this.sessionTimeout / 1000 }
      );

      return true;
    } catch (error) {
      console.error('Failed to set active broker:', error);
      throw error;
    }
  }

  // Get session info (for debugging/monitoring)
  async getSessionInfo(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      
      return {
        id: session.id,
        createdAt: new Date(session.createdAt).toISOString(),
        lastActivity: new Date(session.lastActivity).toISOString(),
        activeBroker: session.activeBroker,
        authenticatedBrokers: Object.keys(session.brokers).filter(
          key => session.brokers[key].isAuthenticated
        ),
        connectionId: session.connectionId
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      throw error;
    }
  }

  // Update session count for monitoring (free tier optimization)
  async updateSessionCount(delta) {
    try {
      const current = await this.kv.get('session_count', 'text');
      const count = parseInt(current || '0') + delta;
      
      // Prevent negative counts
      const finalCount = Math.max(0, count);
      
      await this.kv.put('session_count', finalCount.toString());
      
      // Log warning if approaching limits
      if (finalCount > this.maxSessions * 0.8) {
        console.warn(`Session count approaching limit: ${finalCount}/${this.maxSessions}`);
      }
      
      return finalCount;
    } catch (error) {
      console.error('Failed to update session count:', error);
      // Don't throw - this is for monitoring only
    }
  }

  // Cleanup expired sessions (for maintenance)
  async cleanupExpiredSessions() {
    try {
      // This would typically be called by a scheduled worker
      // For now, individual session cleanup happens during access
      const sessionCount = await this.kv.get('session_count', 'text');
      console.log(`Current session count: ${sessionCount || '0'}`);
      
      return parseInt(sessionCount || '0');
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
      return 0;
    }
  }
}
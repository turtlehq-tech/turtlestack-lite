// src/utils/SessionManager.js
import { v4 as uuidv4 } from 'uuid';
import { KiteBroker, GrowwBroker, DhanBroker, AngelOneBroker } from '../brokers/index.js';
import { Logger } from './logger.js';

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.connectionSessions = new Map(); // connection -> sessionId mapping
    this.sessionCleanupInterval = 1000 * 60 * 60; // 1 hour cleanup
    this.maxSessionAge = 1000 * 60 * 60 * 24; // 24 hours max session
    
    // Start session cleanup
    this.startCleanupTimer();
    
    Logger.info("SessionManager initialized");
  }

  /**
   * Create a new user session with isolated broker instances
   */
  createSession(connectionId = null) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      connectionId: connectionId,
      brokers: {
        kite: new KiteBroker(),
        groww: new GrowwBroker(),
        dhan: new DhanBroker(),
        angelone: new AngelOneBroker()
      },
      activeBroker: null,
      metadata: {
        userAgent: null,
        clientInfo: null
      }
    };

    this.sessions.set(sessionId, session);
    
    if (connectionId) {
      this.connectionSessions.set(connectionId, sessionId);
    }

    Logger.info(`Session created: ${sessionId}`, { 
      connectionId, 
      totalSessions: this.sessions.size 
    });
    
    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Get session by connection ID
   */
  getSessionByConnection(connectionId) {
    const sessionId = this.connectionSessions.get(connectionId);
    if (!sessionId) {
      // Auto-create session for new connections
      return this.createSession(connectionId);
    }
    
    try {
      return this.getSession(sessionId);
    } catch (error) {
      // Session expired, create new one
      this.connectionSessions.delete(connectionId);
      return this.createSession(connectionId);
    }
  }

  /**
   * Get session ID by connection
   */
  getSessionId(connectionId) {
    let sessionId = this.connectionSessions.get(connectionId);
    if (!sessionId) {
      sessionId = this.createSession(connectionId);
    }
    return sessionId;
  }

  /**
   * Delete a session and cleanup resources
   */
  deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Logout all brokers in the session
    try {
      Object.values(session.brokers).forEach(broker => {
        if (broker.isAuthenticated) {
          broker.logout();
        }
      });
    } catch (error) {
      Logger.warn(`Error during session cleanup: ${sessionId}`, { error: error.message });
    }

    // Remove from maps
    this.sessions.delete(sessionId);
    if (session.connectionId) {
      this.connectionSessions.delete(session.connectionId);
    }

    Logger.info(`Session deleted: ${sessionId}`, { 
      remainingSessions: this.sessions.size 
    });
    
    return true;
  }

  /**
   * Get broker instance for a session
   */
  getBroker(sessionId, brokerName) {
    const session = this.getSession(sessionId);
    const broker = session.brokers[brokerName];
    
    if (!broker) {
      throw new Error(`Unknown broker: ${brokerName}`);
    }
    
    return broker;
  }

  /**
   * Set active broker for a session
   */
  setActiveBroker(sessionId, brokerName) {
    const session = this.getSession(sessionId);
    if (!session.brokers[brokerName]) {
      throw new Error(`Unknown broker: ${brokerName}`);
    }
    
    session.activeBroker = brokerName;
    Logger.debug(`Active broker set: ${brokerName}`, { sessionId });
  }

  /**
   * Get active broker for a session
   */
  getActiveBroker(sessionId) {
    const session = this.getSession(sessionId);
    return session.activeBroker;
  }

  /**
   * Get all sessions info (for admin/monitoring)
   */
  getSessionsInfo() {
    const sessions = Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      createdAt: new Date(session.createdAt).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      activeBroker: session.activeBroker,
      authenticatedBrokers: Object.keys(session.brokers).filter(
        key => session.brokers[key].isAuthenticated
      ),
      connectionId: session.connectionId
    }));

    return {
      totalSessions: this.sessions.size,
      totalConnections: this.connectionSessions.size,
      sessions: sessions
    };
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivity;
      if (age > this.maxSessionAge) {
        this.deleteSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      Logger.info(`Cleaned up ${cleanedCount} expired sessions`, {
        remainingSessions: this.sessions.size
      });
    }
  }

  /**
   * Start periodic session cleanup
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.sessionCleanupInterval);
    
    Logger.debug("Session cleanup timer started", {
      cleanupInterval: this.sessionCleanupInterval,
      maxSessionAge: this.maxSessionAge
    });
  }

  /**
   * Shutdown session manager
   */
  shutdown() {
    Logger.info("Shutting down SessionManager", { 
      activeSessions: this.sessions.size 
    });
    
    // Cleanup all sessions
    for (const sessionId of this.sessions.keys()) {
      this.deleteSession(sessionId);
    }
    
    this.sessions.clear();
    this.connectionSessions.clear();
  }
}
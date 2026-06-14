// In-memory storage for the application
// In production, replace with a real database

class StorageManager {
  constructor() {
    // Store pending access requests
    this.pendingRequests = new Map();
    
    // Store active user sessions
    this.sessions = new Map();
    
    // Store verification codes
    this.verificationCodes = new Map();
    
    // Store approved users
    this.approvedUsers = new Map();
    
    // Store dam data
    this.dams = [];
    
    // Store update history
    this.updateHistory = [];
  }

  // ============ PENDING REQUESTS ============
  createPendingRequest(requestId, requestData) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.pendingRequests.set(requestId, {
      ...requestData,
      createdAt: new Date(),
      expiresAt,
      verified: false
    });
    return requestId;
  }

  getPendingRequest(requestId) {
    return this.pendingRequests.get(requestId);
  }

  deletePendingRequest(requestId) {
    this.pendingRequests.delete(requestId);
  }

  // ============ VERIFICATION CODES ============
  storeVerificationCode(requestId, code) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.verificationCodes.set(requestId, {
      code,
      attempts: 0,
      createdAt: new Date(),
      expiresAt
    });
  }

  getVerificationCode(requestId) {
    return this.verificationCodes.get(requestId);
  }

  incrementCodeAttempts(requestId) {
    const codeData = this.verificationCodes.get(requestId);
    if (codeData) {
      codeData.attempts++;
      return codeData.attempts;
    }
    return 0;
  }

  // ============ SESSIONS ============
  createSession(userId, sessionData) {
    const sessionId = Math.random().toString(36).substring(7);
    this.sessions.set(sessionId, {
      userId,
      ...sessionData,
      createdAt: new Date(),
      lastActivity: new Date()
    });
    return sessionId;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && this.isSessionValid(session)) {
      session.lastActivity = new Date();
      return session;
    }
    return null;
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  isSessionValid(session) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return session.lastActivity > thirtyMinutesAgo;
  }

  // ============ APPROVED USERS ============
  approveUser(username, email, company, purpose) {
    const userId = Math.random().toString(36).substring(7);
    const user = {
      id: userId,
      username,
      email,
      company,
      purpose,
      approvedAt: new Date(),
      role: 'data-collector'
    };
    this.approvedUsers.set(userId, user);
    return user;
  }

  getUserByEmail(email) {
    for (const user of this.approvedUsers.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  getUser(userId) {
    return this.approvedUsers.get(userId);
  }

  // ============ DAM DATA ============
  setDams(damsData) {
    this.dams = damsData;
  }

  getDams() {
    return this.dams;
  }

  getDamById(damId) {
    return this.dams.find(d => d.id === damId);
  }

  updateDam(damId, updates) {
    const dam = this.getDamById(damId);
    if (dam) {
      Object.assign(dam, updates, { last_updated: new Date().toISOString().split('T')[0] });
      
      // Record update history
      this.updateHistory.push({
        damId,
        updates,
        timestamp: new Date(),
        status: 'success'
      });
      
      return dam;
    }
    return null;
  }

  getUpdateHistory(damId = null) {
    if (damId) {
      return this.updateHistory.filter(h => h.damId === damId);
    }
    return this.updateHistory;
  }

  // ============ CLEANUP ============
  cleanupExpiredData() {
    const now = new Date();
    
    // Clean expired pending requests
    for (const [key, value] of this.pendingRequests) {
      if (value.expiresAt < now) {
        this.pendingRequests.delete(key);
      }
    }
    
    // Clean expired verification codes
    for (const [key, value] of this.verificationCodes) {
      if (value.expiresAt < now) {
        this.verificationCodes.delete(key);
      }
    }
  }
}

module.exports = new StorageManager();

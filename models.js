// Database Models for ZWARMIS
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

class UserModel {
  static async create(username, email, company, purpose) {
    const id = uuidv4();
    await db.run(
      `INSERT INTO users (id, username, email, company, purpose, verified)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [id, username, email, company, purpose]
    );
    return this.getById(id);
  }

  static async getById(id) {
    return db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async getByEmail(email) {
    return db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async getByUsername(username) {
    return db.get('SELECT * FROM users WHERE username = ?', [username]);
  }

  static async getAll() {
    return db.all('SELECT * FROM users WHERE status = ?', ['active']);
  }

  static async updateLastLogin(userId) {
    return db.run(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    );
  }

  static async updateStatus(userId, status) {
    return db.run(
      `UPDATE users SET status = ? WHERE id = ?`,
      [status, userId]
    );
  }
}

class DamModel {
  static async create(damData) {
    const { id, name, province, type, capacity_percent, latitude, longitude, image_url, status } = damData;
    await db.run(
      `INSERT INTO dams (id, name, province, type, capacity_percent, latitude, longitude, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, province, type, capacity_percent || 0, latitude, longitude, image_url, status || 'normal']
    );
    return this.getById(id);
  }

  static async getById(id) {
    return db.get('SELECT * FROM dams WHERE id = ?', [id]);
  }

  static async getAll() {
    return db.all('SELECT * FROM dams ORDER BY name');
  }

  static async getByProvince(province) {
    return db.all('SELECT * FROM dams WHERE province = ? ORDER BY name', [province]);
  }

  static async update(damId, updates) {
    const { capacity_percent, status } = updates;
    await db.run(
      `UPDATE dams SET capacity_percent = ?, status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`,
      [capacity_percent, status, damId]
    );
    return this.getById(damId);
  }

  static async bulkCreate(damsArray) {
    for (const dam of damsArray) {
      const existing = await this.getById(dam.id);
      if (!existing) {
        await this.create(dam);
      }
    }
  }
}

class DamUpdateModel {
  static async create(damId, capacity_percent, status, updatedBy, notes) {
    const result = await db.run(
      `INSERT INTO dam_updates (dam_id, capacity_percent, status, updated_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [damId, capacity_percent, status, updatedBy, notes]
    );
    return this.getById(result.id);
  }

  static async getById(id) {
    return db.get('SELECT * FROM dam_updates WHERE id = ?', [id]);
  }

  static async getByDamId(damId, limit = 50) {
    return db.all(
      `SELECT * FROM dam_updates WHERE dam_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [damId, limit]
    );
  }

  static async getAll(limit = 100) {
    return db.all(
      `SELECT * FROM dam_updates ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  static async getRecentUpdates(hours = 24) {
    return db.all(
      `SELECT * FROM dam_updates 
       WHERE timestamp > datetime('now', '-' || ? || ' hours')
       ORDER BY timestamp DESC`,
      [hours]
    );
  }
}

class SessionModel {
  static async create(userId, expiresAt) {
    const sessionId = uuidv4();
    await db.run(
      `INSERT INTO sessions (id, user_id, expires_at)
       VALUES (?, ?, ?)`,
      [sessionId, userId, expiresAt]
    );
    return sessionId;
  }

  static async getById(sessionId) {
    return db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  }

  static async updateActivity(sessionId) {
    return db.run(
      `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`,
      [sessionId]
    );
  }

  static async delete(sessionId) {
    return db.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
  }

  static async deleteExpired() {
    return db.run('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP');
  }

  static async isValid(sessionId) {
    const session = await this.getById(sessionId);
    if (!session) return false;
    if (new Date(session.expires_at) < new Date()) return false;
    return true;
  }
}

class VerificationCodeModel {
  static async create(email) {
    const id = uuidv4();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.run(
      `INSERT INTO verification_codes (id, user_email, code, expires_at)
       VALUES (?, ?, ?, ?)`,
      [id, email, code, expiresAt.toISOString()]
    );
    return { id, code };
  }

  static async getById(id) {
    return db.get('SELECT * FROM verification_codes WHERE id = ?', [id]);
  }

  static async verifyCode(id, code) {
    const codeRecord = await this.getById(id);
    if (!codeRecord) return false;

    // Check expiry
    if (new Date(codeRecord.expires_at) < new Date()) return false;

    // Check max attempts
    if (codeRecord.attempts >= 5) return false;

    // Check code match
    if (codeRecord.code !== code) {
      // Increment attempts
      await db.run(
        'UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?',
        [id]
      );
      return false;
    }

    // Mark as verified
    await db.run(
      'UPDATE verification_codes SET verified = 1 WHERE id = ?',
      [id]
    );
    return true;
  }

  static async delete(id) {
    return db.run('DELETE FROM verification_codes WHERE id = ?', [id]);
  }

  static async deleteExpired() {
    return db.run('DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP');
  }
}

class AuditLogModel {
  static async log(action, userId, resourceType, resourceId, details) {
    return db.run(
      `INSERT INTO audit_log (action, user_id, resource_type, resource_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [action, userId, resourceType, resourceId, JSON.stringify(details)]
    );
  }

  static async getAll(limit = 100) {
    return db.all(
      `SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  static async getByUser(userId, limit = 50) {
    return db.all(
      `SELECT * FROM audit_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [userId, limit]
    );
  }

  static async getByAction(action, limit = 50) {
    return db.all(
      `SELECT * FROM audit_log WHERE action = ? ORDER BY timestamp DESC LIMIT ?`,
      [action, limit]
    );
  }
}

module.exports = {
  UserModel,
  DamModel,
  DamUpdateModel,
  SessionModel,
  VerificationCodeModel,
  AuditLogModel
};

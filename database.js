// Database connection and initialization
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'zwarmis.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database:', DB_PATH);
          this.createTables()
            .then(() => resolve(this.db))
            .catch(reject);
        }
      });

      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');
    });
  }

  // Create database tables
  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            company TEXT NOT NULL,
            purpose TEXT NOT NULL,
            role TEXT DEFAULT 'data-collector',
            verified BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            status TEXT DEFAULT 'active'
          )
        `);

        // DAMs table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS dams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            province TEXT NOT NULL,
            type TEXT,
            capacity_percent REAL DEFAULT 0,
            latitude REAL,
            longitude REAL,
            image_url TEXT,
            status TEXT DEFAULT 'normal',
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Dam updates table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS dam_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dam_id TEXT NOT NULL,
            capacity_percent REAL NOT NULL,
            status TEXT DEFAULT 'normal',
            updated_by TEXT,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dam_id) REFERENCES dams(id),
            FOREIGN KEY (updated_by) REFERENCES users(id)
          )
        `);

        // Sessions table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Verification codes table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS verification_codes (
            id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            code TEXT NOT NULL,
            attempts INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            verified BOOLEAN DEFAULT 0
          )
        `);

        // Audit log table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            user_id TEXT,
            resource_type TEXT,
            resource_id TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating tables:', err);
            reject(err);
          } else {
            console.log('✅ Database tables created/verified');
            resolve();
          }
        });
      });
    });
  }

  // Run query (for INSERT, UPDATE, DELETE)
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          console.log('✅ Database connection closed');
          resolve();
        }
      });
    });
  }

  // Clear all data (for testing/reset)
  async clearAll() {
    await this.run('DELETE FROM audit_log');
    await this.run('DELETE FROM dam_updates');
    await this.run('DELETE FROM verification_codes');
    await this.run('DELETE FROM sessions');
    await this.run('DELETE FROM users');
    await this.run('DELETE FROM dams');
    console.log('✅ All tables cleared');
  }
}

module.exports = new Database();

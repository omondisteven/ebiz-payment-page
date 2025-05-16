// // /src/lib/db.ts (updated)
// import Database from 'better-sqlite3';
// import path from 'path';

// const dbPath = process.env.NODE_ENV === 'production' 
//   ? '/tmp/transactions.db' 
//   : path.join(process.cwd(), 'transactions.db');

// const db = new Database(dbPath, { verbose: console.log });

// // Initialize tables
// function initializeDB() {
//   try {
//     db.pragma('journal_mode = WAL');
    
//     db.exec(`
//       CREATE TABLE IF NOT EXISTS transactions (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         phone TEXT NOT NULL,
//         account TEXT NOT NULL,
//         amount REAL NOT NULL,
//         transaction_type TEXT NOT NULL,
//         status TEXT NOT NULL DEFAULT 'Pending',
//         checkout_request_id TEXT UNIQUE,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         expires_at DATETIME DEFAULT (datetime('now', '+60 seconds')),
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
//       );

//       CREATE INDEX IF NOT EXISTS idx_checkout_request ON transactions(checkout_request_id);
//       CREATE INDEX IF NOT EXISTS idx_status_expires ON transactions(status, expires_at);

//       CREATE TRIGGER IF NOT EXISTS update_timestamp
//       AFTER UPDATE ON transactions
//       FOR EACH ROW
//       BEGIN
//         UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
//       END;
//     `);
//   } catch (error) {
//     console.error('Database initialization error:', error);
//     throw error;
//   }

//   // Additional check for Vercel
//   if (process.env.NODE_ENV === 'production') {
//     const fs = require('fs');
//     if (!fs.existsSync('/tmp')) {
//       fs.mkdirSync('/tmp');
//     }
//   }
// }

// initializeDB();

// export default db;
-- v1 canonical schema for local SQLite (Bird encounters)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS bird_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firestoreId TEXT UNIQUE,         -- Firestore doc id (string)
  species TEXT,
  soundName TEXT,
  timestamp INTEGER NOT NULL,      -- unix ms
  imageUrl TEXT,
  imagePath TEXT,                  -- local cached path (nullable)
  imageCached INTEGER DEFAULT 0,   -- 0/1
  location TEXT,
  device TEXT,
  createdAt INTEGER DEFAULT (strftime('%s','now') * 1000),
  lastModified INTEGER DEFAULT (strftime('%s','now') * 1000)
);

-- tiny meta table for app-level keys (optional; we also use PRAGMA user_version)
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_bird_history_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bird_history_firestoreId ON events(firestoreId);
CREATE INDEX IF NOT EXISTS idx_bird_history_imageCached ON events(imageCached);
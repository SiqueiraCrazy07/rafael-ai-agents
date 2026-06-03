CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  payload JSON,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  payload JSON,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  payload JSON,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_events (
  id TEXT PRIMARY KEY,
  payload JSON,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

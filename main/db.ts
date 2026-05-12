import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

export let db: Database.Database

export async function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'weave.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate()
  console.log('SQLite ready at', dbPath)
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color       TEXT NOT NULL DEFAULT '#c0392b',
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS documents (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      folder_id  TEXT,
      title      TEXT NOT NULL DEFAULT 'Untitled',
      content    TEXT NOT NULL DEFAULT '',
      position   INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS thread_categories (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#4a9cf9',
      position   INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS ply_cells (
      id          TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES thread_categories(id) ON DELETE SET NULL,
      title       TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL DEFAULT '',
      tags        TEXT NOT NULL DEFAULT '[]',
      range_start INTEGER NOT NULL,
      range_end   INTEGER NOT NULL,
      position    INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS world_entries (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type       TEXT NOT NULL CHECK(type IN ('character','setting','other')),
      name       TEXT NOT NULL,
      data       TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS blobs (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      content    TEXT NOT NULL DEFAULT '',
      type       TEXT NOT NULL DEFAULT 'text',
      tags       TEXT NOT NULL DEFAULT '[]',
      color      TEXT NOT NULL DEFAULT '#1c2333',
      pos_x      REAL NOT NULL DEFAULT 100,
      pos_y      REAL NOT NULL DEFAULT 100,
      width      REAL NOT NULL DEFAULT 200,
      height     REAL NOT NULL DEFAULT 120,
      priority   INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS blob_connections (
      id        TEXT PRIMARY KEY,
      blob_from TEXT NOT NULL REFERENCES blobs(id) ON DELETE CASCADE,
      blob_to   TEXT NOT NULL REFERENCES blobs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_ply_cells_document ON ply_cells(document_id);
    CREATE INDEX IF NOT EXISTS idx_ply_cells_category ON ply_cells(category_id);
    CREATE INDEX IF NOT EXISTS idx_blobs_project ON blobs(project_id);
  `)
}

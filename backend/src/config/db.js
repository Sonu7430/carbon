import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbConnection = null;

/**
 * Initializes and/or retrieves the SQLite database connection.
 * Creates the required tables and indexes if they do not exist.
 */
export async function getDb() {
  if (dbConnection) {
    return dbConnection;
  }

  // Define local database file location
  const dbPath = path.resolve(__dirname, '../../database.sqlite');

  // Open database connection
  dbConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign key constraints
  await dbConnection.run('PRAGMA foreign_keys = ON;');

  // Define database schema
  await dbConnection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      onboarding_completed INTEGER DEFAULT 0,
      diet_type TEXT,
      commute_mode TEXT,
      weekly_commute_km REAL,
      household_size INTEGER,
      home_energy_source TEXT,
      baseline_co2_monthly REAL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      amount REAL NOT NULL,
      unit TEXT NOT NULL,
      calculated_co2 REAL NOT NULL,
      log_date DATE NOT NULL,
      notes TEXT,
      formula_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_reduction_pct REAL NOT NULL,
      target_co2_monthly REAL NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Indexes for optimizing queries (used heavily for user-scoped aggregates and date filtering)
    CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities (user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals (user_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles (user_id);
  `);

  return dbConnection;
}

/**
 * Resets database tables. Primarily used to support clean testing hooks.
 */
export async function resetDb() {
  const db = await getDb();
  await db.exec(`
    DROP INDEX IF EXISTS idx_activities_user_date;
    DROP INDEX IF EXISTS idx_goals_user;
    DROP INDEX IF EXISTS idx_profiles_user;
    DROP TABLE IF EXISTS goals;
    DROP TABLE IF EXISTS activities;
    DROP TABLE IF EXISTS profiles;
    DROP TABLE IF EXISTS users;
  `);
  dbConnection = null;
  return getDb();
}

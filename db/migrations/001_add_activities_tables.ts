import * as SQLite from 'expo-sqlite';

export const up = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    
    -- Activities table
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      activity_type TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      location_name TEXT,
      location_lat REAL,
      location_lng REAL,
      raw_input TEXT,
      ai_analysis TEXT DEFAULT '{}',
      sentiment TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
    CREATE INDEX IF NOT EXISTS idx_activities_time ON activities(started_at);
    
    -- Activity participants table (many-to-many)
    CREATE TABLE IF NOT EXISTS activity_participants (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      role TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      UNIQUE(activity_id, contact_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_participants_activity ON activity_participants(activity_id);
    CREATE INDEX IF NOT EXISTS idx_participants_contact ON activity_participants(contact_id);
    
    -- Activity types table
    CREATE TABLE IF NOT EXISTS activity_types (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      category TEXT,
      created_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_activity_types_user ON activity_types(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_types_name ON activity_types(user_id, name);
    
    -- Insert default activity types
    INSERT OR IGNORE INTO activity_types (id, name, icon, color, category, created_at) VALUES
      ('type_basketball', 'basketball', 'basketball-outline', '#FF6B6B', 'sports', ${Date.now()}),
      ('type_hiking', 'hiking', 'walk-outline', '#4ECDC4', 'sports', ${Date.now()}),
      ('type_meeting', 'meeting', 'people-outline', '#45B7D1', 'work', ${Date.now()}),
      ('type_dinner', 'dinner', 'restaurant-outline', '#FFA07A', 'social', ${Date.now()}),
      ('type_coffee', 'coffee', 'cafe-outline', '#8B4513', 'social', ${Date.now()}),
      ('type_movie', 'movie', 'film-outline', '#9B59B6', 'entertainment', ${Date.now()}),
      ('type_travel', 'travel', 'airplane-outline', '#3498DB', 'travel', ${Date.now()});
  `);
};

export const down = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    DROP TABLE IF EXISTS activity_participants;
    DROP TABLE IF EXISTS activities;
    DROP TABLE IF EXISTS activity_types;
  `);
};

import * as SQLite from 'expo-sqlite';
import * as migration001 from './001_add_activities_tables';
import * as migration002 from './002_add_contact_triggers';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
  down: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'Add activities tables',
    up: migration001.up,
    down: migration001.down,
  },
  {
    version: 2,
    name: 'Add contact triggers',
    up: migration002.up,
    down: migration002.down,
  },
];

export const getCurrentVersion = async (db: SQLite.SQLiteDatabase): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    return result?.version || 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
};

export const createVersionTable = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
};

export const recordMigration = async (
  db: SQLite.SQLiteDatabase,
  version: number,
  name: string
): Promise<void> => {
  await db.runAsync(
    'INSERT OR REPLACE INTO schema_version (version, name, applied_at) VALUES (?, ?, ?)',
    [version, name, Date.now()]
  );
};

export const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await createVersionTable(db);
  const currentVersion = await getCurrentVersion(db);
  
  console.log(`[Database] Current schema version: ${currentVersion}`);
  
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`[Database] Running migration ${migration.version}: ${migration.name}`);
      
      try {
        await migration.up(db);
        await recordMigration(db, migration.version, migration.name);
        console.log(`[Database] Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`[Database] Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }
  
  console.log(`[Database] All migrations completed. Current version: ${migrations.length}`);
};

export const rollbackMigration = async (
  db: SQLite.SQLiteDatabase,
  targetVersion: number
): Promise<void> => {
  const currentVersion = await getCurrentVersion(db);
  
  if (targetVersion >= currentVersion) {
    console.log(`[Database] No rollback needed. Current: ${currentVersion}, Target: ${targetVersion}`);
    return;
  }
  
  // Rollback migrations in reverse order
  const migrationsToRollback = migrations
    .filter(m => m.version > targetVersion && m.version <= currentVersion)
    .sort((a, b) => b.version - a.version);
  
  for (const migration of migrationsToRollback) {
    console.log(`[Database] Rolling back migration ${migration.version}: ${migration.name}`);
    
    try {
      await migration.down(db);
      await db.runAsync('DELETE FROM schema_version WHERE version = ?', [migration.version]);
      console.log(`[Database] Rollback ${migration.version} completed`);
    } catch (error) {
      console.error(`[Database] Rollback ${migration.version} failed:`, error);
      throw error;
    }
  }
};

export { migrations };

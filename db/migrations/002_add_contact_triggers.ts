import * as SQLite from 'expo-sqlite';

export const up = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    
    -- Add last_interaction_at and total_activities columns to contacts if not exists
    ALTER TABLE contacts ADD COLUMN last_interaction_at INTEGER;
    ALTER TABLE contacts ADD COLUMN total_activities INTEGER DEFAULT 0;
    
    -- Create index for last_interaction_at
    CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction_at);
    
    -- Trigger: Update contact last_interaction_at after activity insert
    CREATE TRIGGER IF NOT EXISTS trigger_update_contact_interaction
    AFTER INSERT ON activities
    BEGIN
      UPDATE contacts 
      SET last_interaction_at = NEW.started_at,
          updated_at = NEW.started_at
      WHERE id IN (
        SELECT contact_id FROM activity_participants WHERE activity_id = NEW.id
      );
    END;
    
    -- Trigger: Update contact total_activities after activity_participants insert
    CREATE TRIGGER IF NOT EXISTS trigger_increment_activity_count
    AFTER INSERT ON activity_participants
    BEGIN
      UPDATE contacts
      SET total_activities = total_activities + 1
      WHERE id = NEW.contact_id;
    END;
    
    -- Trigger: Update contact total_activities after activity_participants delete
    CREATE TRIGGER IF NOT EXISTS trigger_decrement_activity_count
    AFTER DELETE ON activity_participants
    BEGIN
      UPDATE contacts
      SET total_activities = CASE 
        WHEN total_activities > 0 THEN total_activities - 1 
        ELSE 0 
      END
      WHERE id = OLD.contact_id;
    END;
  `);
};

export const down = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    DROP TRIGGER IF EXISTS trigger_update_contact_interaction;
    DROP TRIGGER IF EXISTS trigger_increment_activity_count;
    DROP TRIGGER IF EXISTS trigger_decrement_activity_count;
    DROP INDEX IF EXISTS idx_contacts_last_interaction;
  `);
  
  // Note: SQLite doesn't support DROP COLUMN, so we can't remove the columns
  // They will remain but won't be used
};

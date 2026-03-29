import * as SQLite from 'expo-sqlite';
import { Contact, Interaction, ActionItem } from '@/types';

const DB_NAME = 'blackbook.db';

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT,
      company TEXT,
      avatar TEXT,
      phone TEXT,
      email TEXT,
      wechat TEXT,
      tags TEXT DEFAULT '[]',
      taboos TEXT DEFAULT '[]',
      preferences TEXT DEFAULT '[]',
      health_issues TEXT DEFAULT '[]',
      family_members TEXT DEFAULT '[]',
      notes TEXT,
      priority TEXT DEFAULT 'medium',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
    CREATE INDEX IF NOT EXISTS idx_contacts_priority ON contacts(priority);
    
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      raw_transcript TEXT,
      extracted_entities TEXT DEFAULT '[]',
      action_items TEXT DEFAULT '[]',
      location TEXT,
      date INTEGER NOT NULL,
      value_exchange TEXT DEFAULT 'neutral',
      value_description TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date);
    
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      due_date INTEGER,
      priority TEXT DEFAULT 'medium',
      related_contact_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (related_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_action_items_contact ON action_items(related_contact_id);
    CREATE INDEX IF NOT EXISTS idx_action_items_completed ON action_items(completed);
  `);
  
  return db;
};

export const getDatabase = async () => {
  return await SQLite.openDatabaseAsync(DB_NAME);
};

export const createContact = async (db: SQLite.SQLiteDatabase, contact: Contact): Promise<void> => {
  await db.runAsync(
    `INSERT INTO contacts (id, name, title, company, avatar, phone, email, wechat, 
     tags, taboos, preferences, health_issues, family_members, notes, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      contact.id,
      contact.name,
      contact.title || null,
      contact.company || null,
      contact.avatar || null,
      contact.phone || null,
      contact.email || null,
      contact.wechat || null,
      JSON.stringify(contact.tags),
      JSON.stringify(contact.taboos),
      JSON.stringify(contact.preferences),
      JSON.stringify(contact.healthIssues),
      JSON.stringify(contact.familyMembers),
      contact.notes || null,
      contact.priority,
      contact.createdAt,
      contact.updatedAt,
    ]
  );
};

export const updateContact = async (db: SQLite.SQLiteDatabase, contact: Contact): Promise<void> => {
  await db.runAsync(
    `UPDATE contacts SET 
     name = ?, title = ?, company = ?, avatar = ?, phone = ?, email = ?, wechat = ?,
     tags = ?, taboos = ?, preferences = ?, health_issues = ?, family_members = ?, 
     notes = ?, priority = ?, updated_at = ?
     WHERE id = ?`,
    [
      contact.name,
      contact.title || null,
      contact.company || null,
      contact.avatar || null,
      contact.phone || null,
      contact.email || null,
      contact.wechat || null,
      JSON.stringify(contact.tags),
      JSON.stringify(contact.taboos),
      JSON.stringify(contact.preferences),
      JSON.stringify(contact.healthIssues),
      JSON.stringify(contact.familyMembers),
      contact.notes || null,
      contact.priority,
      Date.now(),
      contact.id,
    ]
  );
};

export const getAllContacts = async (db: SQLite.SQLiteDatabase): Promise<Contact[]> => {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM contacts ORDER BY priority DESC, updated_at DESC'
  );
  return rows.map(parseContactRow);
};

export const getContactById = async (db: SQLite.SQLiteDatabase, id: string): Promise<Contact | null> => {
  const row = await db.getFirstAsync<any>('SELECT * FROM contacts WHERE id = ?', [id]);
  return row ? parseContactRow(row) : null;
};

export const searchContacts = async (db: SQLite.SQLiteDatabase, query: string): Promise<Contact[]> => {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM contacts 
     WHERE name LIKE ? OR title LIKE ? OR company LIKE ? OR notes LIKE ?
     ORDER BY priority DESC, updated_at DESC`,
    [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
  );
  return rows.map(parseContactRow);
};

export const deleteContact = async (db: SQLite.SQLiteDatabase, id: string): Promise<void> => {
  await db.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
};

export const createInteraction = async (db: SQLite.SQLiteDatabase, interaction: Interaction): Promise<void> => {
  await db.runAsync(
    `INSERT INTO interactions (id, contact_id, type, content, raw_transcript, 
     extracted_entities, action_items, location, date, value_exchange, value_description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      interaction.id,
      interaction.contactId,
      interaction.type,
      interaction.content,
      interaction.rawTranscript || null,
      JSON.stringify(interaction.extractedEntities),
      JSON.stringify(interaction.actionItems),
      interaction.location || null,
      interaction.date,
      interaction.valueExchange,
      interaction.valueDescription || null,
      interaction.createdAt,
    ]
  );
};

export const getInteractionsByContact = async (db: SQLite.SQLiteDatabase, contactId: string): Promise<Interaction[]> => {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC',
    [contactId]
  );
  return rows.map(parseInteractionRow);
};

export const updateInteraction = async (db: SQLite.SQLiteDatabase, interaction: Interaction): Promise<void> => {
  await db.runAsync(
    `UPDATE interactions SET 
     type = ?, content = ?, raw_transcript = ?, extracted_entities = ?, 
     action_items = ?, location = ?, date = ?, value_exchange = ?, value_description = ?
     WHERE id = ?`,
    [
      interaction.type,
      interaction.content,
      interaction.rawTranscript || null,
      JSON.stringify(interaction.extractedEntities),
      JSON.stringify(interaction.actionItems),
      interaction.location || null,
      interaction.date,
      interaction.valueExchange,
      interaction.valueDescription || null,
      interaction.id,
    ]
  );
};

export const deleteInteraction = async (db: SQLite.SQLiteDatabase, id: string): Promise<void> => {
  await db.runAsync('DELETE FROM interactions WHERE id = ?', [id]);
};

export const deleteAllData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.runAsync('DELETE FROM action_items');
  await db.runAsync('DELETE FROM interactions');
  await db.runAsync('DELETE FROM contacts');
};

// ActionItem CRUD Operations
export const createActionItem = async (db: SQLite.SQLiteDatabase, actionItem: ActionItem): Promise<void> => {
  await db.runAsync(
    `INSERT INTO action_items (id, description, completed, due_date, priority, related_contact_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      actionItem.id,
      actionItem.description,
      actionItem.completed ? 1 : 0,
      actionItem.dueDate || null,
      actionItem.priority,
      actionItem.relatedContactId || null,
      actionItem.createdAt,
    ]
  );
};

export const getActionItemsByContact = async (db: SQLite.SQLiteDatabase, contactId: string): Promise<ActionItem[]> => {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM action_items 
     WHERE related_contact_id = ? 
     ORDER BY completed ASC, 
              CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
              END, 
              created_at DESC`,
    [contactId]
  );
  return rows.map(parseActionItemRow);
};

export const getAllActionItems = async (db: SQLite.SQLiteDatabase): Promise<ActionItem[]> => {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM action_items 
     ORDER BY completed ASC, 
              CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
              END, 
              created_at DESC`
  );
  return rows.map(parseActionItemRow);
};

export const getPendingActionItems = async (db: SQLite.SQLiteDatabase, limit?: number): Promise<ActionItem[]> => {
  let query = `SELECT * FROM action_items 
               WHERE completed = 0 
               ORDER BY CASE priority 
                 WHEN 'high' THEN 1 
                 WHEN 'medium' THEN 2 
                 WHEN 'low' THEN 3 
               END, 
               created_at DESC`;
  
  if (limit) {
    query += ` LIMIT ${limit}`;
  }
  
  const rows = await db.getAllAsync<any>(query);
  return rows.map(parseActionItemRow);
};

export const updateActionItem = async (db: SQLite.SQLiteDatabase, actionItem: ActionItem): Promise<void> => {
  await db.runAsync(
    `UPDATE action_items SET 
     description = ?, completed = ?, due_date = ?, priority = ?, related_contact_id = ?
     WHERE id = ?`,
    [
      actionItem.description,
      actionItem.completed ? 1 : 0,
      actionItem.dueDate || null,
      actionItem.priority,
      actionItem.relatedContactId || null,
      actionItem.id,
    ]
  );
};

export const deleteActionItem = async (db: SQLite.SQLiteDatabase, id: string): Promise<void> => {
  await db.runAsync('DELETE FROM action_items WHERE id = ?', [id]);
};

export const toggleActionItemComplete = async (db: SQLite.SQLiteDatabase, id: string, completed: boolean): Promise<void> => {
  await db.runAsync(
    'UPDATE action_items SET completed = ? WHERE id = ?',
    [completed ? 1 : 0, id]
  );
};

const parseActionItemRow = (row: any): ActionItem => ({
  id: row.id,
  description: row.description,
  completed: Boolean(row.completed),
  dueDate: row.due_date,
  priority: row.priority,
  relatedContactId: row.related_contact_id,
  createdAt: row.created_at,
});

const parseContactRow = (row: any): Contact => ({
  id: row.id,
  name: row.name,
  title: row.title,
  company: row.company,
  avatar: row.avatar,
  phone: row.phone,
  email: row.email,
  wechat: row.wechat,
  tags: JSON.parse(row.tags),
  taboos: JSON.parse(row.taboos),
  preferences: JSON.parse(row.preferences),
  healthIssues: JSON.parse(row.health_issues),
  familyMembers: JSON.parse(row.family_members),
  notes: row.notes,
  priority: row.priority,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const parseInteractionRow = (row: any): Interaction => ({
  id: row.id,
  contactId: row.contact_id,
  type: row.type,
  content: row.content,
  rawTranscript: row.raw_transcript,
  extractedEntities: JSON.parse(row.extracted_entities),
  actionItems: JSON.parse(row.action_items),
  location: row.location,
  date: row.date,
  valueExchange: row.value_exchange,
  valueDescription: row.value_description,
  createdAt: row.created_at,
});

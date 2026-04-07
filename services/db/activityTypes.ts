import * as SQLite from 'expo-sqlite';
import { ActivityType, CreateActivityTypeInput, ActivityCategory, DEFAULT_ACTIVITY_TYPES } from '@/types/database';

const parseActivityTypeRow = (row: any): ActivityType => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  category: row.category as ActivityCategory,
  createdAt: row.created_at,
});

export const createActivityType = async (
  db: SQLite.SQLiteDatabase,
  type: CreateActivityTypeInput
): Promise<string> => {
  const id = `type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.runAsync(
    `INSERT INTO activity_types (id, user_id, name, icon, color, category, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, type.userId, type.name, type.icon, type.color, type.category, Date.now()]
  );

  return id;
};

export const getActivityTypeById = async (
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<ActivityType | null> => {
  const row = await db.getFirstAsync<any>('SELECT * FROM activity_types WHERE id = ?', [id]);
  return row ? parseActivityTypeRow(row) : null;
};

export const getActivityTypeByName = async (
  db: SQLite.SQLiteDatabase,
  name: string,
  userId?: string
): Promise<ActivityType | null> => {
  let query = 'SELECT * FROM activity_types WHERE name = ? AND (user_id IS NULL';
  const params: any[] = [name];

  if (userId) {
    query += ' OR user_id = ?';
    params.push(userId);
  }
  query += ')';

  const row = await db.getFirstAsync<any>(query, params);
  return row ? parseActivityTypeRow(row) : null;
};

export const getAllActivityTypes = async (
  db: SQLite.SQLiteDatabase,
  userId?: string
): Promise<ActivityType[]> => {
  let query = 'SELECT * FROM activity_types WHERE user_id IS NULL';
  const params: any[] = [];

  if (userId) {
    query += ' OR user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY category, name';

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(parseActivityTypeRow);
};

export const getActivityTypesByCategory = async (
  db: SQLite.SQLiteDatabase,
  category: ActivityCategory,
  userId?: string
): Promise<ActivityType[]> => {
  let query = 'SELECT * FROM activity_types WHERE category = ? AND (user_id IS NULL';
  const params: any[] = [category];

  if (userId) {
    query += ' OR user_id = ?';
    params.push(userId);
  }
  query += ') ORDER BY name';

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(parseActivityTypeRow);
};

export const getUserActivityTypes = async (
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<ActivityType[]> => {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM activity_types WHERE user_id = ? ORDER BY category, name',
    [userId]
  );
  return rows.map(parseActivityTypeRow);
};

export const updateActivityType = async (
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<Omit<ActivityType, 'id' | 'createdAt' | 'userId'>>
): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(
    `UPDATE activity_types SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteActivityType = async (
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> => {
  await db.runAsync('DELETE FROM activity_types WHERE id = ?', [id]);
};

export const deleteUserActivityTypes = async (
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<void> => {
  await db.runAsync('DELETE FROM activity_types WHERE user_id = ?', [userId]);
};

export const isActivityTypeNameTaken = async (
  db: SQLite.SQLiteDatabase,
  name: string,
  userId?: string
): Promise<boolean> => {
  let query = 'SELECT COUNT(*) as count FROM activity_types WHERE name = ? AND (user_id IS NULL';
  const params: any[] = [name];

  if (userId) {
    query += ' OR user_id = ?';
    params.push(userId);
  }
  query += ')';

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return (result?.count || 0) > 0;
};

export const getActivityTypeCategories = async (
  db: SQLite.SQLiteDatabase
): Promise<ActivityCategory[]> => {
  const rows = await db.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM activity_types ORDER BY category'
  );
  return rows.map(row => row.category as ActivityCategory);
};

export const initializeDefaultActivityTypes = async (
  db: SQLite.SQLiteDatabase
): Promise<void> => {
  const now = Date.now();

  for (const type of DEFAULT_ACTIVITY_TYPES) {
    const exists = await getActivityTypeByName(db, type.name);
    if (!exists) {
      await db.runAsync(
        `INSERT INTO activity_types (id, user_id, name, icon, color, category, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`type_${type.name}`, null, type.name, type.icon, type.color, type.category, now]
      );
    }
  }
};

export const getActivityTypeUsageCount = async (
  db: SQLite.SQLiteDatabase,
  activityTypeName: string
): Promise<number> => {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM activities WHERE activity_type = ?',
    [activityTypeName]
  );
  return result?.count || 0;
};

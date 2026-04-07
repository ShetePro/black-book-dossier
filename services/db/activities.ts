import * as SQLite from 'expo-sqlite';
import { Activity, ActivityWithParticipants, CreateActivityInput, UpdateActivityInput, ActivityQueryFilters, ActivityStats } from '@/types/database';

const parseActivityRow = (row: any): Activity => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  activityType: row.activity_type,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  locationName: row.location_name,
  locationLat: row.location_lat,
  locationLng: row.location_lng,
  rawInput: row.raw_input,
  aiAnalysis: JSON.parse(row.ai_analysis || '{}'),
  sentiment: row.sentiment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createActivity = async (
  db: SQLite.SQLiteDatabase,
  activity: CreateActivityInput
): Promise<string> => {
  const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO activities (
      id, user_id, title, description, activity_type, started_at, ended_at,
      location_name, location_lat, location_lng, raw_input, ai_analysis, sentiment,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      activity.userId,
      activity.title,
      activity.description,
      activity.activityType,
      activity.startedAt,
      activity.endedAt,
      activity.locationName,
      activity.locationLat,
      activity.locationLng,
      activity.rawInput,
      JSON.stringify(activity.aiAnalysis),
      activity.sentiment,
      now,
      now,
    ]
  );

  return id;
};

export const getActivityById = async (
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Activity | null> => {
  const row = await db.getFirstAsync<any>('SELECT * FROM activities WHERE id = ?', [id]);
  return row ? parseActivityRow(row) : null;
};

export const getActivityWithParticipants = async (
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<ActivityWithParticipants | null> => {
  const activity = await getActivityById(db, id);
  if (!activity) return null;

  const participants = await db.getAllAsync<any>(
    `SELECT 
      ap.*,
      c.name as contact_name,
      c.avatar as contact_avatar
    FROM activity_participants ap
    JOIN contacts c ON ap.contact_id = c.id
    WHERE ap.activity_id = ?`,
    [id]
  );

  return {
    ...activity,
    participants: participants.map(p => ({
      id: p.id,
      activityId: p.activity_id,
      contactId: p.contact_id,
      role: p.role,
      notes: p.notes,
      createdAt: p.created_at,
      contactName: p.contact_name,
      contactAvatar: p.contact_avatar,
    })),
  };
};

export const getActivities = async (
  db: SQLite.SQLiteDatabase,
  filters: ActivityQueryFilters = {}
): Promise<Activity[]> => {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }

  if (filters.activityType) {
    conditions.push('activity_type = ?');
    params.push(filters.activityType);
  }

  if (filters.startDate) {
    conditions.push('started_at >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push('started_at <= ?');
    params.push(filters.endDate);
  }

  if (filters.sentiment) {
    conditions.push('sentiment = ?');
    params.push(filters.sentiment);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = filters.limit ? `LIMIT ${filters.limit}` : '';
  const offsetClause = filters.offset ? `OFFSET ${filters.offset}` : '';

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM activities ${whereClause} ORDER BY started_at DESC ${limitClause} ${offsetClause}`,
    params
  );

  return rows.map(parseActivityRow);
};

export const getActivitiesByContact = async (
  db: SQLite.SQLiteDatabase,
  contactId: string,
  limit?: number
): Promise<Activity[]> => {
  let query = `
    SELECT a.* FROM activities a
    JOIN activity_participants ap ON a.id = ap.activity_id
    WHERE ap.contact_id = ?
    ORDER BY a.started_at DESC
  `;

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  const rows = await db.getAllAsync<any>(query, [contactId]);
  return rows.map(parseActivityRow);
};

export const updateActivity = async (
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateActivityInput
): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.activityType !== undefined) {
    fields.push('activity_type = ?');
    values.push(updates.activityType);
  }
  if (updates.startedAt !== undefined) {
    fields.push('started_at = ?');
    values.push(updates.startedAt);
  }
  if (updates.endedAt !== undefined) {
    fields.push('ended_at = ?');
    values.push(updates.endedAt);
  }
  if (updates.locationName !== undefined) {
    fields.push('location_name = ?');
    values.push(updates.locationName);
  }
  if (updates.locationLat !== undefined) {
    fields.push('location_lat = ?');
    values.push(updates.locationLat);
  }
  if (updates.locationLng !== undefined) {
    fields.push('location_lng = ?');
    values.push(updates.locationLng);
  }
  if (updates.rawInput !== undefined) {
    fields.push('raw_input = ?');
    values.push(updates.rawInput);
  }
  if (updates.aiAnalysis !== undefined) {
    fields.push('ai_analysis = ?');
    values.push(JSON.stringify(updates.aiAnalysis));
  }
  if (updates.sentiment !== undefined) {
    fields.push('sentiment = ?');
    values.push(updates.sentiment);
  }

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  await db.runAsync(
    `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteActivity = async (
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> => {
  await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
};

export const getActivityStats = async (
  db: SQLite.SQLiteDatabase,
  userId?: string
): Promise<ActivityStats> => {
  const params: any[] = [];
  let whereClause = '';

  if (userId) {
    whereClause = 'WHERE user_id = ?';
    params.push(userId);
  }

  const totalResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM activities ${whereClause}`,
    params
  );

  const byTypeRows = await db.getAllAsync<{ activity_type: string; count: number }>(
    `SELECT activity_type, COUNT(*) as count FROM activities ${whereClause} GROUP BY activity_type`,
    params
  );

  const byMonthRows = await db.getAllAsync<{ month: string; count: number }>(
    `SELECT 
      strftime('%Y-%m', datetime(started_at / 1000, 'unixepoch')) as month,
      COUNT(*) as count 
    FROM activities ${whereClause} 
    GROUP BY month 
    ORDER BY month DESC`,
    params
  );

  const byContactRows = await db.getAllAsync<{ contact_id: string; contact_name: string; count: number }>(
    `SELECT 
      c.id as contact_id,
      c.name as contact_name,
      COUNT(*) as count
    FROM contacts c
    JOIN activity_participants ap ON c.id = ap.contact_id
    JOIN activities a ON ap.activity_id = a.id
    ${userId ? 'WHERE a.user_id = ?' : ''}
    GROUP BY c.id, c.name
    ORDER BY count DESC
    LIMIT 10`,
    userId ? [userId] : []
  );

  const byType: Record<string, number> = {};
  byTypeRows.forEach(row => {
    byType[row.activity_type] = row.count;
  });

  const byMonth: Record<string, number> = {};
  byMonthRows.forEach(row => {
    byMonth[row.month] = row.count;
  });

  return {
    totalCount: totalResult?.count || 0,
    byType,
    byMonth,
    byContact: byContactRows.map(row => ({
      contactId: row.contact_id,
      contactName: row.contact_name,
      count: row.count,
    })),
  };
};

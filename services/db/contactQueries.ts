import * as SQLite from 'expo-sqlite';
import { DormantContact, ContactActivitySummary } from '@/types/database';

export const getDormantContacts = async (
  db: SQLite.SQLiteDatabase,
  daysThreshold: number = 90,
  limit: number = 20
): Promise<DormantContact[]> => {
  const thresholdTimestamp = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

  const rows = await db.getAllAsync<any>(
    `SELECT 
      c.id as contact_id,
      c.name as contact_name,
      c.avatar as contact_avatar,
      c.last_interaction_at,
      c.total_activities,
      (CAST(? AS INTEGER) - CAST(c.last_interaction_at AS INTEGER)) / (24 * 60 * 60 * 1000) as days_since
    FROM contacts c
    WHERE c.last_interaction_at IS NOT NULL
      AND c.last_interaction_at < ?
    ORDER BY c.last_interaction_at ASC
    LIMIT ?`,
    [Date.now(), thresholdTimestamp, limit]
  );

  return rows.map(row => ({
    contactId: row.contact_id,
    contactName: row.contact_name,
    contactAvatar: row.contact_avatar,
    lastInteractionAt: row.last_interaction_at,
    daysSinceLastInteraction: Math.floor(row.days_since),
    totalActivities: row.total_activities,
  }));
};

export const getContactActivitySummary = async (
  db: SQLite.SQLiteDatabase,
  contactId: string
): Promise<ContactActivitySummary | null> => {
  const contact = await db.getFirstAsync<any>(
    `SELECT id, last_interaction_at, total_activities 
     FROM contacts WHERE id = ?`,
    [contactId]
  );

  if (!contact) return null;

  const recentActivities = await db.getAllAsync<{ id: string; title: string; started_at: number }>(
    `SELECT a.id, a.title, a.started_at
     FROM activities a
     JOIN activity_participants ap ON a.id = ap.activity_id
     WHERE ap.contact_id = ?
     ORDER BY a.started_at DESC
     LIMIT 5`,
    [contactId]
  );

  return {
    contactId: contact.id,
    lastInteractionAt: contact.last_interaction_at,
    totalActivities: contact.total_activities,
    recentActivities: recentActivities.map(a => ({
      id: a.id,
      userId: null,
      title: a.title,
      description: null,
      activityType: '',
      startedAt: a.started_at,
      endedAt: null,
      locationName: null,
      locationLat: null,
      locationLng: null,
      rawInput: null,
      aiAnalysis: {},
      sentiment: null,
      createdAt: a.started_at,
      updatedAt: a.started_at,
    })),
  };
};

export const getContactsByActivityType = async (
  db: SQLite.SQLiteDatabase,
  activityTypes: string[],
  limit: number = 50
): Promise<Array<{ contactId: string; contactName: string; activityCount: number }>> => {
  const placeholders = activityTypes.map(() => '?').join(',');

  const rows = await db.getAllAsync<any>(
    `SELECT 
      c.id as contact_id,
      c.name as contact_name,
      COUNT(DISTINCT a.id) as activity_count
    FROM contacts c
    JOIN activity_participants ap ON c.id = ap.contact_id
    JOIN activities a ON ap.activity_id = a.id
    WHERE a.activity_type IN (${placeholders})
    GROUP BY c.id, c.name
    ORDER BY activity_count DESC
    LIMIT ?`,
    [...activityTypes, limit]
  );

  return rows.map(row => ({
    contactId: row.contact_id,
    contactName: row.contact_name,
    activityCount: row.activity_count,
  }));
};

export const getActivityCountByContact = async (
  db: SQLite.SQLiteDatabase,
  contactId: string,
  activityTypes?: string[]
): Promise<number> => {
  let query = `
    SELECT COUNT(DISTINCT a.id) as count
    FROM activities a
    JOIN activity_participants ap ON a.id = ap.activity_id
    WHERE ap.contact_id = ?
  `;
  const params: any[] = [contactId];

  if (activityTypes && activityTypes.length > 0) {
    const placeholders = activityTypes.map(() => '?').join(',');
    query += ` AND a.activity_type IN (${placeholders})`;
    params.push(...activityTypes);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count || 0;
};

export const getMostActiveContacts = async (
  db: SQLite.SQLiteDatabase,
  limit: number = 10
): Promise<Array<{ contactId: string; contactName: string; activityCount: number }>> => {
  const rows = await db.getAllAsync<any>(
    `SELECT 
      c.id as contact_id,
      c.name as contact_name,
      COUNT(ap.id) as activity_count
    FROM contacts c
    LEFT JOIN activity_participants ap ON c.id = ap.contact_id
    GROUP BY c.id, c.name
    ORDER BY activity_count DESC
    LIMIT ?`,
    [limit]
  );

  return rows.map(row => ({
    contactId: row.contact_id,
    contactName: row.contact_name,
    activityCount: row.activity_count,
  }));
};

export const getContactsNeedingAttention = async (
  db: SQLite.SQLiteDatabase,
  highPriorityDays: number = 30,
  mediumPriorityDays: number = 90
): Promise<{
  high: DormantContact[];
  medium: DormantContact[];
}> => {
  const now = Date.now();
  const highThreshold = now - highPriorityDays * 24 * 60 * 60 * 1000;
  const mediumThreshold = now - mediumPriorityDays * 24 * 60 * 60 * 1000;

  const [highPriority, mediumPriority] = await Promise.all([
    db.getAllAsync<any>(
      `SELECT 
        c.id as contact_id,
        c.name as contact_name,
        c.avatar as contact_avatar,
        c.last_interaction_at,
        c.total_activities,
        (CAST(? AS INTEGER) - CAST(c.last_interaction_at AS INTEGER)) / (24 * 60 * 60 * 1000) as days_since
      FROM contacts c
      WHERE c.last_interaction_at IS NOT NULL
        AND c.last_interaction_at < ?
      ORDER BY c.last_interaction_at ASC`,
      [now, highThreshold]
    ),
    db.getAllAsync<any>(
      `SELECT 
        c.id as contact_id,
        c.name as contact_name,
        c.avatar as contact_avatar,
        c.last_interaction_at,
        c.total_activities,
        (CAST(? AS INTEGER) - CAST(c.last_interaction_at AS INTEGER)) / (24 * 60 * 60 * 1000) as days_since
      FROM contacts c
      WHERE c.last_interaction_at IS NOT NULL
        AND c.last_interaction_at >= ?
        AND c.last_interaction_at < ?
      ORDER BY c.last_interaction_at ASC`,
      [now, highThreshold, mediumThreshold]
    ),
  ]);

  const mapToDormant = (rows: any[]): DormantContact[] =>
    rows.map(row => ({
      contactId: row.contact_id,
      contactName: row.contact_name,
      contactAvatar: row.contact_avatar,
      lastInteractionAt: row.last_interaction_at,
      daysSinceLastInteraction: Math.floor(row.days_since),
      totalActivities: row.total_activities,
    }));

  return {
    high: mapToDormant(highPriority),
    medium: mapToDormant(mediumPriority),
  };
};

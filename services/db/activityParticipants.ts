import * as SQLite from 'expo-sqlite';
import { ActivityParticipant, CreateActivityParticipantInput } from '@/types/database';

const parseParticipantRow = (row: any): ActivityParticipant => ({
  id: row.id,
  activityId: row.activity_id,
  contactId: row.contact_id,
  role: row.role,
  notes: row.notes,
  createdAt: row.created_at,
});

export const addParticipant = async (
  db: SQLite.SQLiteDatabase,
  participant: CreateActivityParticipantInput
): Promise<string> => {
  const id = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO activity_participants (id, activity_id, contact_id, role, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, participant.activityId, participant.contactId, participant.role, participant.notes, now]
  );

  return id;
};

export const addParticipants = async (
  db: SQLite.SQLiteDatabase,
  activityId: string,
  contactIds: string[],
  role?: string
): Promise<void> => {
  const now = Date.now();

  for (const contactId of contactIds) {
    const id = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${contactId}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO activity_participants (id, activity_id, contact_id, role, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, activityId, contactId, role || null, now]
    );
  }
};

export const getParticipantsByActivity = async (
  db: SQLite.SQLiteDatabase,
  activityId: string
): Promise<ActivityParticipant[]> => {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM activity_participants WHERE activity_id = ? ORDER BY created_at',
    [activityId]
  );
  return rows.map(parseParticipantRow);
};

export const getParticipantsWithContactInfo = async (
  db: SQLite.SQLiteDatabase,
  activityId: string
): Promise<Array<ActivityParticipant & { contactName: string; contactAvatar: string | null }>> => {
  const rows = await db.getAllAsync<any>(
    `SELECT 
      ap.*,
      c.name as contact_name,
      c.avatar as contact_avatar
    FROM activity_participants ap
    JOIN contacts c ON ap.contact_id = c.id
    WHERE ap.activity_id = ?
    ORDER BY ap.created_at`,
    [activityId]
  );

  return rows.map(row => ({
    id: row.id,
    activityId: row.activity_id,
    contactId: row.contact_id,
    role: row.role,
    notes: row.notes,
    createdAt: row.created_at,
    contactName: row.contact_name,
    contactAvatar: row.contact_avatar,
  }));
};

export const getActivitiesByParticipant = async (
  db: SQLite.SQLiteDatabase,
  contactId: string
): Promise<string[]> => {
  const rows = await db.getAllAsync<{ activity_id: string }>(
    'SELECT activity_id FROM activity_participants WHERE contact_id = ? ORDER BY created_at DESC',
    [contactId]
  );
  return rows.map(row => row.activity_id);
};

export const updateParticipantRole = async (
  db: SQLite.SQLiteDatabase,
  participantId: string,
  role: string
): Promise<void> => {
  await db.runAsync(
    'UPDATE activity_participants SET role = ? WHERE id = ?',
    [role, participantId]
  );
};

export const updateParticipantNotes = async (
  db: SQLite.SQLiteDatabase,
  participantId: string,
  notes: string
): Promise<void> => {
  await db.runAsync(
    'UPDATE activity_participants SET notes = ? WHERE id = ?',
    [notes, participantId]
  );
};

export const removeParticipant = async (
  db: SQLite.SQLiteDatabase,
  participantId: string
): Promise<void> => {
  await db.runAsync('DELETE FROM activity_participants WHERE id = ?', [participantId]);
};

export const removeParticipantByActivityAndContact = async (
  db: SQLite.SQLiteDatabase,
  activityId: string,
  contactId: string
): Promise<void> => {
  await db.runAsync(
    'DELETE FROM activity_participants WHERE activity_id = ? AND contact_id = ?',
    [activityId, contactId]
  );
};

export const removeAllParticipantsFromActivity = async (
  db: SQLite.SQLiteDatabase,
  activityId: string
): Promise<void> => {
  await db.runAsync('DELETE FROM activity_participants WHERE activity_id = ?', [activityId]);
};

export const getParticipantCount = async (
  db: SQLite.SQLiteDatabase,
  activityId: string
): Promise<number> => {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM activity_participants WHERE activity_id = ?',
    [activityId]
  );
  return result?.count || 0;
};

export const isParticipant = async (
  db: SQLite.SQLiteDatabase,
  activityId: string,
  contactId: string
): Promise<boolean> => {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM activity_participants WHERE activity_id = ? AND contact_id = ?',
    [activityId, contactId]
  );
  return (result?.count || 0) > 0;
};

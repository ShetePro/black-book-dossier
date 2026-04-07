/**
 * Database Type Definitions
 * TypeScript types for activities, activity_participants, and activity_types tables
 */

// Activity Categories
export type ActivityCategory = 
  | 'sports' 
  | 'work' 
  | 'social' 
  | 'entertainment' 
  | 'travel' 
  | 'other';

// Activity Sentiment
export type ActivitySentiment = 
  | 'positive' 
  | 'neutral' 
  | 'negative';

// Participant Role
export type ParticipantRole = 
  | 'organizer' 
  | 'participant' 
  | 'observer' 
  | string;

// Location coordinates
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

// AI Analysis result stored as JSON
export interface AIAnalysis {
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  summary?: string;
  keyPoints?: string[];
  suggestions?: string[];
  [key: string]: unknown;
}

// Main Activity interface
export interface Activity {
  id: string;
  userId: string | null;
  title: string;
  description: string | null;
  activityType: string;
  startedAt: number;
  endedAt: number | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  rawInput: string | null;
  aiAnalysis: AIAnalysis;
  sentiment: ActivitySentiment | null;
  createdAt: number;
  updatedAt: number;
}

// Activity with participants (for queries)
export interface ActivityWithParticipants extends Activity {
  participants: ActivityParticipantWithContact[];
}

// Activity Participant interface
export interface ActivityParticipant {
  id: string;
  activityId: string;
  contactId: string;
  role: ParticipantRole | null;
  notes: string | null;
  createdAt: number;
}

// Activity Participant with contact info (for queries)
export interface ActivityParticipantWithContact extends ActivityParticipant {
  contactName: string;
  contactAvatar: string | null;
}

// Activity Type interface
export interface ActivityType {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  category: ActivityCategory;
  createdAt: number;
}

// Default activity type definitions
export const DEFAULT_ACTIVITY_TYPES: Omit<ActivityType, 'id' | 'createdAt'>[] = [
  { userId: null, name: 'basketball', icon: 'basketball-outline', color: '#FF6B6B', category: 'sports' },
  { userId: null, name: 'hiking', icon: 'walk-outline', color: '#4ECDC4', category: 'sports' },
  { userId: null, name: 'meeting', icon: 'people-outline', color: '#45B7D1', category: 'work' },
  { userId: null, name: 'dinner', icon: 'restaurant-outline', color: '#FFA07A', category: 'social' },
  { userId: null, name: 'coffee', icon: 'cafe-outline', color: '#8B4513', category: 'social' },
  { userId: null, name: 'movie', icon: 'film-outline', color: '#9B59B6', category: 'entertainment' },
  { userId: null, name: 'travel', icon: 'airplane-outline', color: '#3498DB', category: 'travel' },
];

// Query filters
export interface ActivityQueryFilters {
  userId?: string;
  activityType?: string;
  contactId?: string;
  startDate?: number;
  endDate?: number;
  sentiment?: ActivitySentiment;
  limit?: number;
  offset?: number;
}

// Activity statistics
export interface ActivityStats {
  totalCount: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
  byContact: Array<{
    contactId: string;
    contactName: string;
    count: number;
  }>;
}

// Contact activity summary (for contact list)
export interface ContactActivitySummary {
  contactId: string;
  lastInteractionAt: number | null;
  totalActivities: number;
  recentActivities: Activity[];
}

// Dormant contact (for reminder features)
export interface DormantContact {
  contactId: string;
  contactName: string;
  contactAvatar: string | null;
  lastInteractionAt: number;
  daysSinceLastInteraction: number;
  totalActivities: number;
}

// Create Activity input (omit auto-generated fields)
export type CreateActivityInput = Omit<
  Activity, 
  'id' | 'createdAt' | 'updatedAt'
>;

// Update Activity input (partial, omit immutable fields)
export type UpdateActivityInput = Partial<
  Omit<Activity, 'id' | 'createdAt'>
>;

// Create Activity Participant input
export type CreateActivityParticipantInput = Omit<
  ActivityParticipant,
  'id' | 'createdAt'
>;

// Create Activity Type input
export type CreateActivityTypeInput = Omit<
  ActivityType,
  'id' | 'createdAt'
>;

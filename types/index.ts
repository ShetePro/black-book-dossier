export interface Contact {
  id: string;
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  tags: string[];
  taboos: string[];
  preferences: string[];
  healthIssues: string[];
  familyMembers: FamilyMember[];
  notes: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
  updatedAt: number;
}

export interface FamilyMember {
  relation: string;
  name: string;
  age?: number;
  school?: string;
  occupation?: string;
  notes?: string;
}

export interface Interaction {
  id: string;
  contactId: string;
  type: 'meeting' | 'call' | 'message' | 'gift' | 'other';
  content: string;
  rawTranscript?: string;
  extractedEntities: ExtractedEntity[];
  actionItems: ActionItem[];
  location?: string;
  date: number;
  valueExchange: 'given' | 'received' | 'neutral';
  valueDescription?: string;
  createdAt: number;
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'health_issue' | 'need' | 'preference' | 'event' | 'date';
  value: string;
  confidence: number;
  context?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: number;
  priority: 'high' | 'medium' | 'low';
  relatedContactId?: string;
  createdAt: number;
}

export interface RecordingSession {
  id: string;
  uri: string;
  duration: number;
  transcript: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
  createdAt: number;
}

export interface AppSettings {
  hasCompletedOnboarding: boolean;
  useBiometricLock: boolean;
  decoyPassword: string | null;
  useDecoyMode: boolean;
  autoLockTimeout: number;
  lastActiveAt: number;
  language: string;
}

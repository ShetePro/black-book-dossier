import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '@/db/operations';
import { getDormantContacts, getContactsNeedingAttention } from '@/services/db/contactQueries';
import { DormantContact } from '@/types/database';

export interface Reminder {
  id: string;
  type: 'dormant_contact' | 'birthday' | 'anniversary' | 'suggestion';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  contactId?: string;
  contactName?: string;
  actionType: 'contact' | 'view' | 'dismiss';
  createdAt: number;
  expiresAt?: number;
}

export interface ReminderSettings {
  dormantContactThreshold: number;
  highPriorityDays: number;
  mediumPriorityDays: number;
  enablePushNotifications: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
}

const DEFAULT_SETTINGS: ReminderSettings = {
  dormantContactThreshold: 90,
  highPriorityDays: 30,
  mediumPriorityDays: 90,
  enablePushNotifications: true,
  reminderFrequency: 'weekly',
};

class ReminderService {
  private settings: ReminderSettings = DEFAULT_SETTINGS;
  private reminders: Reminder[] = [];
  private lastCheck: number = 0;

  async init(): Promise<void> {
    await this.loadSettings();
    await this.checkReminders();
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('reminder_settings');
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Use default settings
    }
  }

  async saveSettings(settings: Partial<ReminderSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    try {
      await AsyncStorage.setItem('reminder_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore save errors
    }
  }

  getSettings(): ReminderSettings {
    return { ...this.settings };
  }

  async checkReminders(): Promise<Reminder[]> {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (now - this.lastCheck < oneHour) {
      return this.reminders;
    }

    this.lastCheck = now;
    const newReminders: Reminder[] = [];

    try {
      const db = await getDatabase();

      const dormantContacts = await getDormantContacts(
        db,
        this.settings.dormantContactThreshold,
        10
      );

      dormantContacts.forEach((contact, index) => {
        const priority = contact.daysSinceLastInteraction > 180 ? 'high' : 'medium';

        newReminders.push({
          id: `dormant_${contact.contactId}_${now}`,
          type: 'dormant_contact',
          title: '关系维护提醒',
          description: `您已经 ${contact.daysSinceLastInteraction} 天没有联系 ${contact.contactName} 了`,
          priority,
          contactId: contact.contactId,
          contactName: contact.contactName,
          actionType: 'contact',
          createdAt: now,
        });
      });

      const needingAttention = await getContactsNeedingAttention(
        db,
        this.settings.highPriorityDays,
        this.settings.mediumPriorityDays
      );

      needingAttention.high.forEach((contact) => {
        if (!newReminders.find(r => r.contactId === contact.contactId)) {
          newReminders.push({
            id: `attention_${contact.contactId}_${now}`,
            type: 'suggestion',
            title: '重要关系提醒',
            description: `${contact.contactName} 已经超过 ${contact.daysSinceLastInteraction} 天没有联系，建议尽快维护关系`,
            priority: 'high',
            contactId: contact.contactId,
            contactName: contact.contactName,
            actionType: 'contact',
            createdAt: now,
          });
        }
      });

    } catch (error) {
      console.error('Failed to check reminders:', error);
    }

    this.reminders = this.mergeReminders(this.reminders, newReminders);
    return this.reminders;
  }

  private mergeReminders(old: Reminder[], newReminders: Reminder[]): Reminder[] {
    const merged = [...old];

    newReminders.forEach((newReminder) => {
      const existingIndex = merged.findIndex(
        r => r.contactId === newReminder.contactId && r.type === newReminder.type
      );

      if (existingIndex >= 0) {
        if (merged[existingIndex].priority !== newReminder.priority) {
          merged[existingIndex] = newReminder;
        }
      } else {
        merged.push(newReminder);
      }
    });

    return merged
      .filter(r => !r.expiresAt || r.expiresAt > Date.now())
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  getReminders(filter?: { type?: string; priority?: string }): Reminder[] {
    let filtered = this.reminders;

    if (filter?.type) {
      filtered = filtered.filter(r => r.type === filter.type);
    }

    if (filter?.priority) {
      filtered = filtered.filter(r => r.priority === filter.priority);
    }

    return filtered;
  }

  getHighPriorityReminders(): Reminder[] {
    return this.reminders.filter(r => r.priority === 'high');
  }

  dismissReminder(reminderId: string): void {
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
  }

  snoozeReminder(reminderId: string, hours: number = 24): void {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.expiresAt = Date.now() + hours * 60 * 60 * 1000;
    }
  }

  async generateSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      const db = await getDatabase();
      const dormantContacts = await getDormantContacts(db, 90, 5);

      if (dormantContacts.length > 0) {
        const names = dormantContacts.slice(0, 3).map(c => c.contactName).join('、');
        suggestions.push(`建议联系：${names} 等 ${dormantContacts.length} 位休眠联系人`);
      }

      const needingAttention = await getContactsNeedingAttention(db, 30, 90);
      if (needingAttention.high.length > 0) {
        suggestions.push(`有 ${needingAttention.high.length} 位重要联系人需要关注`);
      }

      suggestions.push('查看本周活动统计');
      suggestions.push('记录一次新的社交活动');

    } catch {
      // Return default suggestions
    }

    return suggestions;
  }

  clearAllReminders(): void {
    this.reminders = [];
  }

  getReminderCount(): number {
    return this.reminders.length;
  }

  getUnreadCount(): number {
    return this.reminders.filter(r => !r.expiresAt).length;
  }
}

export const reminderService = new ReminderService();

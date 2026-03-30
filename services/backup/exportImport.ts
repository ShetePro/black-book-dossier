import * as FileSystem from 'expo-file-system/legacy';
import { Contact, Interaction, ActionItem } from '@/types';
import { getDatabase, getAllContacts, getInteractionsByContact } from '@/db/operations';

const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';

export const exportDataToJSON = async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const db = await getDatabase();
    const contacts = await getAllContacts(db);
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      contacts: await Promise.all(
        contacts.map(async (contact) => {
          const interactions = await getInteractionsByContact(db, contact.id);
          return {
            ...contact,
            interactions,
          };
        })
      ),
    };
    
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `blackbook-backup-${timestamp}.json`;
    const filePath = BACKUP_DIR + fileName;
    
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: String(error) };
  }
};

export const importDataFromJSON = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    const importData = JSON.parse(fileContent);
    
    if (!importData.contacts || !Array.isArray(importData.contacts)) {
      return { success: false, error: 'Invalid backup format' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: String(error) };
  }
};

export const getBackupFiles = async (): Promise<Array<{ name: string; path: string; size: number; date: Date }>> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      return [];
    }
    
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const backupFiles = await Promise.all(
      files
        .filter((name) => name.endsWith('.json'))
        .map(async (name) => {
          const filePath = BACKUP_DIR + name;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          return {
            name,
            path: filePath,
            size: fileInfo.exists ? (fileInfo as any).size : 0,
            date: new Date(),
          };
        })
    );
    
    return backupFiles.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Failed to get backup files:', error);
    return [];
  }
};

export const deleteBackupFile = async (filePath: string): Promise<boolean> => {
  try {
    await FileSystem.deleteAsync(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return false;
  }
};

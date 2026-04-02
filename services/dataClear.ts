import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { getDatabase } from '@/db/operations';

const DIRECTORIES_TO_CLEAN = [
  FileSystem.documentDirectory + 'backups/',
  FileSystem.documentDirectory + 'exports/',
  FileSystem.documentDirectory + 'audio/',
  FileSystem.documentDirectory + 'models/',
];

const SECURE_STORE_KEYS = [
  'app-settings',
  'user-session',
  'encryption-key',
];

export const clearAllAppData = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[DataClear] Starting complete data wipe...');

    try {
      const db = await getDatabase();
      await db.execAsync('DELETE FROM contacts;');
      await db.execAsync('DELETE FROM interactions;');
      await db.execAsync('DELETE FROM action_items;');
      console.log('[DataClear] Database tables cleared');
    } catch (dbError) {
      console.error('[DataClear] Database error:', dbError);
    }

    for (const dir of DIRECTORIES_TO_CLEAN) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(dir, { idempotent: true });
          console.log(`[DataClear] Deleted directory: ${dir}`);
        }
      } catch (fsError) {
        console.warn(`[DataClear] Failed to delete ${dir}:`, fsError);
      }
    }

    for (const key of SECURE_STORE_KEYS) {
      try {
        await SecureStore.deleteItemAsync(key);
        console.log(`[DataClear] Deleted secure store key: ${key}`);
      } catch (secureError) {
        console.warn(`[DataClear] Failed to delete secure key ${key}:`, secureError);
      }
    }

    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        await Promise.all(
          cacheFiles.map((file) =>
            FileSystem.deleteAsync(cacheDir + file, { idempotent: true }).catch((err) =>
              console.warn(`[DataClear] Failed to delete cache ${file}:`, err)
            )
          )
        );
        console.log('[DataClear] Cache cleared');
      }
    } catch (cacheError) {
      console.warn('[DataClear] Cache cleanup error:', cacheError);
    }

    console.log('[DataClear] Complete data wipe finished successfully');
    return { success: true };
  } catch (error) {
    console.error('[DataClear] Fatal error during data wipe:', error);
    return { success: false, error: String(error) };
  }
};

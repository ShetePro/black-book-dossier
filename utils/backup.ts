import {
  copyAsync,
  getInfoAsync,
  documentDirectory,
} from "expo-file-system/legacy";
import ExpoSQLite from "expo-sqlite/build/ExpoSQLite";
import { Platform } from "react-native";

const DB_NAME = "blackbook.db";
const BACKUP_FILE_NAME = "blackbook_backup.db";

/**
 * 获取数据库文件的完整路径
 */
export function getDatabasePath(): string {
  // 使用 expo-sqlite 的默认数据库目录
  const dbDirectory = ExpoSQLite.defaultDatabaseDirectory;
  return `${dbDirectory}/${DB_NAME}`;
}

/**
 获取备份文件路径
 获取备份文件路径
 * 获取备份文件路径 */
export function getBackupPath(): string {
  return `${documentDirectory}${BACKUP_FILE_NAME}`;
}

/**
 * 检查数据库文件是否存在
 */
export async function checkDatabaseExists(): Promise<boolean> {
  try {
    const dbPath = getDatabasePath();
    const fileInfo = await getInfoAsync(dbPath);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * 备份 SQLite 数据库到 FileSystem.documentDirectory
 * 这样可以利用 iCloud 自动备份功能
 *
 * iOS 说明：
 * - DocumentDirectory 中的文件默认会被 iCloud 备份
 * - 这是苹果推荐的存储用户数据的位置
 */
export async function backupDatabase(): Promise<void> {
  try {
    // 获取数据库文件路径
    const dbPath = getDatabasePath();
    const backupPath = getBackupPath();

    // 检查数据库文件是否存在
    const dbFileInfo = await getInfoAsync(dbPath);
    if (!dbFileInfo.exists) {
      console.log("⚠️ 数据库文件不存在，跳过备份");
      return;
    }

    // 复制数据库文件到 documentDirectory
    await copyAsync({
      from: dbPath,
      to: backupPath,
    });

    // iOS: 确保文件会被 iCloud 备份（documentDirectory 默认会被备份）
    if (Platform.OS === "ios") {
      console.log("✅ 数据库已备份到 iCloud 可备份目录:", backupPath);
    } else {
      console.log("✅ 数据库已备份到:", backupPath);
    }
  } catch (error) {
    console.error("❌ 备份数据库失败:", error);
    // 备份失败不影响主流程，只记录错误
  }
}

/**
 * 从备份恢复数据库（如果需要）
 *
 * 使用场景：
 * - 应用重新安装后恢复数据
 * - 从 iCloud 恢复设备后恢复数据
 *
 * 注意：只有在数据库不存在时才会恢复，避免覆盖现有数据
 */
export async function restoreDatabase(): Promise<void> {
  try {
    const dbPath = getDatabasePath();
    const backupPath = getBackupPath();

    // 检查备份文件是否存在
    const backupFileInfo = await getInfoAsync(backupPath);
    if (!backupFileInfo.exists) {
      console.log("⚠️ 备份文件不存在，无法恢复");
      return;
    }

    // 检查数据库文件是否已存在
    const dbFileInfo = await getInfoAsync(dbPath);
    if (dbFileInfo.exists) {
      console.log("ℹ️ 数据库已存在，跳过恢复以避免覆盖现有数据");
      return;
    }

    // 复制备份文件到数据库路径
    await copyAsync({
      from: backupPath,
      to: dbPath,
    });

    console.log("✅ 数据库已从备份恢复");
  } catch (error) {
    console.error("❌ 恢复数据库失败:", error);
  }
}

/**
 * 强制从备份恢复数据库（会覆盖现有数据）
 * 仅在用户明确选择恢复备份时使用
 */
export async function forceRestoreDatabase(): Promise<void> {
  try {
    const dbPath = getDatabasePath();
    const backupPath = getBackupPath();

    // 检查备份文件是否存在
    const backupFileInfo = await getInfoAsync(backupPath);
    if (!backupFileInfo.exists) {
      console.log("⚠️ 备份文件不存在，无法恢复");
      return;
    }

    // 复制备份文件到数据库路径（覆盖现有文件）
    await copyAsync({
      from: backupPath,
      to: dbPath,
    });

    console.log("✅ 数据库已从备份强制恢复（覆盖现有数据）");
  } catch (error) {
    console.error("❌ 强制恢复数据库失败:", error);
  }
}

/**
 * 检查备份是否存在
 */
export async function checkBackupExists(): Promise<boolean> {
  try {
    const backupPath = getBackupPath();
    const fileInfo = await getInfoAsync(backupPath);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * 获取备份文件信息
 */
export async function getBackupInfo(): Promise<{
  exists: boolean;
  size?: number;
  modificationTime?: number;
}> {
  try {
    const backupPath = getBackupPath();
    const fileInfo = await getInfoAsync(backupPath);
    return {
      exists: fileInfo.exists,
      size: fileInfo.size,
      modificationTime: fileInfo.modificationTime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * 获取数据库文件信息
 */
export async function getDatabaseInfo(): Promise<{
  exists: boolean;
  size?: number;
  modificationTime?: number;
}> {
  try {
    const dbPath = getDatabasePath();
    const fileInfo = await getInfoAsync(dbPath);
    return {
      exists: fileInfo.exists,
      size: fileInfo.size,
      modificationTime: fileInfo.modificationTime,
    };
  } catch {
    return { exists: false };
  }
}

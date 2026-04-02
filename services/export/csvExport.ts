import * as FileSystem from 'expo-file-system/legacy';
import { Contact } from '@/types';
import { getDatabase, getAllContacts } from '@/db/operations';

const EXPORT_DIR = FileSystem.documentDirectory + 'exports/';

function convertContactsToCSV(contacts: Contact[]): string {
  const headers = [
    '姓名',
    '职位',
    '公司',
    '电话',
    '邮箱',
    '微信',
    '标签',
    '优先级',
    '备注',
    '创建时间',
    '更新时间',
  ];

  const rows = contacts.map((contact) => {
    const values = [
      contact.name,
      contact.title || '',
      contact.company || '',
      contact.phone || '',
      contact.email || '',
      contact.wechat || '',
      contact.tags.join(', '),
      contact.priority,
      contact.notes,
      new Date(contact.createdAt).toLocaleString('zh-CN'),
      new Date(contact.updatedAt).toLocaleString('zh-CN'),
    ];

    return values
      .map((value) => {
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  const BOM = '\uFEFF';
  const csvContent = [headers.join(','), ...rows].join('\n');
  return BOM + csvContent;
}

export const exportContactsToCSV = async (): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
}> => {
  try {
    const db = await getDatabase();
    const contacts = await getAllContacts(db);

    if (contacts.length === 0) {
      return { success: false, error: '没有可导出的联系人' };
    }

    const dirInfo = await FileSystem.getInfoAsync(EXPORT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(EXPORT_DIR, { intermediates: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `blackbook-contacts-${timestamp}.csv`;
    const filePath = EXPORT_DIR + fileName;

    const csvContent = convertContactsToCSV(contacts);
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await cleanupOldExports(10);

    return { success: true, filePath };
  } catch (error) {
    console.error('[CSV Export] Failed:', error);
    return { success: false, error: String(error) };
  }
};

export const getExportedFileContent = async (filePath: string): Promise<string | null> => {
  try {
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return content;
  } catch (error) {
    console.error('[CSV Export] Read failed:', error);
    return null;
  }
};

export const cleanupOldExports = async (maxFiles: number = 10): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(EXPORT_DIR);
    if (!dirInfo.exists) return;

    const files = await FileSystem.readDirectoryAsync(EXPORT_DIR);
    const csvFiles = files.filter((name) => name.endsWith('.csv'));

    if (csvFiles.length <= maxFiles) return;

    const sortedFiles = csvFiles.sort().reverse();
    const filesToDelete = sortedFiles.slice(maxFiles);

    await Promise.all(
      filesToDelete.map((fileName) =>
        FileSystem.deleteAsync(EXPORT_DIR + fileName).catch((err) =>
          console.warn(`[CSV Export] Failed to delete ${fileName}:`, err)
        )
      )
    );
  } catch (error) {
    console.error('[CSV Export] Cleanup failed:', error);
  }
};

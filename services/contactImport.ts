import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';
import { Contact } from '@/types';

/**
 * 生成安全的唯一 ID
 * 避免使用设备联系人 ID（可能包含特殊字符或格式不一致）
 */
const generateSafeId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `imported-${timestamp}-${random}`;
};

/**
 * 验证联系人的必填字段
 * 确保返回的 Contact 对象符合类型定义
 */
const validateContact = (contact: Partial<Contact>): contact is Contact => {
  if (!contact.name || typeof contact.name !== 'string') {
    console.error('Contact validation failed: missing or invalid name');
    return false;
  }
  if (!contact.id || typeof contact.id !== 'string') {
    console.error('Contact validation failed: missing or invalid id');
    return false;
  }
  if (!contact.priority || !['high', 'medium', 'low'].includes(contact.priority)) {
    console.error('Contact validation failed: missing or invalid priority');
    return false;
  }
  if (!Array.isArray(contact.tags)) {
    console.error('Contact validation failed: tags is not an array');
    return false;
  }
  if (!Array.isArray(contact.taboos)) {
    console.error('Contact validation failed: taboos is not an array');
    return false;
  }
  if (!Array.isArray(contact.preferences)) {
    console.error('Contact validation failed: preferences is not an array');
    return false;
  }
  if (!Array.isArray(contact.healthIssues)) {
    console.error('Contact validation failed: healthIssues is not an array');
    return false;
  }
  if (!Array.isArray(contact.familyMembers)) {
    console.error('Contact validation failed: familyMembers is not an array');
    return false;
  }
  if (typeof contact.notes !== 'string') {
    console.error('Contact validation failed: notes is not a string');
    return false;
  }
  if (typeof contact.createdAt !== 'number') {
    console.error('Contact validation failed: createdAt is not a number');
    return false;
  }
  if (typeof contact.updatedAt !== 'number') {
    console.error('Contact validation failed: updatedAt is not a number');
    return false;
  }
  return true;
};

/**
 * 将设备联系人转换为完整的 Contact 对象
 */
const convertDeviceContactToContact = (deviceContact: Contacts.Contact): Contact | null => {
  try {
    // 跳过没有姓名的联系人
    if (!deviceContact.name || deviceContact.name.trim() === '') {
      console.log('Skipping contact without name');
      return null;
    }

    const contact: Contact = {
      id: generateSafeId(),
      name: deviceContact.name.trim(),
      phone: deviceContact.phoneNumbers?.[0]?.number?.trim() || '',
      email: deviceContact.emails?.[0]?.email?.trim() || '',
      company: deviceContact.company?.trim() || '',
      title: deviceContact.jobTitle?.trim() || '',
      avatar: deviceContact.image?.uri || '',
      wechat: '',
      priority: 'low',
      tags: ['通讯录导入'],
      taboos: [],
      preferences: [],
      healthIssues: [],
      familyMembers: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 验证转换后的联系人
    if (!validateContact(contact)) {
      console.error('Contact validation failed for:', deviceContact.name);
      return null;
    }

    return contact;
  } catch (error) {
    console.error('Error converting device contact:', error);
    return null;
  }
};

export const requestContactsPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request contacts permission:', error);
    return false;
  }
};

export const importDeviceContacts = async (): Promise<Contact[]> => {
  try {
    const hasPermission = await requestContactsPermission();

    if (!hasPermission) {
      Alert.alert(
        '权限 needed',
        '需要通讯录权限才能导入联系人',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => {} }
        ]
      );
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Company,
        Contacts.Fields.JobTitle,
        Contacts.Fields.Image,
      ],
    });

    if (!data || data.length === 0) {
      console.log('No contacts found on device');
      return [];
    }

    console.log(`Found ${data.length} device contacts, converting...`);

    // 转换并验证每个联系人
    const importedContacts: Contact[] = [];
    for (const deviceContact of data) {
      const contact = convertDeviceContactToContact(deviceContact);
      if (contact) {
        importedContacts.push(contact);
      }
    }

    console.log(`Successfully converted ${importedContacts.length} contacts`);

    return importedContacts;
  } catch (error) {
    console.error('Import contacts error:', error);
    Alert.alert('导入失败', '无法读取通讯录，请检查权限设置');
    return [];
  }
};

export const showImportPreview = (
  contacts: Contact[],
  onConfirm: (contacts: Contact[]) => void
) => {
  const count = contacts.length;

  Alert.alert(
    '导入联系人',
    `发现 ${count} 个联系人，是否导入？`,
    [
      { text: '取消', style: 'cancel' },
      {
        text: '导入',
        onPress: () => onConfirm(contacts),
        style: 'default'
      }
    ]
  );
};

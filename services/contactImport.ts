import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';
import { Contact } from '@/types';

export const requestContactsPermission = async (): Promise<boolean> => {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
};

export const importDeviceContacts = async (): Promise<Partial<Contact>[]> => {
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

  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Company,
        Contacts.Fields.JobTitle,
      ],
    });

    if (data.length === 0) {
      return [];
    }

    const importedContacts: Partial<Contact>[] = data.map((deviceContact) => {
      const contact: Partial<Contact> = {
        id: deviceContact.id || `imported-${Date.now()}-${Math.random()}`,
        name: deviceContact.name || '未知姓名',
        phone: deviceContact.phoneNumbers?.[0]?.number || '',
        email: deviceContact.emails?.[0]?.email || '',
        company: deviceContact.company || '',
        title: deviceContact.jobTitle || '',
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

      return contact;
    });

    return importedContacts;
  } catch (error) {
    console.error('Import contacts error:', error);
    Alert.alert('导入失败', '无法读取通讯录，请检查权限设置');
    return [];
  }
};

export const showImportPreview = (
  contacts: Partial<Contact>[],
  onConfirm: (contacts: Partial<Contact>[]) => void
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

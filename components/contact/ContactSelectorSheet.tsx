import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '@/types';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ContactSelectorSheetProps {
  onClose: () => void;
  onSelect: (contact: Contact) => void;
  contacts: Contact[];
}

export const ContactSelectorSheet: React.FC<ContactSelectorSheetProps> = ({
  onClose,
  onSelect,
  contacts,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ['60%'], []);

  // 挂载时自动展开，卸载时自动关闭
  useEffect(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSelect = useCallback((contact: Contact) => {
    onSelect(contact);
    onClose();
  }, [onSelect, onClose]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      backgroundStyle={{ backgroundColor: colors.surface }}
      onChange={handleSheetChanges}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>选择联系人</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
        >
          {contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(contact)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {contact.company || '无公司'} · {contact.title || '无职位'}
                </Text>
              </View>
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flex: 1,
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#c9a962',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
});

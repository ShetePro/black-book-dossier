import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useContact } from "@/hooks/contact";
import { useContactStore } from "@/store";
import { getStorageItemAsync } from "@/hooks/useStorageState";
import { Contact } from "@/types";

const STANDALONE_TAGS_KEY = "standalone_tags";

export default function EditContactScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColor();
  
  const { contact, isLoading, error } = useContact(id);
  const { updateContact, deleteContact } = useContactStore();

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    notes: "",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  useEffect(() => {
    getStorageItemAsync(STANDALONE_TAGS_KEY).then((val) => {
      if (val) {
        try {
          setExistingTags(JSON.parse(val));
        } catch {
          setExistingTags([]);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        title: contact.title || "",
        company: contact.company || "",
        phone: contact.phone || "",
        email: contact.email || "",
        notes: contact.notes || "",
      });
      setTags(contact.tags || []);
    }
  }, [contact]);

  const handleSave = async () => {
    if (!contact) return;
    
    if (!formData.name.trim()) {
      Alert.alert(t('common.notice'), t('contact.validation.nameRequired'));
      return;
    }

    setIsSaving(true);

    try {
      const updatedContact: Contact = {
        ...contact,
        name: formData.name.trim(),
        title: formData.title.trim() || undefined,
        company: formData.company.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || "",
        tags,
        updatedAt: Date.now(),
      };

      await updateContact(updatedContact);
      Alert.alert(t('contact.saveSuccess'), t('contact.saveSuccessMessage'), [
        { text: t('contact.ok'), onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Failed to update contact:", error);
      Alert.alert(t('contact.saveError'), t('contact.saveErrorMessage'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('contact.deleteConfirm'),
      t('contact.deleteMessage', { name: contact?.name }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('contact.deleteButton'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact(id);
              router.replace("/(tabs)/contacts");
            } catch (error) {
              console.error("Failed to delete contact:", error);
              Alert.alert(t('common.error'), t('contact.deleteError'));
            }
          },
        },
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const toggleTag = useCallback((tagName: string) => {
    setTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }, []);

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
              {t('contact.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('contact.editTitle')}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ContactSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !contact) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
              {t('contact.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('contact.editTitle')}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            {error || t('contact.notFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isSaving}>
          <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
            {t('contact.cancel')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{t('contact.editTitle')}</Text>

        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButton, { color: colors.primary }]}>{t('contact.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarSection}>
          <View
            style={[styles.avatar, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="camera" size={32} color={colors.textMuted} />
          </View>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
            {t('contact.editAvatar')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.basicInfo')}</Text>

          <View
            style={[styles.inputCard, { backgroundColor: colors.surface }]}
          >
            <InputRow
              label={t('contact.name')}
              placeholder={t('contact.namePlaceholder')}
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              colors={colors}
              required
            />

            <InputRow
              label={t('contact.title')}
              placeholder={t('contact.titlePlaceholder')}
              value={formData.title}
              onChangeText={(text) =>
                setFormData({ ...formData, title: text })
              }
              colors={colors}
            />

            <InputRow
              label={t('contact.company')}
              placeholder={t('contact.companyPlaceholder')}
              value={formData.company}
              onChangeText={(text) =>
                setFormData({ ...formData, company: text })
              }
              colors={colors}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.contactInfo')}</Text>

          <View
            style={[styles.inputCard, { backgroundColor: colors.surface }]}
          >
            <InputRow
              label={t('contact.phone')}
              placeholder={t('contact.phonePlaceholder')}
              value={formData.phone}
              onChangeText={(text) =>
                setFormData({ ...formData, phone: text })
              }
              colors={colors}
              keyboardType="phone-pad"
            />

            <InputRow
              label={t('contact.email')}
              placeholder={t('contact.emailPlaceholder')}
              value={formData.email}
              onChangeText={(text) =>
                setFormData({ ...formData, email: text })
              }
              colors={colors}
              keyboardType="email-address"
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.tags')}</Text>

          <View style={[styles.tagCard, { backgroundColor: colors.surface }]}>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder={t('contact.addTag')}
                placeholderTextColor={colors.textMuted}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                editable={!isSaving}
              />
              <TouchableOpacity
                onPress={addTag}
                style={[
                  styles.addTagButton,
                  { backgroundColor: colors.primary },
                ]}
                disabled={isSaving}
              >
                <Ionicons name="add" size={20} color="#0a0a0a" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTagPicker(true)}
                style={[
                  styles.addTagButton,
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginLeft: 8 },
                ]}
                disabled={isSaving}
              >
                <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsList}>
                {tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Text
                      style={[styles.tagText, { color: colors.primary }]}
                    >
                      {tag}
                    </Text>
                    <TouchableOpacity onPress={() => removeTag(tag)} disabled={isSaving}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <Modal
          visible={showTagPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTagPicker(false)}
        >
          <View style={styles.tagPickerOverlay}>
            <View style={[styles.tagPickerContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.tagPickerHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.tagPickerTitle, { color: colors.text }]}>{t('contact.selectTagTitle')}</Text>
                <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tagPickerList}>
                {existingTags.length === 0 ? (
                  <Text style={[styles.tagPickerEmpty, { color: colors.textMuted }]}>{t('contact.noTagsAvailable')}</Text>
                ) : (
                  existingTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagPickerItem,
                        { borderBottomColor: colors.border },
                        tags.includes(tag) && { backgroundColor: `${colors.primary}10` },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[styles.tagPickerItemText, { color: colors.text }]}>{tag}</Text>
                      {tags.includes(tag) && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.notes')}</Text>

          <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              placeholder={t('contact.notesPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={formData.notes}
              onChangeText={(text) =>
                setFormData({ ...formData, notes: text })
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: `${colors.danger}15` }]}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
              {t('contact.delete')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactSkeleton() {
  const colors = useThemeColor();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.avatarSection}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.surface },
          ]}
        />
      </View>

      <View style={styles.section}>
        <View
          style={[
            styles.sectionTitle,
            { backgroundColor: colors.surface, width: 80, height: 18, borderRadius: 4 },
          ]}
        />
        <View
          style={[
            styles.inputCard,
            { backgroundColor: colors.surface, height: 150, marginTop: 12 },
          ]}
        />
      </View>

      <View style={styles.section}>
        <View
          style={[
            styles.sectionTitle,
            { backgroundColor: colors.surface, width: 80, height: 18, borderRadius: 4 },
          ]}
        />
        <View
          style={[
            styles.inputCard,
            { backgroundColor: colors.surface, height: 100, marginTop: 12 },
          ]}
        />
      </View>

      <View style={styles.section}>
        <View
          style={[
            styles.sectionTitle,
            { backgroundColor: colors.surface, width: 40, height: 18, borderRadius: 4 },
          ]}
        />
        <View
          style={[
            styles.tagCard,
            { backgroundColor: colors.surface, height: 80, marginTop: 12 },
          ]}
        />
      </View>
    </ScrollView>
  );
}

function InputRow({
  label,
  placeholder,
  value,
  onChangeText,
  colors,
  keyboardType = "default",
  isLast = false,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: any;
  keyboardType?: "default" | "phone-pad" | "email-address";
  isLast?: boolean;
  required?: boolean;
}) {
  return (
    <View
      style={[
        styles.inputRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "rgba(128,128,128,0.1)",
        },
      ]}
    >
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {label}
        {required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  cancelButton: {
    fontSize: 16,
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    width: 60,
    textAlign: "right",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 14,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  inputLabel: {
    fontSize: 15,
    width: 60,
  },
  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
  tagCard: {
    borderRadius: 16,
    padding: 16,
  },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  notesInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  tagPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  tagPickerContainer: {
    maxHeight: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  tagPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tagPickerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  tagPickerList: {
    paddingHorizontal: 16,
  },
  tagPickerEmpty: {
    textAlign: "center",
    paddingVertical: 40,
    fontSize: 15,
  },
  tagPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tagPickerItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

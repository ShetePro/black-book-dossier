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
import { useThemeColor } from "@/hooks/useThemeColor";
import { useContact } from "@/hooks/contact";
import { useContactStore } from "@/store";
import { getStorageItemAsync } from "@/hooks/useStorageState";
import { Contact } from "@/types";

const STANDALONE_TAGS_KEY = "standalone_tags";

export default function EditContactScreen() {
  const router = useRouter();
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
      Alert.alert("提示", "请输入联系人姓名");
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
      Alert.alert("保存成功", "联系人信息已更新", [
        { text: "确定", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Failed to update contact:", error);
      Alert.alert("错误", "更新联系人失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "确认删除",
      `确定要删除联系人"${contact?.name}"吗？此操作不可撤销。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact(id);
              router.replace("/(tabs)/contacts");
            } catch (error) {
              console.error("Failed to delete contact:", error);
              Alert.alert("错误", "删除联系人失败");
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
              取消
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>编辑联系人</Text>
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
              取消
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>编辑联系人</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            {error || "联系人不存在"}
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
            取消
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>编辑联系人</Text>

        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButton, { color: colors.primary }]}>保存</Text>
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
            修改头像
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>基本信息</Text>

          <View
            style={[styles.inputCard, { backgroundColor: colors.surface }]}
          >
            <InputRow
              label="姓名"
              placeholder="输入姓名 *"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              colors={colors}
              required
            />

            <InputRow
              label="职位"
              placeholder="输入职位"
              value={formData.title}
              onChangeText={(text) =>
                setFormData({ ...formData, title: text })
              }
              colors={colors}
            />

            <InputRow
              label="公司"
              placeholder="输入公司名称"
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>联系方式</Text>

          <View
            style={[styles.inputCard, { backgroundColor: colors.surface }]}
          >
            <InputRow
              label="电话"
              placeholder="输入电话号码"
              value={formData.phone}
              onChangeText={(text) =>
                setFormData({ ...formData, phone: text })
              }
              colors={colors}
              keyboardType="phone-pad"
            />

            <InputRow
              label="邮箱"
              placeholder="输入邮箱地址"
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>标签</Text>

          <View style={[styles.tagCard, { backgroundColor: colors.surface }]}>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder="添加标签"
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
                <Text style={[styles.tagPickerTitle, { color: colors.text }]}>选择标签</Text>
                <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tagPickerList}>
                {existingTags.length === 0 ? (
                  <Text style={[styles.tagPickerEmpty, { color: colors.textMuted }]}>暂无可用标签</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>备注</Text>

          <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              placeholder="添加备注信息..."
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
              删除联系人
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

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useContactStore } from "@/store";
import { Contact } from "@/types";

export default function NewContactScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { addContact } = useContactStore();

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

  const handleSave = async () => {
    // 表单验证
    if (!formData.name.trim()) {
      Alert.alert("提示", "请输入姓名");
      return;
    }

    const { contacts } = useContactStore.getState();
    if (contacts.length >= 10) {
      Alert.alert("提示", "联系人数量已达上限（最多10个）");
      return;
    }

    setIsSaving(true);

    try {
      const now = Date.now();
      const contact: Contact = {
        id: `contact-${now}-${Math.random().toString(36).substring(2, 10)}`,
        name: formData.name.trim(),
        title: formData.title.trim() || undefined,
        company: formData.company.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        wechat: undefined,
        tags: tags.length > 0 ? tags : [],
        taboos: [],
        preferences: [],
        healthIssues: [],
        familyMembers: [],
        notes: formData.notes.trim(),
        priority: "low",
        createdAt: now,
        updatedAt: now,
      };

      await addContact(contact);
      
      Alert.alert("保存成功", "联系人已创建", [
        {
          text: "确定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to save contact:", error);
      Alert.alert("保存失败", "创建联系人时出错，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isSaving}>
          <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
            取消
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>新建联系人</Text>

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
        {/* 头像占位 */}
        <View style={styles.avatarSection}>
          <View
            style={[styles.avatar, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="camera" size={32} color={colors.textMuted} />
          </View>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
            添加头像
          </Text>
        </View>

        {/* 基本信息 */}
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

        {/* 联系方式 */}
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

        {/* 标签 */}
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

        {/* 备注 */}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 输入行组件
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
});

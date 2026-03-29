import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useContacts } from "@/hooks/contact";
import { useContactStore } from "@/store";
import { Contact } from "@/types";

interface TagStat {
  name: string;
  count: number;
}

interface TagItemProps {
  tag: TagStat;
  index: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useThemeColor>;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function TagItem({ tag, index, onPress, onEdit, onDelete, colors }: TagItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 20 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(300)}
      style={[styles.tagItemContainer, animatedStyle]}
    >
      <AnimatedTouchable
        style={[
          styles.tagItem,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <View style={styles.tagContent}>
          <View style={[styles.tagIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="pricetag" size={18} color={colors.primary} />
          </View>

          <View style={styles.tagInfo}>
            <Text style={[styles.tagName, { color: colors.text }]}>
              {tag.name}
            </Text>
            <Text style={[styles.tagCount, { color: colors.textMuted }]}>
              {tag.count} 个联系人
            </Text>
          </View>
        </View>

        <View style={styles.tagActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={[styles.actionButton, { backgroundColor: `${colors.danger}15` }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

interface EditTagModalProps {
  visible: boolean;
  tagName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
  colors: ReturnType<typeof useThemeColor>;
}

function EditTagModal({ visible, tagName, onClose, onSave, colors }: EditTagModalProps) {
  const [inputValue, setInputValue] = useState(tagName);

  React.useEffect(() => {
    if (visible) {
      setInputValue(tagName);
    }
  }, [visible, tagName]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== tagName) {
      onSave(trimmed);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            重命名标签
          </Text>

          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="输入新标签名称"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={20}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                取消
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalButtonText, { color: "#0a0a0a" }]}>
                保存
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TagsManagementScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { contacts, isLoading } = useContacts();
  const { updateContact } = useContactStore();

  const [editingTag, setEditingTag] = useState<string | null>(null);

  const tagStats = useMemo<TagStat[]>(() => {
    const stats: Record<string, number> = {};
    contacts.forEach((contact: Contact) => {
      contact.tags?.forEach((tag: string) => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  const renameTag = useCallback(
    async (oldName: string, newName: string) => {
      try {
        for (const contact of contacts) {
          if (contact.tags?.includes(oldName)) {
            const newTags = contact.tags.map((t: string) =>
              t === oldName ? newName : t
            );
            await updateContact({ ...contact, tags: newTags });
          }
        }
      } catch (error) {
        console.error("Failed to rename tag:", error);
        Alert.alert("错误", "重命名标签失败，请重试");
      }
    },
    [contacts, updateContact]
  );

  const deleteTag = useCallback(
    async (tagName: string) => {
      try {
        for (const contact of contacts) {
          if (contact.tags?.includes(tagName)) {
            const newTags = contact.tags.filter((t: string) => t !== tagName);
            await updateContact({ ...contact, tags: newTags });
          }
        }
      } catch (error) {
        console.error("Failed to delete tag:", error);
        Alert.alert("错误", "删除标签失败，请重试");
      }
    },
    [contacts, updateContact]
  );

  const handleTagPress = useCallback(
    (tagName: string) => {
      router.push({
        pathname: "/(tabs)/contacts",
        params: { filterTag: tagName },
      });
    },
    [router]
  );

  const handleEditTag = useCallback((tagName: string) => {
    setEditingTag(tagName);
  }, []);

  const handleDeleteTag = useCallback(
    (tagName: string, count: number) => {
      Alert.alert(
        "删除标签",
        `确定要删除标签 "${tagName}" 吗？\n\n这将从 ${count} 个联系人中移除此标签，但不会删除联系人本身。`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "删除",
            style: "destructive",
            onPress: () => deleteTag(tagName),
          },
        ]
      );
    },
    [deleteTag]
  );

  const handleSaveEdit = useCallback(
    (newName: string) => {
      if (editingTag) {
        const exists = tagStats.some(
          (tag) => tag.name === newName && tag.name !== editingTag
        );
        if (exists) {
          Alert.alert("错误", "该标签名称已存在");
          return;
        }
        renameTag(editingTag, newName);
      }
      setEditingTag(null);
    },
    [editingTag, tagStats, renameTag]
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name="pricetag-outline" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        暂无标签
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        在联系人详情页添加标签，方便分类管理
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          标签管理
        </Text>

        <View style={styles.placeholder} />
      </View>

      {tagStats.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {tagStats.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              标签总数
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {contacts.filter((c) => c.tags?.length > 0).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              已标记联系人
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              加载中...
            </Text>
          </View>
        ) : tagStats.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.tagsList}>
            {tagStats.map((tag, index) => (
              <TagItem
                key={tag.name}
                tag={tag}
                index={index}
                onPress={() => handleTagPress(tag.name)}
                onEdit={() => handleEditTag(tag.name)}
                onDelete={() => handleDeleteTag(tag.name, tag.count)}
                colors={colors}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditTagModal
        visible={editingTag !== null}
        tagName={editingTag || ""}
        onClose={() => setEditingTag(null)}
        onSave={handleSaveEdit}
        colors={colors}
      />
    </SafeAreaView>
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  tagsList: {
    gap: 12,
  },
  tagItemContainer: {
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tagIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  tagCount: {
    fontSize: 13,
  },
  tagActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

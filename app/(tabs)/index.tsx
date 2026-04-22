import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { getStorageItem } from "@/hooks/useStorageState";
import { useActionItems } from "@/hooks/actionItem";
import { ActionItem } from "@/types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PRIORITY_CONFIG = {
  high: { color: "#ef4444", label: "高", bg: "rgba(239,68,68,0.12)" },
  medium: { color: "#f59e0b", label: "中", bg: "rgba(245,158,11,0.12)" },
  low: { color: "#6b7280", label: "低", bg: "rgba(107,114,128,0.12)" },
} as const;

interface QuickEntry {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  route: string;
  badge?: number;
}

function usePressAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const pressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(0.8, { duration: 100 });
  }, []);

  const pressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { pressIn, pressOut, style };
}

function usePulseAnimation() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
}

interface HeaderProps {
  nickname?: string;
  avatar?: string;
  onAvatarPress: () => void;
}

const HomeHeader: React.FC<HeaderProps> = React.memo(
  ({ nickname, avatar, onAvatarPress }) => {
    const colors = useThemeColor();
    const { t } = useTranslation();

    return (
      <View style={styles.header}>
        <View>
          <Text style={[styles.brand, { color: colors.text }]}>
            Black Book
          </Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            {t("app.tagline")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onAvatarPress}
          style={styles.avatarButton}
          accessibilityLabel={t("profile.title")}
        >
          {avatar ? (
            <View style={styles.avatarRing}>
              <View style={[styles.avatarRingBorder, { borderColor: colors.primary }]} />
              <View style={styles.avatarInner}>
                <DefaultAvatar nickname={nickname} size={36} />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.surface, borderColor: colors.primary + "40" },
              ]}
            >
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }
);

interface ActionGridProps {
  onRecord: () => void;
  onNewContact: () => void;
}

const ActionGrid: React.FC<ActionGridProps> = React.memo(
  ({ onRecord, onNewContact }) => {
    const colors = useThemeColor();
    const { t } = useTranslation();
    const recordPress = usePressAnimation();
    const contactPress = usePressAnimation();

    return (
      <View style={styles.actionGrid}>
        <AnimatedTouchable
          style={[styles.actionCard, styles.actionCardPrimary, { backgroundColor: colors.primary }, recordPress.style]}
          onPress={onRecord}
          onPressIn={recordPress.pressIn}
          onPressOut={recordPress.pressOut}
          activeOpacity={1}
          accessibilityLabel={t("recording.tapToRecord")}
        >
          <View style={styles.actionCardContent}>
            <View style={styles.actionIconWrapper}>
              <Ionicons name="mic" size={28} color="#0a0a0a" />
            </View>
            <Text style={styles.actionCardTitle}>
              {t("recording.tapToRecord")}
            </Text>
            <Text style={styles.actionCardSubtitle}>
              {t("home.tapToAddRecord")}
            </Text>
          </View>
          <View style={styles.actionCardGlow} />
        </AnimatedTouchable>

        <AnimatedTouchable
          style={[
            styles.actionCard,
            styles.actionCardSecondary,
            { backgroundColor: colors.surface, borderColor: colors.border },
            contactPress.style,
          ]}
          onPress={onNewContact}
          onPressIn={contactPress.pressIn}
          onPressOut={contactPress.pressOut}
          activeOpacity={1}
          accessibilityLabel={t("contacts.addContact")}
        >
          <View style={styles.actionCardContent}>
            <View style={[styles.actionIconWrapper, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="person-add" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text, fontSize: 15 }]}>
              {t("contacts.addContact")}
            </Text>
          </View>
        </AnimatedTouchable>
      </View>
    );
  }
);

interface TodoPreviewProps {
  actionItems: ActionItem[];
  isLoading: boolean;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onItemPress: (item: ActionItem) => void;
  onViewAll: () => void;
  onAdd: () => void;
}

const TodoPreview: React.FC<TodoPreviewProps> = React.memo(
  ({ actionItems, isLoading, onToggleComplete, onItemPress, onViewAll, onAdd }) => {
    const colors = useThemeColor();
    const { t } = useTranslation();

    const pendingItems = useMemo(
      () => actionItems.filter((item) => !item.completed).slice(0, 3),
      [actionItems]
    );
    const pendingCount = useMemo(
      () => actionItems.filter((item) => !item.completed).length,
      [actionItems]
    );

    const formatDate = useCallback((timestamp?: number): string => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return t("actionItem.today");
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (date.toDateString() === tomorrow.toDateString()) return t("actionItem.tomorrow");
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }, []);

    if (isLoading) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("actionItem.title")}
          </Text>
          <View style={[styles.todoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t("actionItem.loading")}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("actionItem.title")}
            </Text>
            {pendingCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={onAdd}
            style={[styles.sectionAddBtn, { backgroundColor: colors.primary + "15" }]}
            accessibilityLabel={t("actionItem.addButton")}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {pendingItems.length === 0 ? (
          <View
            style={[
              styles.todoCard,
              styles.todoEmpty,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.todoEmptyIcon, { backgroundColor: colors.success + "12" }]}>
              <Ionicons name="checkmark-done" size={24} color={colors.success} />
            </View>
            <Text style={[styles.todoEmptyTitle, { color: colors.text }]}>
              {t("actionItem.allCompleted")}
            </Text>
            <TouchableOpacity
              style={[styles.todoEmptyBtn, { borderColor: colors.primary }]}
              onPress={onAdd}
            >
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={[styles.todoEmptyBtnText, { color: colors.primary }]}>
                {t("actionItem.addButton")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.todoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {pendingItems.map((item, index) => {
              const priority = PRIORITY_CONFIG[item.priority];
              return (
                <React.Fragment key={item.id}>
                  {index > 0 && <View style={[styles.todoDivider, { backgroundColor: colors.border }]} />}
                  <TouchableOpacity
                    style={styles.todoItem}
                    onPress={() => onItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <TouchableOpacity
                      style={[
                        styles.todoCheckbox,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => onToggleComplete(item.id, true)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t("actionItem.completed")}
                    >
                      <View style={[styles.todoCheckboxDot, { backgroundColor: priority.color }]} />
                    </TouchableOpacity>

                    <View style={styles.todoContent}>
                      <Text
                        style={[styles.todoDescription, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                      <View style={styles.todoMeta}>
                        <View style={[styles.todoPriorityTag, { backgroundColor: priority.bg }]}>
                          <Text style={[styles.todoPriorityText, { color: priority.color }]}>
                            {priority.label}
                          </Text>
                        </View>
                        {item.dueDate && (
                          <Text style={[styles.todoDueDate, { color: colors.textMuted }]}>
                            {formatDate(item.dueDate)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}

            {pendingCount > 3 && (
              <>
                <View style={[styles.todoDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.todoViewAll}
                  onPress={onViewAll}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.todoViewAllText, { color: colors.primary }]}>
                    {t("common.seeAll")}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  }
);

interface QuickAccessProps {
  entries: QuickEntry[];
  onEntryPress: (route: string) => void;
}

const QuickAccess: React.FC<QuickAccessProps> = React.memo(({ entries, onEntryPress }) => {
  const colors = useThemeColor();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("profile.quickActions")}
      </Text>
      <View style={styles.quickGrid}>
        {entries.map((entry) => {
          const press = usePressAnimation();
          return (
            <AnimatedTouchable
              key={entry.id}
              style={[
                styles.quickCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                press.style,
              ]}
              onPress={() => onEntryPress(entry.route)}
              onPressIn={press.pressIn}
              onPressOut={press.pressOut}
              activeOpacity={1}
              accessibilityLabel={t(entry.labelKey)}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.primary + "12" }]}>
                <Ionicons name={entry.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]}>
                {t(entry.labelKey)}
              </Text>
              {entry.badge !== undefined && entry.badge > 0 && (
                <View style={[styles.quickBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.quickBadgeText}>{entry.badge}</Text>
                </View>
              )}
            </AnimatedTouchable>
          );
        })}
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const [userInfo, setUserInfo] = useState<{ nickname?: string; avatar?: string }>({});
  const { actionItems, isLoading, toggleComplete, deleteActionItem } = useActionItems();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-12);
  const gridOpacity = useSharedValue(0);
  const gridTranslateY = useSharedValue(16);
  const todoOpacity = useSharedValue(0);
  const todoTranslateY = useSharedValue(16);
  const quickOpacity = useSharedValue(0);
  const quickTranslateY = useSharedValue(16);

  useEffect(() => {
    const storedUserInfo = getStorageItem("userInfo");
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch {
      }
    }
  }, []);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerTranslateY.value = withTiming(0, { duration: 400 });

    gridOpacity.value = withDelay(80, withTiming(1, { duration: 400 }));
    gridTranslateY.value = withDelay(80, withTiming(0, { duration: 400 }));

    todoOpacity.value = withDelay(160, withTiming(1, { duration: 400 }));
    todoTranslateY.value = withDelay(160, withTiming(0, { duration: 400 }));

    quickOpacity.value = withDelay(240, withTiming(1, { duration: 400 }));
    quickTranslateY.value = withDelay(240, withTiming(0, { duration: 400 }));
  }, []);

  const headerAnim = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const gridAnim = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
    transform: [{ translateY: gridTranslateY.value }],
  }));
  const todoAnim = useAnimatedStyle(() => ({
    opacity: todoOpacity.value,
    transform: [{ translateY: todoTranslateY.value }],
  }));
  const quickAnim = useAnimatedStyle(() => ({
    opacity: quickOpacity.value,
    transform: [{ translateY: quickTranslateY.value }],
  }));

  const handleAvatarPress = useCallback(() => {
    router.push("/(views)/profile");
  }, []);

  const handleRecordPress = useCallback(() => {
    router.push("/(views)/input");
  }, []);

  const handleNewContact = useCallback(() => {
    router.push("/(views)/contact/new");
  }, []);

  const handleActionItemPress = useCallback((item: ActionItem) => {
    router.push(`/(views)/action-item/new?itemId=${item.id}`);
  }, []);

  const handleViewAllTodos = useCallback(() => {
    router.push("/(views)/action-item");
  }, []);

  const handleAddTodo = useCallback(() => {
    router.push("/(views)/action-item/new");
  }, []);

  const handleQuickEntryPress = useCallback((route: string) => {
    router.push(route as any);
  }, []);

  const pendingCount = useMemo(
    () => actionItems.filter((item) => !item.completed).length,
    [actionItems]
  );

  const quickEntries: QuickEntry[] = useMemo(
    () => [
      { id: "contacts", icon: "people", labelKey: "contacts.title", route: "/(tabs)/contacts" },
      { id: "todos", icon: "list", labelKey: "actionItem.title", route: "/(views)/action-item", badge: pendingCount },
      { id: "settings", icon: "settings", labelKey: "settings.title", route: "/(views)/settings" },
    ],
    [pendingCount]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} collapsable={false}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <Animated.View style={headerAnim}>
            <HomeHeader
              nickname={userInfo.nickname}
              avatar={userInfo.avatar}
              onAvatarPress={handleAvatarPress}
            />
          </Animated.View>

          <Animated.View style={gridAnim}>
            <ActionGrid
              onRecord={handleRecordPress}
              onNewContact={handleNewContact}
            />
          </Animated.View>

          <Animated.View style={todoAnim}>
            <TodoPreview
              actionItems={actionItems}
              isLoading={isLoading}
              onToggleComplete={toggleComplete}
              onItemPress={handleActionItemPress}
              onViewAll={handleViewAllTodos}
              onAdd={handleAddTodo}
            />
          </Animated.View>

          <Animated.View style={quickAnim}>
            <QuickAccess
              entries={quickEntries}
              onEntryPress={handleQuickEntryPress}
            />
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      <FabButton onPress={handleRecordPress} />
    </View>
  );
}

interface FabButtonProps {
  onPress: () => void;
}

const FabButton: React.FC<FabButtonProps> = React.memo(({ onPress }) => {
  const colors = useThemeColor();
  const pressAnim = usePressAnimation();
  const pulseStyle = usePulseAnimation();

  return (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <Animated.View style={[styles.fabPulse, { backgroundColor: colors.primary }, pulseStyle]} />
      <AnimatedTouchable
        style={[styles.fab, { backgroundColor: colors.primary }, pressAnim.style]}
        onPress={onPress}
        onPressIn={pressAnim.pressIn}
        onPressOut={pressAnim.pressOut}
        activeOpacity={1}
        accessibilityLabel="添加记录"
      >
        <Ionicons name="add" size={28} color="#0a0a0a" />
      </AnimatedTouchable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // ── 顶部导航 ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 20,
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Georgia",
  },
  tagline: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  avatarButton: {
    padding: 2,
  },
  avatarRing: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarRingBorder: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    opacity: 0.5,
  },
  avatarInner: {
    borderRadius: 18,
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  // ── 核心操作区 (Bento Grid) ──
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  actionCardPrimary: {
    flex: 1.3,
    padding: 18,
    minHeight: 120,
    justifyContent: "center",
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionCardSecondary: {
    flex: 0.7,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionCardContent: {
    zIndex: 1,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(10,10,10,0.15)",
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0a0a",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: "rgba(10,10,10,0.6)",
    fontWeight: "500",
  },
  actionCardGlow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // ── 通用 Section ──
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  sectionAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0a0a0a",
  },

  // ── 待办预览 ──
  todoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 4,
  },
  todoEmpty: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  todoEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  todoEmptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 16,
  },
  todoEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  todoEmptyBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 10,
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  todoCheckboxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todoContent: {
    flex: 1,
    minWidth: 0,
  },
  todoDescription: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 6,
  },
  todoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todoPriorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todoPriorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  todoDueDate: {
    fontSize: 11,
  },
  todoDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  todoViewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },
  todoViewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ── 快捷入口网格 ──
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  quickBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  quickBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0a0a0a",
  },

  // ── 底部留白 ──
  bottomSpacer: {
    height: 40,
  },

  // ── FAB ──
  fabContainer: {
    position: "absolute",
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  fabPulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 1,
  },
});

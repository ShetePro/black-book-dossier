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
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { getStorageItem } from "@/hooks/useStorageState";
import { useActionItems } from "@/hooks/actionItem";
import { ActionItem } from "@/types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ── Apple HIG Priority Config ──
const PRIORITY_CONFIG = {
  high: { color: "#FF3B30", label: "高", bg: "rgba(255,59,48,0.12)" },
  medium: { color: "#FF9500", label: "中", bg: "rgba(255,149,0,0.12)" },
  low: { color: "#8E8E93", label: "低", bg: "rgba(142,142,147,0.12)" },
} as const;

interface QuickEntry {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  route: string;
  badge?: number;
}

// ── Press Animation Hook (Apple spring curve) ──
function usePressAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const pressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(0.7, { duration: 100 });
  }, []);

  const pressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { pressIn, pressOut, style };
}

// ── Header ──
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
        <View style={styles.headerLeft}>
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
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {avatar ? (
            <View style={styles.avatarContainer}>
              <DefaultAvatar nickname={nickname} size={40} />
            </View>
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.elevated },
              ]}
            >
              <Ionicons name="person" size={20} color={colors.textMuted} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }
);

interface ParticleConfig {
  id: number;
  startAngle: number;
  curveAmplitude: number;
  curveFrequency: number;
  delay: number;
  size: number;
  duration: number;
  targetRadius: number;
}

const generateParticles = (): ParticleConfig[] => {
  const count = 10;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startAngle: (360 / count) * i + (Math.random() * 20 - 10),
    curveAmplitude: 12 + Math.random() * 12,
    curveFrequency: 0.8 + Math.random() * 0.6,
    delay: i * 60 + Math.random() * 40,
    size: 6 + Math.random() * 8,
    duration: 1200 + Math.random() * 400,
    targetRadius: 50 + Math.random() * 25,
  }));
};

const Particle: React.FC<{
  config: ParticleConfig;
  color: string;
  trigger: boolean;
}> = React.memo(({ config, color, trigger }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!trigger) {
      opacity.value = 0;
      scale.value = 0.5;
      translateY.value = 0;
      translateX.value = 0;
      rotation.value = 0;
      return;
    }

    const angleRad = (config.startAngle * Math.PI) / 180;
    const targetX = Math.cos(angleRad) * config.targetRadius;
    const targetY = -45 - Math.random() * 25;

    // Phase 1: Appear + scale up (0-200ms)
    opacity.value = withDelay(
      config.delay,
      withTiming(1, { duration: 200 })
    );

    scale.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1.3, { duration: 200 }),
        withTiming(0.9, { duration: 300 }),
        withTiming(0.3, { duration: 500 })
      )
    );

    // Phase 2: Float upward + curve trajectory (200-800ms)
    translateY.value = withDelay(
      config.delay,
      withSequence(
        withTiming(-35, { duration: 300 }),
        withTiming(targetY, { duration: 500 })
      )
    );

    // Curve trajectory: oscillate left-right while moving upward
    translateX.value = withDelay(
      config.delay,
      withSequence(
        withTiming(config.curveAmplitude, { duration: 250 }),
        withTiming(-config.curveAmplitude * 0.6, { duration: 250 }),
        withTiming(config.curveAmplitude * 0.3, { duration: 200 }),
        withTiming(targetX, { duration: 300 })
      )
    );

    // Rotation: subtle oscillation
    rotation.value = withDelay(
      config.delay,
      withSequence(
        withTiming(20, { duration: 250 }),
        withTiming(-20, { duration: 250 }),
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 300 })
      )
    );

    // Phase 3: Fade out (600ms+)
    opacity.value = withDelay(
      config.delay + 600,
      withTiming(0, { duration: 600 })
    );
  }, [trigger, config]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          width: config.size,
          height: config.size,
          borderRadius: config.size * 0.35,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    />
  );
});

// ── Add Button ──
interface AddButtonProps {
  onPress: () => void;
}

const AddButton: React.FC<AddButtonProps> = React.memo(({ onPress }) => {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const [particleTrigger, setParticleTrigger] = useState(false);
  const particleConfigs = useMemo(() => generateParticles(), []);

  const entryOpacity = useSharedValue(0);
  const entryTranslateY = useSharedValue(8);

  const pressScale = useSharedValue(1);
  const pressShadowRadius = useSharedValue(12);

  useEffect(() => {
    entryOpacity.value = withTiming(1, { duration: 300 });
    entryTranslateY.value = withTiming(0, { duration: 300 });
  }, []);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
    pressShadowRadius.value = withTiming(4, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    pressShadowRadius.value = withTiming(12, { duration: 150 });
  }, []);

  const handlePress = useCallback(() => {
    setParticleTrigger(true);
    setTimeout(() => setParticleTrigger(false), 1500);
    onPress();
  }, [onPress]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowRadius: pressShadowRadius.value,
  }));

  return (
    <Animated.View style={[styles.addSection, entryStyle]}>
      <View style={styles.addButtonContainer}>
        {particleConfigs.map((config) => (
          <Particle
            key={config.id}
            config={config}
            color={colors.primary}
            trigger={particleTrigger}
          />
        ))}

        <AnimatedTouchable
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            buttonStyle,
            shadowStyle,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityLabel={t("home.tapToAddRecord")}
        >
          <Ionicons name="add" size={32} color="#0a0a0a" />
        </AnimatedTouchable>
      </View>

      <Text style={[styles.addLabel, { color: colors.textSecondary }]}>
        {t("home.tapToAddRecord")}
      </Text>
    </Animated.View>
  );
});

// ── Todo List (Apple HIG: list rows, not cards) ──
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("actionItem.title")}
            </Text>
          </View>
          <View style={[styles.todoContainer, { backgroundColor: colors.surface }]}>
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
            style={styles.addBtn}
            accessibilityLabel={t("actionItem.addButton")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {pendingItems.length === 0 ? (
          <View
            style={[
              styles.todoContainer,
              styles.todoEmpty,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={[styles.todoEmptyIcon, { backgroundColor: colors.success + "15" }]}>
              <Ionicons name="checkmark-done-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.todoEmptyTitle, { color: colors.text }]}>
              {t("actionItem.allCompleted")}
            </Text>
            <TouchableOpacity
              style={[styles.todoEmptyBtn, { backgroundColor: colors.primary + "15" }]}
              onPress={onAdd}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.todoEmptyBtnText, { color: colors.primary }]}>
                {t("actionItem.addButton")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.todoContainer, { backgroundColor: colors.surface }]}>
            {pendingItems.map((item, index) => {
              const priority = PRIORITY_CONFIG[item.priority];
              return (
                <React.Fragment key={item.id}>
                  {index > 0 && (
                    <View style={[styles.todoDivider, { backgroundColor: colors.border }]} />
                  )}
                  <TouchableOpacity
                    style={styles.todoRow}
                    onPress={() => onItemPress(item)}
                    activeOpacity={0.5}
                  >
                    <TouchableOpacity
                      style={[
                        styles.todoCheckbox,
                        { borderColor: priority.color },
                      ]}
                      onPress={() => onToggleComplete(item.id, true)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t("actionItem.completed")}
                    >
                      <View style={[styles.todoCheckboxInner, { backgroundColor: priority.color }]} />
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

                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
                  activeOpacity={0.5}
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

// ── Quick Access (Apple HIG: horizontal icon row) ──
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
      <View style={[styles.quickContainer, { backgroundColor: colors.surface }]}>
        {entries.map((entry, index) => {
          const press = usePressAnimation();
          return (
            <React.Fragment key={entry.id}>
              {index > 0 && (
                <View style={[styles.quickDivider, { backgroundColor: colors.border }]} />
              )}
              <AnimatedTouchable
                style={[styles.quickRow, press.style]}
                onPress={() => onEntryPress(entry.route)}
                onPressIn={press.pressIn}
                onPressOut={press.pressOut}
                activeOpacity={1}
                accessibilityLabel={t(entry.labelKey)}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.primary + "12" }]}>
                  <Ionicons name={entry.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]}>
                  {t(entry.labelKey)}
                </Text>
                <View style={styles.quickRight}>
                  {entry.badge !== undefined && entry.badge > 0 && (
                    <View style={[styles.quickBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.quickBadgeText}>{entry.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </AnimatedTouchable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
});

// ── Main Screen ──
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const [userInfo, setUserInfo] = useState<{ nickname?: string; avatar?: string }>({});
  const { actionItems, isLoading, toggleComplete } = useActionItems();

  // Entrance animations (Apple HIG: fade + slide up, staggered)
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(8);
  const addOpacity = useSharedValue(0);
  const addTranslateY = useSharedValue(8);
  const todoOpacity = useSharedValue(0);
  const todoTranslateY = useSharedValue(8);
  const quickOpacity = useSharedValue(0);
  const quickTranslateY = useSharedValue(8);

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
    headerOpacity.value = withTiming(1, { duration: 300 });
    headerTranslateY.value = withTiming(0, { duration: 300 });

addOpacity.value = withDelay(60, withTiming(1, { duration: 300 }));
  addTranslateY.value = withDelay(60, withTiming(0, { duration: 300 }));

    todoOpacity.value = withDelay(120, withTiming(1, { duration: 300 }));
    todoTranslateY.value = withDelay(120, withTiming(0, { duration: 300 }));

    quickOpacity.value = withDelay(180, withTiming(1, { duration: 300 }));
    quickTranslateY.value = withDelay(180, withTiming(0, { duration: 300 }));
  }, []);

  const headerAnim = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const addAnim = useAnimatedStyle(() => ({
    opacity: addOpacity.value,
    transform: [{ translateY: addTranslateY.value }],
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
      { id: "settings", icon: "settings-outline", labelKey: "settings.title", route: "/(views)/settings" },
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

          <Animated.View style={addAnim}>
            <AddButton onPress={handleRecordPress} />
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
    </View>
  );
}

// ── Apple HIG Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
    paddingTop: 4,
  },
  brand: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  avatarButton: {
    padding: 2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Add Button ──
  addSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  addButtonContainer: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: "absolute",
    borderRadius: 10,
  },
  addButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 12,
  },

  // ── Section ──
  section: {
    marginBottom: 28,
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
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  addBtn: {
    padding: 2,
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

  // ── Todo ──
  todoContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  todoEmpty: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  todoEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  todoEmptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
  },
  todoEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
  },
  todoEmptyBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 20,
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  todoCheckboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  todoContent: {
    flex: 1,
    minWidth: 0,
  },
  todoDescription: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
    marginBottom: 4,
  },
  todoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todoPriorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todoPriorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  todoDueDate: {
    fontSize: 13,
  },
  todoDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  todoViewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 4,
  },
  todoViewAllText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Quick Access ──
  quickContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  quickRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  quickDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  // ── Bottom ──
  bottomSpacer: {
    height: 20,
  },
});

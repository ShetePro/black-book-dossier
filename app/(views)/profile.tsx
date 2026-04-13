import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColor } from "@/hooks/useThemeColor";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { useContactStore } from "@/store";
import { useInteractionStore } from "@/store/interactions/interactionStore";
import { useActionItemStore } from "@/store/actionItems/actionItemStore";
import { getStorageItemAsync } from "@/hooks/useStorageState";

type UserInfo = { nickname?: string; avatar?: string };

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  meeting: "聚餐",
  call: "户外运动",
  message: "学习",
  gift: "娱乐",
  other: "其他",
};

const INTERACTION_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  meeting: "restaurant",
  call: "bicycle",
  message: "school",
  gift: "golf",
  other: "ellipsis-horizontal",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { contacts } = useContactStore();
  const { interactions, loadAllInteractions } = useInteractionStore();
  const { actionItems, loadActionItems } = useActionItemStore();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [savedUserInfo] = await Promise.all([
          getStorageItemAsync("userInfo"),
          loadAllInteractions(),
          loadActionItems(),
        ]);
        if (savedUserInfo) {
          try {
            setUserInfo(JSON.parse(savedUserInfo));
          } catch {
            setUserInfo({});
          }
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const totalInteractions = interactions.length;
    const totalActionItems = actionItems.length;
    const completedItems = actionItems.filter((i) => i.completed).length;
    const completionRate =
      totalActionItems > 0
        ? Math.round((completedItems / totalActionItems) * 100)
        : 0;
    const highPriorityContacts = contacts.filter(
      (c) => c.priority === "high"
    ).length;

    const earliestContact = contacts.reduce(
      (min, c) => (c.createdAt < min ? c.createdAt : min),
      Date.now()
    );
    const daysSinceJoined =
      earliestContact < Date.now()
        ? Math.floor((Date.now() - earliestContact) / (1000 * 60 * 60 * 24))
        : 0;

    return {
      totalContacts,
      totalInteractions,
      totalActionItems,
      completionRate,
      highPriorityContacts,
      daysSinceJoined,
    };
  }, [contacts, interactions, actionItems]);

  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    interactions.forEach((interaction) => {
      dist[interaction.type] = (dist[interaction.type] || 0) + 1;
    });
    return Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [interactions]);

  const recentInteractions = useMemo(
    () => interactions.slice(0, 5),
    [interactions]
  );

  const topContacts = useMemo(
    () =>
      contacts
        .filter((c) => c.priority === "high" || c.priority === "medium")
        .slice(0, 5),
    [contacts]
  );

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          个人中心
        </Text>
        <TouchableOpacity onPress={() => router.push("/(views)/settings")}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
          <DefaultAvatar nickname={userInfo.nickname} size={72} />
          <Text style={[styles.userName, { color: colors.text }]}>
            {userInfo.nickname || "未设置昵称"}
          </Text>
          <Text style={[styles.userSubtitle, { color: colors.textMuted }]}>
            已加入 {stats.daysSinceJoined} 天
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            value={stats.totalContacts}
            label="联系人"
            colors={colors}
          />
          <StatCard
            icon="swap-horizontal"
            value={stats.totalInteractions}
            label="交往记录"
            colors={colors}
          />
          <StatCard
            icon="checkbox"
            value={`${stats.completionRate}%`}
            label="待办完成"
            colors={colors}
          />
          <StatCard
            icon="star"
            value={stats.highPriorityContacts}
            label="重要人脉"
            colors={colors}
          />
        </View>

        {typeDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              交往类型分布
            </Text>
            <View style={[styles.distributionCard, { backgroundColor: colors.surface }]}>
              {typeDistribution.map(([type, count]) => {
                const percentage =
                  stats.totalInteractions > 0
                    ? Math.round((count / stats.totalInteractions) * 100)
                    : 0;
                return (
                  <View key={type} style={styles.distributionRow}>
                    <View style={styles.distributionLabel}>
                      <Ionicons
                        name={INTERACTION_TYPE_ICONS[type] || "ellipsis-horizontal"}
                        size={16}
                        color={colors.textMuted}
                      />
                      <Text style={[styles.distributionType, { color: colors.text }]}>
                        {INTERACTION_TYPE_LABELS[type] || type}
                      </Text>
                    </View>
                    <View style={styles.distributionBarContainer}>
                      <View
                        style={[
                          styles.distributionBar,
                          {
                            backgroundColor: colors.primary,
                            width: `${percentage}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.distributionCount, { color: colors.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {recentInteractions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              最近交往
            </Text>
            <View style={[styles.recentCard, { backgroundColor: colors.surface }]}>
              {recentInteractions.map((interaction) => {
                const contact = contacts.find(
                  (c) => c.id === interaction.contactId
                );
                return (
                  <TouchableOpacity
                    key={interaction.id}
                    style={[
                      styles.recentItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/(views)/contact/[id]",
                        params: { id: interaction.contactId },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.recentIcon,
                        { backgroundColor: `${colors.primary}15` },
                      ]}
                    >
                      <Ionicons
                        name={
                          INTERACTION_TYPE_ICONS[interaction.type] ||
                          "ellipsis-horizontal"
                        }
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text
                        style={[styles.recentContent, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {interaction.content}
                      </Text>
                      <Text
                        style={[
                          styles.recentMeta,
                          { color: colors.textMuted },
                        ]}
                      >
                        {contact?.name || "未知"} · {formatDate(interaction.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {topContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              重要人脉
            </Text>
            <View style={[styles.contactsCard, { backgroundColor: colors.surface }]}>
              {topContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.contactItem, { borderBottomColor: colors.border }]}
                  onPress={() =>
                    router.push({
                      pathname: "/(views)/contact/[id]",
                      params: { id: contact.id },
                    })
                  }
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {contact.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {contact.name}
                    </Text>
                    <Text
                      style={[styles.contactMeta, { color: colors.textMuted }]}
                    >
                      {contact.company || "无公司"} · {contact.title || "无职位"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor:
                          contact.priority === "high"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            contact.priority === "high" ? "#ef4444" : "#f59e0b",
                        },
                      ]}
                    >
                      {contact.priority === "high" ? "高" : "中"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            快捷操作
          </Text>
          <View style={[styles.actionsCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/(tabs)/contacts")}
            >
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                全部联系人
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push("/(views)/tags")}
            >
              <Ionicons name="pricetags-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                标签管理
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/(views)/settings")}
            >
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                设置
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  userCard: {
    alignItems: "center",
    paddingVertical: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  userSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  distributionCard: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distributionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 70,
  },
  distributionType: {
    fontSize: 13,
    fontWeight: "500",
  },
  distributionBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  distributionBar: {
    height: 6,
    borderRadius: 3,
  },
  distributionCount: {
    fontSize: 12,
    width: 24,
    textAlign: "right",
  },
  recentCard: {
    borderRadius: 16,
    padding: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: {
    flex: 1,
  },
  recentContent: {
    fontSize: 14,
    fontWeight: "500",
  },
  recentMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  contactsCard: {
    borderRadius: 16,
    padding: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c9a962",
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a0a0a",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
  },
  contactMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionsCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
});

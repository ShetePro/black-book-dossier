import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { DefaultAvatar } from "@/components/DefaultAvatar";

export default function ContactDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  const [activeTab, setActiveTab] = useState("overview");
  
  const scrollY = useSharedValue(0);
  
  const headerStyle = useAnimatedStyle(() => ({
    opacity: 1 - scrollY.value / 200,
    transform: [{ translateY: -scrollY.value / 2 }],
  }));

  // 模拟联系人数据
  const contact = {
    id,
    name: "张三",
    title: "CEO",
    company: "Tech Corp",
    phone: "+86 138 8888 8888",
    email: "zhangsan@example.com",
    tags: ["投资人", "重要客户"],
    notes: "对 AI 项目很感兴趣，下次见面准备详细方案",
    lastContact: "2025-02-10",
    interactions: [
      { date: "2025-02-10", type: "会议", content: "讨论了 AI 项目合作" },
      { date: "2025-01-15", type: "电话", content: "初步意向沟通" },
    ],
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="call" size={22} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, marginLeft: 8 }]}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* 联系人基本信息卡片 */}
        <Animated.View style={[styles.profileCard, { backgroundColor: colors.surface }, headerStyle]}>
          <DefaultAvatar nickname={contact.name} size={100} />
          
          <Text style={[styles.name, { color: colors.text }]}>
            {contact.name}
          </Text>
          
          <Text style={[styles.title, { color: colors.textSecondary }]}>
            {contact.title} · {contact.company}
          </Text>
          
          {/* 标签 */}
          <View style={styles.tagsContainer}>
            {contact.tags.map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          
          {/* 快捷操作 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="call" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>电话</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: `${colors.success}20` }]}>
                <Ionicons name="logo-wechat" size={20} color={colors.success} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>微信</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: `${colors.info}20` }]}>
                <Ionicons name="mail" size={20} color={colors.info} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>邮件</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 详细信息 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            联系方式
          </Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <InfoRow icon="call" label="电话" value={contact.phone} colors={colors} />
            <InfoRow icon="mail" label="邮箱" value={contact.email} colors={colors} />
            <InfoRow icon="business" label="公司" value={contact.company} colors={colors} />
          </View>
        </View>

        {/* 备忘录 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            备忘录
          </Text>
          
          <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
              {contact.notes}
            </Text>
          </View>
        </View>

        {/* 交往记录 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              交往记录
            </Text>
            
            <TouchableOpacity onPress={() => router.push("/(views)/recording")}>
              <Text style={[styles.addRecord, { color: colors.primary }]}>
                + 添加记录
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.timelineCard, { backgroundColor: colors.surface }]}>
            {contact.interactions.map((interaction, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                  {index !== contact.interactions.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineType, { color: colors.text }]}>
                      {interaction.type}
                    </Text>
                    <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                      {interaction.date}
                    </Text>
                  </View>
                  
                  <Text style={[styles.timelineText, { color: colors.textSecondary }]}>
                    {interaction.content}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 信息行组件
function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 32,
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addRecord: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timelineCard: {
    borderRadius: 16,
    padding: 16,
  },
  timelineItem: {
    flexDirection: "row",
    paddingBottom: 20,
  },
  timelineLeft: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    position: "absolute",
    top: 14,
    bottom: 0,
    width: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineType: {
    fontSize: 15,
    fontWeight: "600",
  },
  timelineDate: {
    fontSize: 13,
  },
  timelineText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

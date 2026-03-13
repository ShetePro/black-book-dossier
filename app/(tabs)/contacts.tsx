import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ContactsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();

  // 动画值
  const headerY = useSharedValue(-20);
  const headerOpacity = useSharedValue(0);
  const contentY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 15 });
    headerOpacity.value = withTiming(1, { duration: 400 });
    contentY.value = withSpring(0, { damping: 15 });
    contentOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
    opacity: contentOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} collapsable={false}>
      {/* 头部 */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("contacts.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t("contacts.noContacts")}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(views)/recording")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#0a0a0a" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 搜索栏占位 */}
        <AnimatedTouchable 
          style={[
            styles.searchBar, 
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            contentStyle,
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text style={[styles.searchText, { color: colors.textMuted }]}>
            {t("contacts.search")}
          </Text>
        </AnimatedTouchable>

        {/* 空状态 */}
        <Animated.View style={[styles.emptyContainer, contentStyle]}>
          <View style={[styles.emptyCard, { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }]}>
            {/* 装饰性图标 */}
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="people-outline" size={56} color={colors.primary} />
            </View>
            
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("contacts.noContacts")}
            </Text>
            
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t("contacts.addByRecording")}
            </Text>
            
            {/* 金色行动按钮 */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(views)/recording")}
              activeOpacity={0.9}
            >
              <Ionicons name="mic" size={20} color="#0a0a0a" />
              <Text style={styles.actionButtonText}>
                {t("recording.holdToRecord")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 提示卡片 */}
          <View style={[styles.tipCard, { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }]}>
            <View style={styles.tipHeader}>
              <View style={[styles.tipIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="bulb" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                使用提示
              </Text>
            </View>
            
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              点击下方的金色麦克风按钮，直接说出你刚刚会面的联系人信息，AI 会自动提取并保存。
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Georgia",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
    flex: 1,
  },
  emptyContainer: {
    gap: 16,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    borderStyle: "dashed",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
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
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    gap: 10,
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0a0a0a",
  },
  tipCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

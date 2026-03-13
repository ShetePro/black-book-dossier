import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { getStorageItem } from "@/hooks/useStorageState";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const [userInfo, setUserInfo] = useState<{ nickname?: string; avatar?: string }>({});

  // 动画值
  const micScale = useSharedValue(1);
  const micPulse = useSharedValue(1);
  const cardY = useSharedValue(20);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const storedUserInfo = getStorageItem("userInfo");
    if (storedUserInfo) {
      try {
        const parsed = JSON.parse(storedUserInfo);
        setUserInfo(parsed);
      } catch (e) {
        console.error("解析用户信息失败:", e);
      }
    }
  }, []);

  // 入场动画
  useEffect(() => {
    cardY.value = withSpring(0, { damping: 15, stiffness: 100 });
    cardOpacity.value = withTiming(1, { duration: 600 });
    
    // 麦克风脉冲动画
    micPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: micScale.value },
      { scale: interpolate(micPulse.value, [1, 1.05], [1, 1.02]) }
    ],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));

  const handleMicPressIn = () => {
    micScale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
  };

  const handleMicPressOut = () => {
    micScale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleMicPress = () => {
    router.push("/(views)/recording");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} collapsable={false}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: colors.text }]}>
              Black Book
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              {t("app.tagline")}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push("/(views)/profile")}
            style={styles.avatarButton}
          >
            {userInfo?.avatar ? (
              <View style={styles.avatarContainer}>
                {/* 金色光环 */}
                <View style={[styles.avatarGlow, { borderColor: colors.primary }]} />
                <View style={styles.avatarWrapper}>
                  <DefaultAvatar nickname={userInfo?.nickname} size={44} />
                </View>
              </View>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 主录音按钮 - 奢华金 */}
        <Animated.View style={[styles.micContainer, micAnimatedStyle]}>
          <TouchableOpacity
            onPress={handleMicPress}
            onPressIn={handleMicPressIn}
            onPressOut={handleMicPressOut}
            activeOpacity={0.9}
            style={[styles.micButton, { backgroundColor: colors.primary }]}
          >
            {/* 内发光效果 */}
            <View style={[styles.micInnerGlow, { backgroundColor: colors.primaryLight }]} />
            
            <Ionicons name="mic" size={48} color="#0a0a0a" />
            
            <Text style={styles.micText}>
              {t("recording.holdToRecord")}
            </Text>
            
            {/* 装饰性光点 */}
            <View style={[styles.sparkle, { top: 20, left: 30 }]} />
            <View style={[styles.sparkle, { top: 40, right: 35, width: 4, height: 4 }]} />
          </TouchableOpacity>
        </Animated.View>

        {/* 快捷入口卡片 */}
        <Animated.View style={[styles.cardsContainer, cardAnimatedStyle]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("contacts.title")}
          </Text>
          
          <View style={styles.cardsRow}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/contacts")}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {t("contacts.all")}
              </Text>
              <View style={[styles.cardArrow, { backgroundColor: colors.surface }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(views)/settings")}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="settings" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {t("settings.title")}
              </Text>
              <View style={[styles.cardArrow, { backgroundColor: colors.surface }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 最近联系人区域 */}
        <Animated.View style={[styles.recentSection, cardAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("contacts.recent")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/contacts")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                {t("common.seeAll")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 空状态 */}
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="people-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("contacts.noContacts")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t("contacts.addByRecording")}
            </Text>
            
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={() => router.push("/(views)/recording")}
            >
              <Ionicons name="mic" size={18} color={colors.primary} />
              <Text style={[styles.emptyButtonText, { color: colors.primary }]}>
                {t("recording.holdToRecord")}
              </Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Georgia",
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  avatarButton: {
    position: "relative",
  },
  avatarContainer: {
    position: "relative",
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    opacity: 0.6,
  },
  avatarWrapper: {
    overflow: "hidden",
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  micContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  micButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    // 金色阴影
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  micInnerGlow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 90,
    opacity: 0.3,
  },
  micText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#0a0a0a",
    letterSpacing: 0.5,
  },
  sparkle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    opacity: 0.6,
  },
  cardsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    position: "relative",
    // 卡片阴影
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardArrow: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  recentSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    borderStyle: "dashed",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

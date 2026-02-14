import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
  colors: any;
}

function SettingItem({
  icon,
  title,
  subtitle,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  destructive,
  colors,
}: SettingItemProps) {
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

  const iconColor = destructive ? colors.danger : colors.primary;
  const textColor = destructive ? colors.danger : colors.text;

  return (
    <AnimatedTouchable
      style={[styles.settingItem, { backgroundColor: colors.surface }, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={toggle ? 1 : 0.8}
      disabled={!onPress && !toggle}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {value && !toggle && (
          <Text style={[styles.value, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}

        {toggle && onToggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor={toggleValue ? "#fff" : "#f4f3f4"}
            ios_backgroundColor="#767577"
          />
        )}

        {!toggle && onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </View>
    </AnimatedTouchable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();

  // 设置状态
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // 获取当前语言显示
  const getLanguageLabel = () => {
    const lang = i18n.language;
    if (lang.startsWith("zh")) return "中文";
    return "English";
  };

  // Kill Switch - 销毁所有数据
  const handleKillSwitch = () => {
    Alert.alert(
      "⚠️ 危险操作",
      '此操作将永久删除所有数据，无法恢复。\n\n请输入 "DELETE" 确认',
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认销毁",
          style: "destructive",
          onPress: () => {
            // 实际销毁逻辑
            Alert.alert(
              "数据已销毁",
              "所有数据已被永久删除。应用将重启。",
              [{ text: "确定", onPress: () => console.log("App restart") }]
            );
          },
        },
      ]
    );
  };

  // 导出数据
  const handleExport = () => {
    Alert.alert(
      "导出数据",
      "选择导出格式",
      [
        { text: "取消", style: "cancel" },
        { text: "JSON", onPress: () => console.log("Export JSON") },
        { text: "CSV", onPress: () => console.log("Export CSV") },
      ]
    );
  };

  // 导入数据
  const handleImport = () => {
    Alert.alert(
      "导入数据",
      "导入将合并现有数据，是否继续？",
      [
        { text: "取消", style: "cancel" },
        { text: "选择文件", onPress: () => console.log("Import file") },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("settings.title")}
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 安全设置 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            安全与隐私
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="finger-print"
              title="生物识别锁"
              subtitle="使用 Face ID 保护应用"
              toggle
              toggleValue={biometricEnabled}
              onToggle={setBiometricEnabled}
              colors={colors}
            />

            <SettingItem
              icon="notifications"
              title="智能提醒"
              subtitle="重要联系人生日、纪念日提醒"
              toggle
              toggleValue={notificationsEnabled}
              onToggle={setNotificationsEnabled}
              colors={colors}
            />

            <SettingItem
              icon="shield-checkmark"
              title="自动备份"
              subtitle="每天自动备份到 iCloud"
              toggle
              toggleValue={autoBackup}
              onToggle={setAutoBackup}
              colors={colors}
            />
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            数据管理
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="download"
              title="导出数据"
              subtitle="备份到文件"
              onPress={handleExport}
              colors={colors}
            />

            <SettingItem
              icon="push"
              title="导入数据"
              subtitle="从文件恢复"
              onPress={handleImport}
              colors={colors}
            />

            <SettingItem
              icon="cloud-upload"
              title="iCloud 同步"
              value="已开启"
              onPress={() => router.push("/(views)/sync")}
              colors={colors}
            />
          </View>
        </View>

        {/* 外观设置 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            外观与体验
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="language"
              title="语言"
              value={getLanguageLabel()}
              onPress={() => router.push("/(views)/language")}
              colors={colors}
            />

            <SettingItem
              icon="color-palette"
              title="主题"
              value="暗夜金奢"
              onPress={() => console.log("Theme")}
              colors={colors}
            />

            <SettingItem
              icon="pulse"
              title="触感反馈"
              subtitle="按钮点击振动效果"
              toggle
              toggleValue={hapticEnabled}
              onToggle={setHapticEnabled}
              colors={colors}
            />
          </View>
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            关于
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="information-circle"
              title="关于 Black Book"
              onPress={() => router.push("/(views)/about")}
              colors={colors}
            />

            <SettingItem
              icon="help-circle"
              title="帮助与反馈"
              onPress={() => router.push("/(views)/help")}
              colors={colors}
            />

            <SettingItem
              icon="document-text"
              title="隐私政策"
              onPress={() => console.log("Privacy")}
              colors={colors}
            />

            <SettingItem
              icon="logo-github"
              title="开源代码"
              onPress={() => console.log("GitHub")}
              colors={colors}
            />
          </View>
        </View>

        {/* Kill Switch */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            危险区域
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="warning"
              title="🚨 紧急销毁数据"
              subtitle="立即永久删除所有数据"
              destructive
              onPress={handleKillSwitch}
              colors={colors}
            />
          </View>

          <Text style={[styles.warningText, { color: colors.textMuted }]}>
            此操作不可撤销。所有联系人、交往记录和设置将被永久删除。
          </Text>
        </View>

        {/* 版本信息 */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Black Book v1.0.0
          </Text>
          <Text style={[styles.buildText, { color: colors.textMuted }]}>
            Build 2025.02.14
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    fontSize: 15,
    marginRight: 4,
  },
  warningText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buildText: {
    fontSize: 12,
    marginTop: 4,
  },
});

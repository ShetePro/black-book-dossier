import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
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
import { useSettingsStore } from "@/store/settingsStore";
import { exportContactsToCSV } from "@/services/export/csvExport";
import { clearAllAppData } from "@/services/dataClear";
import { useContactStore } from "@/store";

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
  const { settings, updateSetting } = useSettingsStore();

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
  const handleKillSwitch = async () => {
    Alert.alert(
      "⚠️ 危险操作",
      '此操作将永久删除所有数据，无法恢复。\n\n请输入 "DELETE" 确认删除账户',
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认销毁",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await clearAllAppData();
              if (result.success) {
                // 重置所有 store 状态
                const { loadContacts } = useContactStore.getState();
                await loadContacts();
                
                Alert.alert(
                  "账户已删除",
                  "所有数据已被永久删除。应用将返回首页。",
                  [
                    { 
                      text: "确定", 
                      onPress: () => {
                        router.replace("/(tabs)");
                      }
                    }
                  ]
                );
              } else {
                Alert.alert("删除失败", result.error || "删除数据时出错，请重试");
              }
            } catch (error) {
              console.error('[KillSwitch] Error:', error);
              Alert.alert("删除失败", "删除过程中发生错误");
            }
          },
        },
      ]
    );
  };

  // 导出数据
  const handleExport = async (format: 'json' | 'csv') => {
    if (format === 'csv') {
      try {
        const result = await exportContactsToCSV();
        if (result.success) {
          Alert.alert(
            "导出成功",
            `联系人已导出到:\n${result.filePath}`,
            [{ text: "确定" }]
          );
        } else {
          Alert.alert("导出失败", result.error || "导出失败，请重试");
        }
      } catch (error) {
        console.error('[Settings] CSV export error:', error);
        Alert.alert("导出失败", "导出过程中发生错误");
      }
    } else {
      Alert.alert("JSON 导出", "JSON 格式导出功能开发中...");
    }
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
              title="导出 CSV"
              subtitle="导出联系人为 CSV 格式"
              onPress={() => handleExport('csv')}
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

        {/* AI 智能设置 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            AI 智能
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="git-merge"
              title="自动合并高置信度"
              subtitle="匹配度超过80%时自动提示合并"
              toggle
              toggleValue={settings.ai.matching.autoMergeHighConfidence}
              onToggle={(value) =>
                updateSetting("ai.matching.autoMergeHighConfidence", value)
              }
              colors={colors}
            />

            <SettingItem
              icon="list"
              title="显示相似联系人"
              subtitle="匹配时显示候选联系人列表"
              toggle
              toggleValue={settings.ai.matching.showSimilarContacts}
              onToggle={(value) =>
                updateSetting("ai.matching.showSimilarContacts", value)
              }
              colors={colors}
            />

          <SettingItem
            icon="options"
            title="匹配阈值"
            subtitle={`当前: ${(settings.ai.matching.threshold * 100).toFixed(
              0
            )}% · 低于此值将创建新联系人`}
            onPress={() => {
              Alert.alert(
                "设置匹配阈值",
                "调整联系人匹配的敏感度",
                [
                  {
                    text: "低 (50%)",
                    onPress: () =>
                      updateSetting("ai.matching.threshold", 0.5),
                  },
                  {
                    text: "中 (70%)",
                    onPress: () =>
                      updateSetting("ai.matching.threshold", 0.7),
                  },
                  {
                    text: "高 (90%)",
                    onPress: () =>
                      updateSetting("ai.matching.threshold", 0.9),
                  },
                  { text: "取消", style: "cancel" },
                ]
              );
            }}
            colors={colors}
          />

          <SettingItem
            icon="hardware-chip-outline"
            title="AI 模型管理"
            subtitle={
              settings.ai.localModel.downloaded
                ? `${settings.ai.localModel.modelName} · ${settings.ai.localModel.modelSize}MB`
                : "下载本地 AI 模型以启用离线功能"
            }
            onPress={() => router.push("/(views)/ai-models")}
            colors={colors}
          />
        </View>
      </View>

      {/* 录音设置 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          录音设置
        </Text>

        <View style={styles.card}>
          <SettingItem
            icon="mic"
            title="录音方式"
            subtitle={settings.recording.mode === 'hold' ? '长按录音（按住开始，松开结束）' : '点击录音（点击开始/结束）'}
            onPress={() => {
              Alert.alert(
                "选择录音方式",
                "选择适合您的录音操作方式",
                [
                  {
                    text: "长按录音",
                    onPress: () =>
                      updateSetting("recording.mode", "hold"),
                  },
                  {
                    text: "点击录音",
                    onPress: () =>
                      updateSetting("recording.mode", "tap"),
                  },
                  { text: "取消", style: "cancel" },
                ]
              );
            }}
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
  // AI Model related styles
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '600',
  },
  modelDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  modelSize: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteModelBtn: {
    padding: 8,
  },
  modelSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  modelCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelCardName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  modelCardSize: {
    fontSize: 14,
    fontWeight: '500',
  },
  modelCardDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  hideModelsBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});

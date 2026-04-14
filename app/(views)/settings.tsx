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
    if (lang.startsWith("zh")) return t("language.chinese");
    return t("language.english");
  };

  // Kill Switch - 销毁所有数据
  const handleKillSwitch = async () => {
    Alert.alert(
      t("settings.killSwitchConfirmTitle"),
      t("settings.killSwitchConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.killSwitchConfirmButton"),
          style: "destructive",
          onPress: async () => {
            try {
              const result = await clearAllAppData();
              if (result.success) {
                const { loadContacts } = useContactStore.getState();
                await loadContacts();
                
                Alert.alert(
                  t("settings.accountDeleted"),
                  t("settings.accountDeletedMessage"),
                  [
                    { 
                      text: t("common.ok"), 
                      onPress: () => {
                        router.replace("/(tabs)");
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(t("settings.deleteError"), result.error || t("settings.deleteError"));
              }
            } catch (error) {
              console.error('[KillSwitch] Error:', error);
              Alert.alert(t("settings.deleteError"), t("settings.deleteError"));
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
            t("settings.exportSuccess"),
            t("settings.exportSuccessMessage", { path: result.filePath }),
            [{ text: t("common.ok") }]
          );
        } else {
          Alert.alert(t("settings.exportError"), result.error || t("settings.exportError"));
        }
      } catch (error) {
        console.error('[Settings] CSV export error:', error);
        Alert.alert(t("settings.exportError"), t("settings.exportError"));
      }
    } else {
      Alert.alert("JSON", "JSON export coming soon...");
    }
  };

  // 导入数据
  const handleImport = () => {
    Alert.alert(
      t("settings.importTitle"),
      t("settings.importMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("settings.importSelectFile"), onPress: () => console.log("Import file") },
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
            {t("settings.security")}
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="finger-print"
              title={t("settings.biometricLock")}
              subtitle={t("settings.biometricSubtitle")}
              toggle
              toggleValue={biometricEnabled}
              onToggle={setBiometricEnabled}
              colors={colors}
            />

            <SettingItem
              icon="notifications"
              title={t("settings.smartReminders")}
              subtitle={t("settings.smartRemindersSubtitle")}
              toggle
              toggleValue={notificationsEnabled}
              onToggle={setNotificationsEnabled}
              colors={colors}
            />

            <SettingItem
              icon="shield-checkmark"
              title={t("settings.autoBackup")}
              subtitle={t("settings.autoBackupSubtitle")}
              toggle
              toggleValue={autoBackup}
              onToggle={setAutoBackup}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("settings.dataManagement")}
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="download"
              title={t("settings.exportCSV")}
              subtitle={t("settings.exportCSVSubtitle")}
              onPress={() => handleExport('csv')}
              colors={colors}
            />

            <SettingItem
              icon="push"
              title={t("settings.importData")}
              subtitle={t("settings.importDataSubtitle")}
              onPress={handleImport}
              colors={colors}
            />

            <SettingItem
              icon="cloud-upload"
              title={t("settings.iCloudSync")}
              value={t("settings.iCloudSyncValue")}
              onPress={() => router.push("/(views)/sync")}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("settings.appearance")}
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="language"
              title={t("settings.language")}
              value={getLanguageLabel()}
              onPress={() => router.push("/(views)/language")}
              colors={colors}
            />

            <SettingItem
              icon="color-palette"
              title={t("settings.theme")}
              value={t("settings.themeValue")}
              onPress={() => console.log("Theme")}
              colors={colors}
            />

            <SettingItem
              icon="pulse"
              title={t("settings.hapticFeedback")}
              subtitle={t("settings.hapticFeedbackSubtitle")}
              toggle
              toggleValue={hapticEnabled}
              onToggle={setHapticEnabled}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("settings.ai")}
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="git-merge"
              title={t("settings.autoMerge")}
              subtitle={t("settings.autoMergeSubtitle")}
              toggle
              toggleValue={settings.ai.matching.autoMergeHighConfidence}
              onToggle={(value) =>
                updateSetting("ai.matching.autoMergeHighConfidence", value)
              }
              colors={colors}
            />

            <SettingItem
              icon="list"
              title={t("settings.showSimilar")}
              subtitle={t("settings.showSimilarSubtitle")}
              toggle
              toggleValue={settings.ai.matching.showSimilarContacts}
              onToggle={(value) =>
                updateSetting("ai.matching.showSimilarContacts", value)
              }
              colors={colors}
            />

          <SettingItem
            icon="options"
            title={t("settings.matchingThreshold")}
            subtitle={t("settings.matchingThresholdSubtitle", { threshold: (settings.ai.matching.threshold * 100).toFixed(0) })}
            onPress={() => {
              Alert.alert(
                t("settings.thresholdTitle"),
                t("settings.thresholdMessage"),
                [
                  {
                    text: t("settings.thresholdLow"),
                    onPress: () =>
                      updateSetting("ai.matching.threshold", 0.5),
                  },
                  {
                    text: t("settings.thresholdMedium"),
                    onPress: () =>
                      updateSetting("ai.matching.threshold", 0.7),
                  },
                  {
                    text: t("settings.thresholdHigh"),
                    onPress: () =>
                      updateSetting("ai.matching.threshold", 0.9),
                  },
                  { text: t("common.cancel"), style: "cancel" },
                ]
              );
            }}
            colors={colors}
          />

          <SettingItem
            icon="hardware-chip-outline"
            title={t("settings.aiModelManagement")}
            subtitle={
              settings.ai.localModel.downloaded
                ? `${settings.ai.localModel.modelName} · ${settings.ai.localModel.modelSize}MB`
                : t("settings.aiModelSubtitle")
            }
            onPress={() => router.push("/(views)/ai-models")}
            colors={colors}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {t("settings.recording")}
        </Text>

        <View style={styles.card}>
          <SettingItem
            icon="mic"
            title={t("settings.recordingMode")}
            subtitle={settings.recording.mode === 'hold' ? t("settings.recordingModeHold") : t("settings.recordingModeTap")}
            onPress={() => {
              Alert.alert(
                t("settings.recordingModeTitle"),
                t("settings.recordingModeMessage"),
                [
                  {
                    text: t("settings.recordingModeHoldOption"),
                    onPress: () =>
                      updateSetting("recording.mode", "hold"),
                  },
                  {
                    text: t("settings.recordingModeTapOption"),
                    onPress: () =>
                      updateSetting("recording.mode", "tap"),
                  },
                  { text: t("common.cancel"), style: "cancel" },
                ]
              );
            }}
            colors={colors}
          />
        </View>
      </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("settings.about")}
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="information-circle"
              title={t("settings.aboutApp")}
              onPress={() => router.push("/(views)/about")}
              colors={colors}
            />

            <SettingItem
              icon="help-circle"
              title={t("settings.help")}
              onPress={() => router.push("/(views)/help")}
              colors={colors}
            />

            <SettingItem
              icon="document-text"
              title={t("settings.privacy")}
              onPress={() => router.push("/(views)/privacy")}
              colors={colors}
            />

            <SettingItem
              icon="logo-github"
              title={t("settings.openSource")}
              onPress={() => console.log("GitHub")}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            {t("settings.dangerZone")}
          </Text>

          <View style={styles.card}>
            <SettingItem
              icon="warning"
              title={t("settings.killSwitch")}
              subtitle={t("settings.killSwitchSubtitle")}
              destructive
              onPress={handleKillSwitch}
              colors={colors}
            />
          </View>

          <Text style={[styles.warningText, { color: colors.textMuted }]}>
            {t("settings.killSwitchWarning")}
          </Text>
        </View>

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

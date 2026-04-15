import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

const APP_VERSION = "1.0.0";

interface InfoLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColor>;
  isLast?: boolean;
}

function InfoLink({ icon, title, subtitle, onPress, colors, isLast }: InfoLinkProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.infoLink,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.infoLinkIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoLinkContent}>
        <Text style={[styles.infoLinkTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.infoLinkSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColor();

  const openGitHub = () => {
    Linking.openURL("https://github.com/ShetePro/black-book-dossier");
  };

  const openPrivacy = () => {
    router.push("/(views)/privacy");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("about.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo 区域 */}
        <View style={[styles.logoCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="book" size={40} color="#0a0a0a" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Black Book</Text>
          <Text style={[styles.appSlogan, { color: colors.textMuted }]}>
            {t("about.slogan")}
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.versionText, { color: colors.primary }]}>
              v{APP_VERSION}
            </Text>
          </View>
        </View>

        {/* 应用介绍 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("about.appIntro")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              {t("about.introText")}
            </Text>
          </View>
        </View>

        {/* 核心特性 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("about.coreFeatures")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <FeatureItem
              icon="mic"
              title={t("about.featureVoice")}
              description={t("about.featureVoiceDesc")}
              colors={colors}
            />
            <FeatureItem
              icon="hardware-chip"
              title={t("about.featureAI")}
              description={t("about.featureAIDesc")}
              colors={colors}
            />
            <FeatureItem
              icon="shield-checkmark"
              title={t("about.featurePrivacy")}
              description={t("about.featurePrivacyDesc")}
              colors={colors}
            />
            <FeatureItem
              icon="finger-print"
              title={t("about.featureSecurity")}
              description={t("about.featureSecurityDesc")}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* 更多信息 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("about.moreInfo")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <InfoLink
              icon="document-text"
              title={t("about.privacyPolicy")}
              onPress={openPrivacy}
              colors={colors}
            />
            <InfoLink
              icon="logo-github"
              title={t("about.openSource")}
              subtitle="GitHub"
              onPress={openGitHub}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* 版本信息 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("about.versionInfo")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, { color: colors.textMuted }]}>
                {t("about.version")}
              </Text>
              <Text style={[styles.versionValue, { color: colors.text }]}>
                {APP_VERSION}
              </Text>
            </View>
            <View style={[styles.versionRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Text style={[styles.versionLabel, { color: colors.textMuted }]}>
                {t("about.build")}
              </Text>
              <Text style={[styles.versionValue, { color: colors.text }]}>
                2025.02.14
              </Text>
            </View>
          </View>
        </View>

        {/* 底部版权 */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.textMuted }]}>
            © 2025 Black Book. {t("about.allRightsReserved")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  colors,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: ReturnType<typeof useThemeColor>;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.featureItem,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{description}</Text>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  logoCard: {
    alignItems: "center",
    paddingVertical: 32,
    borderRadius: 20,
    marginBottom: 24,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  appSlogan: {
    fontSize: 14,
    marginBottom: 12,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
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
  introText: {
    fontSize: 14,
    lineHeight: 22,
    padding: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  infoLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLinkContent: {
    flex: 1,
  },
  infoLinkTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  infoLinkSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  versionLabel: {
    fontSize: 14,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  copyright: {
    fontSize: 12,
  },
});

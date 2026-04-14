import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();

  const sections = [
    {
      title: t("privacy.section1Title"),
      content: t("privacy.section1Content"),
    },
    {
      title: t("privacy.section2Title"),
      content: t("privacy.section2Content"),
    },
    {
      title: t("privacy.section3Title"),
      content: t("privacy.section3Content"),
    },
    {
      title: t("privacy.section4Title"),
      content: t("privacy.section4Content"),
    },
    {
      title: t("privacy.section5Title"),
      content: t("privacy.section5Content"),
    },
    {
      title: t("privacy.section6Title"),
      content: t("privacy.section6Content"),
    },
    {
      title: t("privacy.section7Title"),
      content: t("privacy.section7Content"),
    },
    {
      title: t("privacy.section8Title"),
      content: t("privacy.section8Content"),
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("privacy.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 简介 */}
        <View
          style={[
            styles.introCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.introIcon,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            {t("privacy.introTitle")}
          </Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            {t("privacy.introText")}
          </Text>
        </View>

        {/* 政策内容 */}
        <View style={styles.sectionsContainer}>
          {sections.map((section, index) => (
            <View
              key={index}
              style={[
                styles.section,
                { borderBottomColor: colors.border },
                index === sections.length - 1 && styles.lastSection,
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              <Text
                style={[styles.sectionContent, { color: colors.textSecondary }]}
              >
                {section.content}
              </Text>
            </View>
          ))}
        </View>

        {/* 生效日期 */}
        <Text style={[styles.effectiveDate, { color: colors.textMuted }]}>
          {t("privacy.effectiveDate")}
        </Text>

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
  backButton: {
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
  introCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionsContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  effectiveDate: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
  },
});

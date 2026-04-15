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

interface FAQItemProps {
  question: string;
  answer: string;
  colors: ReturnType<typeof useThemeColor>;
  isLast?: boolean;
}

function FAQItem({ question, answer, colors, isLast }: FAQItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.faqItem,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </View>
      {expanded && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
}

interface ContactItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColor>;
  isLast?: boolean;
}

function ContactItem({ icon, title, subtitle, onPress, colors, isLast }: ContactItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.contactItem,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.contactIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.contactContent}>
        <Text style={[styles.contactTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.contactSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColor();

  const openEmail = () => {
    Linking.openURL("mailto:support@blackbook.app");
  };

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
          {t("help.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 快速帮助 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("help.quickHelp")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <ContactItem
              icon="mail"
              title={t("help.emailSupport")}
              subtitle="support@blackbook.app"
              onPress={openEmail}
              colors={colors}
            />
            <ContactItem
              icon="logo-github"
              title={t("help.githubIssues")}
              subtitle="GitHub Issues"
              onPress={openGitHub}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* 常见问题 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("help.faq")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <FAQItem
              question={t("help.faq1Q")}
              answer={t("help.faq1A")}
              colors={colors}
            />
            <FAQItem
              question={t("help.faq2Q")}
              answer={t("help.faq2A")}
              colors={colors}
            />
            <FAQItem
              question={t("help.faq3Q")}
              answer={t("help.faq3A")}
              colors={colors}
            />
            <FAQItem
              question={t("help.faq4Q")}
              answer={t("help.faq4A")}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* 隐私与安全 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("help.privacySecurity")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <ContactItem
              icon="shield-checkmark"
              title={t("help.privacyPolicy")}
              subtitle={t("help.privacyPolicyDesc")}
              onPress={openPrivacy}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* 提示卡片 */}
        <View style={[styles.tipCard, { backgroundColor: `${colors.primary}10` }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {t("help.tipText")}
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
    fontSize: 18,
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
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  contactSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  faqItem: {
    padding: 16,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginLeft: 28,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSettingsStore, Language, LANGUAGE_NAMES } from "@/store/settingsStore";
import i18n from "@/locales/i18n";

interface LanguageOptionProps {
  code: Language;
  name: string;
  nativeName: string;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColor>;
  isLast?: boolean;
}

function LanguageOption({ code, name, nativeName, isSelected, onPress, colors, isLast }: LanguageOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.languageItem,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.languageLeft}>
        <Text style={[styles.languageName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.languageNative, { color: colors.textMuted }]}>{nativeName}</Text>
      </View>

      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={16} color="#0a0a0a" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function LanguageView() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const { settings, updateSetting } = useSettingsStore();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: "zh-CN", name: t("language.chinese"), nativeName: "简体中文" },
    { code: "en-US", name: t("language.english"), nativeName: "English" },
  ];

  const handleLanguageChange = async (code: Language) => {
    console.log('[LanguageView] Switching to:', code);
    await i18n.changeLanguage(code);
    console.log('[LanguageView] i18n language now:', i18n.language);
    await updateSetting("language", code);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("language.title")}
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {t("language.description")}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {languages.map((lang, index) => (
            <LanguageOption
              key={lang.code}
              code={lang.code}
              name={lang.name}
              nativeName={lang.nativeName}
              isSelected={settings.language === lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              colors={colors}
              isLast={index === languages.length - 1}
            />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            {t("language.currentLanguage")}: {LANGUAGE_NAMES[settings.language]}
          </Text>
        </View>
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  languageLeft: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(128,128,128,0.05)",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

import { Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSettingsStore, Language, LANGUAGE_NAMES } from "@/store/settingsStore";

interface LanguageOptionProps {
  code: Language;
  name: string;
  isSelected: boolean;
  onPress: () => void;
}

const LanguageOption = ({ code, name, isSelected, onPress }: LanguageOptionProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-800"
  >
    <View className="flex-row items-center">
      <Text className="text-base text-slate-700 dark:text-slate-200 font-medium">
        {name}
      </Text>
    </View>
    
    {isSelected && (
      <Ionicons name="checkmark" size={24} color="#3B82F6" />
    )}
  </TouchableOpacity>
);

export default function LanguageView() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  const languages: { code: Language; name: string }[] = [
    { code: "cn", name: LANGUAGE_NAMES.cn },
    { code: "en", name: LANGUAGE_NAMES.en },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900 px-4">
      <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-2 mt-4">
        {t("language.title")}
      </Text>
      <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
        {languages.map((lang, index) => (
          <View key={lang.code}>
            <LanguageOption
              code={lang.code}
              name={lang.name}
              isSelected={settings.language === lang.code}
              onPress={() => updateSetting("language", lang.code)}
            />
            {index < languages.length - 1 && (
              <View className="h-px bg-gray-100 dark:bg-slate-700 ml-4" />
            )}
          </View>
        ))}
      </View>
      
      <Text className="text-slate-400 text-xs mt-4 ml-2">
        {t("language.title")} / Language
      </Text>
    </SafeAreaView>
  );
}

import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const APP_VERSION = "1.0.0";

export default function AboutScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={["top"]}>
      {/* 顶部导航 */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800 dark:text-white ml-2">
          {t("about.title")}
        </Text>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Logo 区域 */}
        <View className="items-center py-10">
          <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-4 shadow-lg">
            <Ionicons name="book" size={48} color="white" />
          </View>
          <Text className="text-2xl font-bold text-slate-800 dark:text-white">
            Black Book
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-1">
            {t("about.slogan")}
          </Text>
          <View className="flex-row items-center mt-3 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
            <Text className="text-slate-600 dark:text-slate-300 text-sm">
              v{APP_VERSION}
            </Text>
          </View>
        </View>

        {/* 版本信息 */}
        <View className="mb-6">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-2">
            {t("about.versionInfo")}
          </Text>
          <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4">
              <Text className="text-base text-slate-700 dark:text-slate-200 font-medium">
                {t("about.version")}
              </Text>
              <Text className="text-slate-400 text-sm">{APP_VERSION}</Text>
            </View>
          </View>
        </View>

        {/* 底部版权 */}
        <View className="items-center py-8">
          <Text className="text-slate-400 text-xs">
            © 2025 Black Book. {t("about.allRightsReserved")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

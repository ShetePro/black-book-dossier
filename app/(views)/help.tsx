import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const openEmail = () => {
    Linking.openURL("mailto:support@example.com");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 dark:bg-slate-900"
      edges={["top"]}
    >
      {/* 顶部导航 */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800 dark:text-white ml-2">
          {t("help.title")}
        </Text>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* 联系我们 */}
        <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
          <TouchableOpacity
            onPress={openEmail}
            className="flex-row items-center"
          >
            <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
              <Ionicons name="mail-outline" size={20} color="#6366f1" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base text-slate-700 dark:text-slate-200 font-medium">
                {t("help.contactUs")}
              </Text>
              <Text className="text-slate-400 text-sm mt-0.5">
                support@example.com
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* 底部提示 */}
        <View className="px-6 py-8">
          <View className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text className="text-indigo-700 dark:text-indigo-300 text-sm ml-2 flex-1 leading-5">
                {t("help.responseTime")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

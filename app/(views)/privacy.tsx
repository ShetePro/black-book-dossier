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
import { useThemeColor } from "@/hooks/useThemeColor";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colors = useThemeColor();

  const sections = [
    {
      title: "1. 数据收集",
      content:
        "Black Book 是一款本地优先的人脉管理应用。我们仅在您的设备本地存储以下数据：\n\n" +
        "• 联系人信息（姓名、电话、邮箱、公司等）\n" +
        "• 交往记录和待办事项\n" +
        "• 语音录音（仅用于转录，可手动删除）\n" +
        "• 应用设置和偏好\n\n" +
        "重要：所有数据仅存储在您的设备上，我们不会上传任何数据到服务器。",
    },
    {
      title: "2. 数据存储",
      content:
        "您的数据存储在以下位置：\n\n" +
        "• SQLite 数据库（应用私有目录）\n" +
        "• 本地文件系统（录音、备份文件）\n" +
        "• iOS Keychain / Android Keystore（敏感设置）\n\n" +
        "数据不会同步到云端，除非您手动启用 iCloud 备份功能。",
    },
    {
      title: "3. 权限使用",
      content:
        "应用需要以下权限来提供服务：\n\n" +
        "• 麦克风：用于语音录音功能\n" +
        "• 通讯录：用于导入联系人（可选）\n" +
        "• FaceID/TouchID：用于应用锁保护\n" +
        "• 文件系统：用于导出备份文件\n\n" +
        "所有权限仅用于本地功能，不会上传任何数据。",
    },
    {
      title: "4. 数据安全",
      content:
        "我们采用多种措施保护您的数据：\n\n" +
        "• 生物识别锁（FaceID/TouchID）\n" +
        "• 安全存储敏感信息\n" +
        "• 本地数据加密（iOS/Android 系统级）\n" +
        "• 无网络传输，杜绝数据泄露风险",
    },
    {
      title: "5. 您的权利",
      content:
        "您对数据拥有完全控制权：\n\n" +
        "• 查看：随时查看所有存储的数据\n" +
        "• 导出：导出为 CSV 或 JSON 格式\n" +
        "• 删除：一键删除所有数据（Kill Switch）\n" +
        "• 备份：手动备份到 iCloud 或本地",
    },
    {
      title: "6. 第三方服务",
      content:
        "应用使用以下第三方服务：\n\n" +
        "• Whisper（本地语音识别）\n" +
        "• iCloud（可选备份，仅在您启用时）\n\n" +
        "所有语音识别在本地完成，不会上传语音数据到任何服务器。",
    },
    {
      title: "7. 隐私政策更新",
      content:
        "我们可能会更新本隐私政策。更新将在应用内通知您。继续使用应用即表示您同意更新后的政策。",
    },
    {
      title: "8. 联系我们",
      content:
        "如果您对隐私政策有任何疑问，请联系我们：\n\n" +
        "• 邮箱：privacy@blackbook.app\n" +
        "• GitHub：https://github.com/ShetePro/black-book",
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
          隐私政策
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
            您的数据，您掌控
          </Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Black Book 采用本地优先架构，所有数据仅存储在您的设备上。我们不收集、不上传、不分享您的任何数据。
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
          生效日期：2026年4月1日
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

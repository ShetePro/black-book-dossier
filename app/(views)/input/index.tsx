import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRecorder } from "@/hooks/useRecorder";

type InputMode = "keyboard" | "voice";

const QUICK_TAGS = ["打篮球", "喝咖啡", "开会", "聚餐", "电话沟通", "商务洽谈", "面试", "约会"];

const TIPS = [
  "记录今天的会面内容",
  "记下重要的联系人信息",
  "记录待办事项和提醒",
];

export default function InputScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [inputMode, setInputMode] = useState<InputMode>("keyboard");
  const [text, setText] = useState("");

  const { startRecording, stopRecording, isRecording: recorderIsRecording, duration: recorderDuration } = useRecorder();

  const handleBack = () => {
    router.back();
  };

  const handleSend = () => {
    if (text.trim()) {
      router.push({
        pathname: "/(views)/agent-review",
        params: { text: text.trim(), mode: "text" },
      });
    }
  };

  const handleTagPress = (tag: string) => {
    setText((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const handleVoicePress = async () => {
    if (recorderIsRecording) {
      const result = await stopRecording();
      if (result?.text) {
        setText(result.text);
        setInputMode("keyboard");
      }
    } else {
      await startRecording();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>新建记录</Text>
          <View style={styles.headerRight} />
        </View>

        {/* 上方提示区域 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp} style={styles.tipsContainer}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>今天想记录什么？</Text>
            <View style={styles.tipsList}>
              {TIPS.map((tip, index) => (
                <View key={index} style={[styles.tipItem, { backgroundColor: `${colors.primary}10` }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.textMuted }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* 快捷标签 */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.tagsContainer}>
            <Text style={[styles.tagsLabel, { color: colors.textMuted }]}>快捷标签</Text>
            <View style={styles.tagsRow}>
              {QUICK_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => handleTagPress(tag)}
                  style={[styles.tag, { backgroundColor: `${colors.primary}15`, borderColor: colors.border }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* 底部输入区域 */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.bottomArea}>
          {/* 输入框 + 发送按钮 */}
          {inputMode === "keyboard" ? (
            <View style={styles.inputRow}>
              <View style={[styles.textInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  multiline
                  placeholder="描述你的活动..."
                  placeholderTextColor={colors.textMuted}
                  value={text}
                  onChangeText={setText}
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim()}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: text.trim() ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons name="arrow-up" size={20} color={text.trim() ? "#ffffff" : colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                onPress={handleVoicePress}
                style={[
                  styles.voiceButton,
                  { backgroundColor: recorderIsRecording ? colors.danger : colors.primary },
                ]}
              >
                <Ionicons
                  name={recorderIsRecording ? "stop" : "mic"}
                  size={48}
                  color="#0a0a0a"
                />
              </TouchableOpacity>
              <Text style={[styles.voiceHint, { color: colors.textMuted }]}>
                {recorderIsRecording ? "点击停止录音" : "点击开始录音"}
              </Text>
              {recorderIsRecording && (
                <Text style={[styles.recordingTime, { color: colors.danger }]}>
                  录音中... {recorderDuration}s
                </Text>
              )}
            </View>
          )}

          {/* 模式切换居中 */}
          <View style={styles.modeSwitcherContainer}>
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                onPress={() => setInputMode("keyboard")}
                style={[
                  styles.modeButton,
                  inputMode === "keyboard" && { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Ionicons
                  name="keypad-outline"
                  size={18}
                  color={inputMode === "keyboard" ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    { color: inputMode === "keyboard" ? colors.primary : colors.textMuted },
                  ]}
                >
                  键盘
                </Text>
              </TouchableOpacity>

              <View style={[styles.modeDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                onPress={() => setInputMode("voice")}
                style={[
                  styles.modeButton,
                  inputMode === "voice" && { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Ionicons
                  name="mic-outline"
                  size={18}
                  color={inputMode === "voice" ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    { color: inputMode === "voice" ? colors.primary : colors.textMuted },
                  ]}
                >
                  语音
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 16,
    fontFamily: "Georgia",
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  textInputWrapper: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 22,
    maxHeight: 96,
    textAlignVertical: "center",
    padding: 0,
  },
  modeSwitcherContainer: {
    alignItems: "center",
  },
  modeSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  voiceContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  voiceButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  voiceHint: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  recordingTime: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  modeDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

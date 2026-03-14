import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface AnalyzingStateProps {
  usingLocalLLM: boolean;
  language: string;
  primaryColor?: string;
  textColor?: string;
  textMutedColor?: string;
}

export const AnalyzingState: React.FC<AnalyzingStateProps> = ({
  usingLocalLLM,
  language,
  primaryColor = '#c9a962',
  textColor = '#f5f5f5',
  textMutedColor = '#737373',
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}15` }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
      <ThemedText style={[styles.title, { color: textColor }]}>
        AI 正在分析语音内容...
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: textMutedColor }]}>
        {usingLocalLLM ? '使用本地 LLM 模型' : '使用规则引擎'} · 语言: {language} · 提取关键信息并匹配联系人
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

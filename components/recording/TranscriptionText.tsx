import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LoadingDots } from './LoadingDots';

interface TranscriptionTextProps {
  text: string;
  isRecording: boolean;
  isTranscribing?: boolean;
}

export const TranscriptionText: React.FC<TranscriptionTextProps> = ({
  text,
  isRecording,
  isTranscribing = false,
}) => {
  const colors = useThemeColor();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 用于平滑显示的文本
  const [displayText, setDisplayText] = useState('');
  const prevTextRef = useRef('');
  
  // 实时更新显示文本（不再使用打字机效果，以支持流式输出）
  useEffect(() => {
    if (text !== prevTextRef.current) {
      setDisplayText(text);
      prevTextRef.current = text;
    }
  }, [text]);

  // 自动滚动到底部
  useEffect(() => {
    if (displayText && scrollViewRef.current) {
      // 使用 setTimeout 确保在渲染完成后滚动
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayText]);

  const getStatusText = () => {
    if (isTranscribing) return '正在转录';
    if (isRecording) return '正在聆听';
    return '';
  };

  const statusText = getStatusText();
  const showLoading = isRecording || isTranscribing;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* 状态提示 */}
      {(isRecording || isTranscribing) && (
        <View style={styles.statusRow}>
          <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.statusText, { color: colors.textMuted }]} >
            {statusText}
          </Text>
          {showLoading && <LoadingDots />}
        </View>
      )}

      {/* 转录文本区域 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        {displayText ? (
          <Text style={[styles.transcriptionText, { color: colors.primary }]} >
            {displayText}
          </Text>
        ) : (
          <Text style={[styles.placeholderText, { color: colors.textMuted }]} >
            {isRecording ? '等待语音输入...' : '点击麦克风开始录音'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 100,
    maxHeight: 150, // 增加高度以显示更多内容
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  placeholderText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

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

  // 当文本变化时自动滚动到底部
  useEffect(() => {
    if (text && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [text]);

  const getStatusText = () => {
    if (isTranscribing) {
      return '正在转录...';
    }
    if (isRecording) {
      return '正在聆听...';
    }
    return '';
  };

  const statusText = getStatusText();

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
          {isTranscribing && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.spinner}
            />
          )}
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
        {text ? (
          <Text style={[styles.transcriptionText, { color: colors.primary }]} >
            {text}
            {isRecording && <Text style={styles.cursor}>▋</Text>}
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
    maxHeight: 120, // 限制3行高度
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
  spinner: {
    marginLeft: 8,
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
  cursor: {
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

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
  
  // 打字机效果状态
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingIndexRef = useRef(0);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 打字机效果
  useEffect(() => {
    if (!text || text === displayText) {
      setIsTyping(false);
      return;
    }

    // 清理之前的定时器
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // 智能续打：如果是追加，从当前位置继续
    if (text.startsWith(displayText)) {
      typingIndexRef.current = displayText.length;
    } else {
      // 否则重新开始
      typingIndexRef.current = 0;
      setDisplayText('');
    }

    setIsTyping(true);

    // 开始打字
    typingIntervalRef.current = setInterval(() => {
      if (typingIndexRef.current >= text.length) {
        // 完成
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
        return;
      }

      // 每次显示一个字符
      typingIndexRef.current += 1;
      setDisplayText(text.substring(0, typingIndexRef.current));
    }, 50); // 50ms 每个字符
  }, [text]);

  // 自动滚动
  useEffect(() => {
    if (displayText && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [displayText]);

  // 清理
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const getStatusText = () => {
    if (isTranscribing) return '正在转录';
    if (isRecording) return '正在聆听';
    return '';
  };

  const statusText = getStatusText();
  const showLoading = isTyping || isTranscribing;

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
            {isRecording ? '等待语音输入' : '点击麦克风开始录音'}
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

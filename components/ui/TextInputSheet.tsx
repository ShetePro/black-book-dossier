import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutDown,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';

interface TextInputSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export const TextInputSheet: React.FC<TextInputSheetProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const colors = useThemeColor();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
      onClose();
    }
  }, [text, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setText('');
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="absolute inset-0 bg-black/50 z-40"
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleClose}
      />

      <Animated.View
        entering={FadeInUp.springify().damping(20)}
        exiting={FadeOutDown.springify().damping(20)}
        className="absolute bottom-0 left-0 right-0 z-50"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            className="bg-surface rounded-t-3xl px-4 pt-3 pb-8"
            style={{ borderTopWidth: 1, borderTopColor: colors.border }}
          >
            <View className="items-center mb-3">
              <View className="w-10 h-1 rounded-full bg-elite-muted/30" />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-elite">
                文本输入
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="p-2 rounded-full bg-elite-muted/10"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-elite-muted mb-3">
              输入活动描述，AI 将自动提取信息并匹配联系人
            </Text>

            <View
              className={`bg-background rounded-xl border ${
                isFocused ? 'border-primary' : 'border-elite-muted/20'
              }`}
              style={{ minHeight: 120 }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="例如：昨天下午和张三在奥体中心打篮球，聊得很开心"
                placeholderTextColor={colors.textMuted}
                className="text-elite p-4"
                style={{ minHeight: 120, textAlignVertical: 'top' }}
                multiline
                maxLength={500}
                autoFocus
              />
              <View className="absolute bottom-2 right-2">
                <Text className="text-xs text-elite-muted">
                  {text.length}/500
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap mt-3 mb-4">
              <Text className="text-xs text-elite-muted mr-2">快捷提示：</Text>
              {['打篮球', '喝咖啡', '开会'].map((hint) => (
                <TouchableOpacity
                  key={hint}
                  onPress={() => setText(prev => prev + hint)}
                  className="bg-elite-muted/10 rounded-full px-3 py-1 mr-2 mb-1"
                >
                  <Text className="text-xs text-elite">{hint}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!text.trim()}
              className={`rounded-xl py-4 flex-row items-center justify-center ${
                text.trim() ? 'bg-primary' : 'bg-elite-muted/20'
              }`}
            >
              <Ionicons
                name="send"
                size={20}
                color={text.trim() ? '#0a0a0a' : colors.textMuted}
              />
              <Text
                className={`ml-2 font-semibold ${
                  text.trim() ? 'text-void' : 'text-elite-muted'
                }`}
              >
                开始分析
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
};
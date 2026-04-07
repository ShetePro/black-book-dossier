import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { agentService, AgentQueryResponse } from '@/services/ai/agent';
import { useThemeColor } from '@/hooks/useThemeColor';

interface QueryMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  data?: unknown;
  sql?: string;
  timestamp: number;
}

const QUICK_QUERIES = [
  '有多少人和我打过篮球？',
  '哪些联系人超过3个月没联系了？',
  '活动统计',
  '谁和我最常一起吃饭？',
];

export default function AgentQueryScreen(): React.ReactElement {
  const router = useRouter();
  const colors = useThemeColor();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const question = inputText.trim();
    setInputText('');

    const userMessage: QueryMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response: AgentQueryResponse = await agentService.query({
        question,
        useLLM: false,
      });

      const agentMessage: QueryMessage = {
        id: `agent_${Date.now()}`,
        type: 'agent',
        content: response.answer,
        data: response.data,
        sql: response.sql,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage: QueryMessage = {
        id: `agent_${Date.now()}`,
        type: 'agent',
        content: '抱歉，查询时出现错误，请稍后重试。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  const handleQuickQuery = useCallback((query: string) => {
    setInputText(query);
  }, []);

  const renderMessage = ({ item }: { item: QueryMessage }) => {
    const isUser = item.type === 'user';

    return (
      <Animated.View
        entering={FadeInUp.duration(300)}
        className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-accent items-center justify-center mr-2">
            <Ionicons name="sparkles" size={16} color="#0a0a0a" />
          </View>
        )}

        <View
          className={`max-w-[80%] p-4 rounded-2xl ${
            isUser ? 'bg-accent' : 'bg-surface'
          }`}
        >
          <Text className={`text-base ${isUser ? 'text-void' : 'text-elite'}`}>
            {item.content}
          </Text>

          {item.sql && !isUser && (
            <View className="mt-2 pt-2 border-t border-elite-muted/20">
              <Text className="text-xs text-elite-muted font-mono">
                SQL: {item.sql.substring(0, 100)}...
              </Text>
            </View>
          )}
        </View>

        {isUser && (
          <View className="w-8 h-8 rounded-full bg-elite-muted/30 items-center justify-center ml-2">
            <Ionicons name="person" size={16} color={colors.text} />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-void" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-elite-muted/10">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-elite">AI 助手</Text>
          <View className="w-10" />
        </View>

        {messages.length === 0 ? (
          <ScrollView className="flex-1 px-4">
            <Animated.View entering={FadeIn.duration(500)} className="py-8">
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
                  <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
                <Text className="text-2xl font-bold text-elite mb-2">
                  有什么可以帮您？
                </Text>
                <Text className="text-sm text-elite-muted text-center px-8">
                  您可以询问关于联系人、活动记录的各种问题
                </Text>
              </View>

              <Text className="text-sm font-medium text-elite-muted mb-3">
                快捷查询
              </Text>
              <View className="flex-row flex-wrap">
                {QUICK_QUERIES.map((query, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQuickQuery(query)}
                    className="bg-surface border border-elite-muted/20 rounded-full px-4 py-2 mr-2 mb-2"
                  >
                    <Text className="text-sm text-elite">{query}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-8 p-4 bg-surface/50 rounded-xl">
                <Text className="text-sm font-medium text-elite mb-2">
                  您可以问：
                </Text>
                <View className="space-y-2">
                  <Text className="text-sm text-elite-muted">
                    • 有多少人和我打过篮球？
                  </Text>
                  <Text className="text-sm text-elite-muted">
                    • 哪些联系人超过3个月没联系了？
                  </Text>
                  <Text className="text-sm text-elite-muted">
                    • 我和张三最近的活动
                  </Text>
                  <Text className="text-sm text-elite-muted">
                    • 活动统计
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerClassName="px-4 py-4"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View className="px-4 py-3 border-t border-elite-muted/10">
          <View className="flex-row items-center bg-surface rounded-full px-4 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入您的问题..."
              placeholderTextColor={colors.textMuted}
              className="flex-1 text-elite text-base py-2"
              multiline
              maxLength={200}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim() && !isLoading ? 'bg-accent' : 'bg-elite-muted/20'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="send" size={18} color={inputText.trim() ? colors.background : colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

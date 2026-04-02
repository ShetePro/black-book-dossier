import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModelDownloadSheetProps {
  visible: boolean;
  title: string;
  message: string;
  size: string;
  progress?: number; // 0-1
  isDownloading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * iOS Liquid Glass 风格模型下载提示组件
 */
export const ModelDownloadSheet: React.FC<ModelDownloadSheetProps> = ({
  visible,
  title,
  message,
  size,
  progress = 0,
  isDownloading,
  onConfirm,
  onCancel,
}) => {
  const colors = useThemeColor();
  
  // 进度动画
  const progressWidth = useSharedValue(0);
  
  React.useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [progress]);
  
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // 玻璃态背景动画
  const backdropOpacity = useSharedValue(0);
  
  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);
  
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.backdrop,
          backdropAnimatedStyle,
        ]}
      >
        {/* 玻璃态背景层 */}
        <View style={styles.glassBackground} />
      </Animated.View>
      
      <View style={styles.centerContainer}>
        <Animated.View
          entering={FadeInUp.duration(300).springify()}
          style={[
            styles.container,
            { 
              backgroundColor: `${colors.surface}F5`, // 95% 透明度
              borderColor: `${colors.border}40`,
            }
          ]}
        >
          {/* 顶部装饰条 */}
          <View style={styles.handle} />
          
          {/* 图标 */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}20` }
          ]}>
            <Ionicons 
              name={isDownloading ? "cloud-download" : "cloud-outline"} 
              size={32} 
              color={colors.primary} 
            />
          </View>
          
          {/* 标题 */}
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          
          {/* 信息 */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
          
          {/* 大小标签 */}
          <View style={[
            styles.sizeTag,
            { backgroundColor: `${colors.primary}15` }
          ]}>
            <Ionicons name="folder-open" size={14} color={colors.primary} />
            <Text style={[styles.sizeText, { color: colors.primary }]}>
              {size}
            </Text>
          </View>
          
          {/* 下载进度 */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressBar,
                { backgroundColor: `${colors.border}60` }
              ]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary },
                    progressAnimatedStyle,
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {(progress * 100).toFixed(1)}%
              </Text>
            </View>
          )}
          
          {/* 按钮区域 */}
          {!isDownloading ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  { borderColor: `${colors.border}80` }
                ]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  稍后再说
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: '#0a0a0a' }]}>
                  立即下载
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.downloadingHint}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.downloadingText, { color: colors.textMuted }]}>
                正在下载，请保持应用在前台
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backdropFilter: 'blur(20px)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sizeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {
    // 主按钮使用实心背景
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  downloadingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  downloadingText: {
    fontSize: 13,
  },
});

export default ModelDownloadSheet;

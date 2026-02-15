import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 波形配置
const WAVE_POINTS = 40; // 波形点数
const WAVE_WIDTH = SCREEN_WIDTH * 0.85; // 波形总宽度
const WAVE_HEIGHT = 120; // 波形最大高度
const CENTER_GAP = 40; // 中心间隙
const UPDATE_INTERVAL = 30; // 更新频率 30ms

// 生成平滑的贝塞尔曲线路径
const generateWavePath = (points: number[]): string => {
  const width = WAVE_WIDTH;
  const height = WAVE_HEIGHT;
  const centerX = width / 2;
  const barWidth = (width - CENTER_GAP) / 2 / points.length;
  
  let path = "";
  
  // 左半边（从中心向左）
  for (let i = 0; i < points.length; i++) {
    const x = centerX - CENTER_GAP / 2 - (i + 1) * barWidth + barWidth / 2;
    const barHeight = points[i];
    const topY = height / 2 - barHeight / 2;
    const bottomY = height / 2 + barHeight / 2;
    
    if (i === 0) {
      path += `M ${x} ${topY} `;
    } else {
      const prevX = centerX - CENTER_GAP / 2 - i * barWidth + barWidth / 2;
      const prevHeight = points[i - 1];
      const controlX = (prevX + x) / 2;
      path += `Q ${controlX} ${topY} ${x} ${topY} `;
    }
  }
  
  // 左半边底部（返回中心）
  for (let i = points.length - 1; i >= 0; i--) {
    const x = centerX - CENTER_GAP / 2 - (i + 1) * barWidth + barWidth / 2;
    const barHeight = points[i];
    const bottomY = height / 2 + barHeight / 2;
    
    if (i === points.length - 1) {
      path += `L ${x} ${bottomY} `;
    } else {
      const nextX = centerX - CENTER_GAP / 2 - (i + 2) * barWidth + barWidth / 2;
      const controlX = (x + nextX) / 2;
      path += `Q ${controlX} ${bottomY} ${nextX} ${bottomY} `;
    }
  }
  
  // 中心连接
  path += `L ${centerX - CENTER_GAP / 2} ${height / 2} `;
  path += `L ${centerX + CENTER_GAP / 2} ${height / 2} `;
  
  // 右半边（从中心向右）
  for (let i = 0; i < points.length; i++) {
    const x = centerX + CENTER_GAP / 2 + (i + 1) * barWidth - barWidth / 2;
    const barHeight = points[i];
    const topY = height / 2 - barHeight / 2;
    
    if (i === 0) {
      path += `L ${x} ${topY} `;
    } else {
      const prevX = centerX + CENTER_GAP / 2 + i * barWidth - barWidth / 2;
      const controlX = (prevX + x) / 2;
      path += `Q ${controlX} ${topY} ${x} ${topY} `;
    }
  }
  
  // 右半边底部（返回中心）
  for (let i = points.length - 1; i >= 0; i--) {
    const x = centerX + CENTER_GAP / 2 + (i + 1) * barWidth - barWidth / 2;
    const barHeight = points[i];
    const bottomY = height / 2 + barHeight / 2;
    
    if (i === points.length - 1) {
      path += `L ${x} ${bottomY} `;
    } else {
      const nextX = centerX + CENTER_GAP / 2 + (i + 2) * barWidth - barWidth / 2;
      const controlX = (x + nextX) / 2;
      path += `Q ${controlX} ${bottomY} ${nextX} ${bottomY} `;
    }
  }
  
  path += "Z";
  return path;
};

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // 波形数据 - 左右对称
  const [waveData, setWaveData] = useState<number[]>(
    Array(WAVE_POINTS).fill(10)
  );
  
  // 波形整体缩放（呼吸效果）
  const [waveScale, setWaveScale] = useState(1);
  
  // 录音模式
  const [isHoldMode, setIsHoldMode] = useState(true);
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  
  // 引用
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelZoneLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // 动画值
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const waveAnimation = useSharedValue(0);
  const cancelOpacity = useSharedValue(0);

  // 将音频电平转换为波形高度，使用平滑曲线
  const meteringToWaveData = (metering: number): number[] => {
    const normalized = Math.max(0, (metering + 160) / 160);
    
    return Array.from({ length: WAVE_POINTS }, (_, i) => {
      // 中心点最高，向两边递减（高斯分布效果）
      const position = i / WAVE_POINTS;
      const centerFactor = Math.exp(-Math.pow((position - 0.5) * 3, 2));
      
      // 基础高度
      const baseHeight = 10 + normalized * 80 * centerFactor;
      
      // 添加轻微随机变化
      const variation = Math.sin(Date.now() / 100 + i * 0.3) * 5;
      
      return Math.max(5, Math.min(100, baseHeight + variation));
    });
  };

  // 请求麦克风权限
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("请求麦克风权限失败:", error);
      return false;
    }
  };

  // 开始音频录制
  const startAudioRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        50
      );

      recordingRef.current = recording;

      // 实时获取音频电平
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            const metering = status.metering ?? -160;
            const newWaveData = meteringToWaveData(metering);
            setWaveData(newWaveData);
            
            // 根据音量调整整体缩放
            const normalized = Math.max(0, (metering + 160) / 160);
            setWaveScale(0.9 + normalized * 0.2);
          }
        }
      }, UPDATE_INTERVAL);

      return true;
    } catch (error) {
      console.error("开始录音失败:", error);
      return false;
    }
  };

  // 停止音频录制
  const stopAudioRecording = async (): Promise<string | null> => {
    try {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        return uri;
      }
      return null;
    } catch (error) {
      console.error("停止录音失败:", error);
      return null;
    }
  };

  // 取消音频录制
  const cancelAudioRecording = async () => {
    try {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (error) {
      console.error("取消录音失败:", error);
    }
  };

  // 开始录音动画
  const startRecordingAnimation = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    waveAnimation.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  // 停止录音动画
  const stopRecordingAnimation = useCallback(() => {
    pulseScale.value = withTiming(1);
    waveAnimation.value = 0;
    cancelOpacity.value = withTiming(0);
    setWaveData(Array(WAVE_POINTS).fill(10));
    setWaveScale(1);
  }, []);

  // 开始录音
  const startRecording = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("需要麦克风权限才能录音");
      return;
    }

    const started = await startAudioRecording();
    if (started) {
      setIsRecording(true);
      startRecordingAnimation();
      setRecordingDuration(0);
      if (isHoldMode) {
        cancelOpacity.value = withTiming(1);
      }
    }
  }, [startRecordingAnimation, isHoldMode, cancelOpacity]);

  // 停止录音并保存
  const stopRecording = useCallback(async () => {
    const uri = await stopAudioRecording();
    setIsRecording(false);
    stopRecordingAnimation();
    
    if (uri) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        router.push("/(views)/contact/new");
      }, 2000);
    }
  }, [stopRecordingAnimation, router]);

  // 取消录音
  const cancelRecording = useCallback(async () => {
    await cancelAudioRecording();
    setIsRecording(false);
    setIsInCancelZone(false);
    stopRecordingAnimation();
    setRecordingDuration(0);
  }, [stopRecordingAnimation]);

  // 检查是否在取消区域
  const checkInCancelZone = useCallback((pageX: number, pageY: number) => {
    if (!cancelZoneLayout.current) return false;
    
    const { x, y, width, height } = cancelZoneLayout.current;
    return pageX >= x && pageX <= x + width && pageY >= y && pageY <= y + height;
  }, []);

  // 处理取消区域布局变化
  const onCancelZoneLayout = (event: any) => {
    const viewRef = event.target;
    if (viewRef) {
      viewRef.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        cancelZoneLayout.current = { x: px, y: py, width: w, height: h };
      });
    }
  };

  // PanResponder 用于按住模式
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => isHoldMode && !isRecording,
      onMoveShouldSetPanResponder: () => isHoldMode && isRecording,
      onPanResponderGrant: () => {
        if (isHoldMode && !isRecording) {
          startRecording();
          micScale.value = withSpring(0.9, { damping: 20 });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (isHoldMode && isRecording) {
          const inCancelZone = checkInCancelZone(gestureState.moveX, gestureState.moveY);
          setIsInCancelZone(inCancelZone);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isHoldMode && isRecording) {
          micScale.value = withSpring(1, { damping: 20 });
          
          const inCancelZone = checkInCancelZone(gestureState.moveX, gestureState.moveY);
          
          if (inCancelZone) {
            cancelRecording();
          } else {
            stopRecording();
          }
        }
      },
      onPanResponderTerminate: () => {
        if (isHoldMode && isRecording) {
          micScale.value = withSpring(1, { damping: 20 });
          cancelRecording();
        }
      },
    });
  }, [isHoldMode, isRecording, startRecording, stopRecording, cancelRecording, checkInCancelZone, micScale]);

  // 处理录音按钮按下（切换模式）
  const handleTogglePress = () => {
    if (!isHoldMode) {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // 切换模式下的取消按钮
  const handleToggleCancel = () => {
    if (!isHoldMode && isRecording) {
      cancelRecording();
    }
  };

  // 录音时长计时器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  // 生成SVG路径
  const wavePath = useMemo(() => generateWavePath(waveData), [waveData]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 0.3 + (pulseScale.value - 1) * 0.5,
  }));

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + waveAnimation.value * 0.5 }],
    opacity: 1 - waveAnimation.value,
  }));

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelOpacity.value,
    transform: [{ scale: isInCancelZone ? 1.2 : 1 }],
  }));

  const getHintText = () => {
    if (isRecording) {
      if (isHoldMode) {
        return isInCancelZone ? "松开取消" : "松手完成";
      }
      return "录音中...";
    }
    return isHoldMode ? "按住说话" : "点击录音";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {isAnalyzing 
            ? "AI分析中..." 
            : isRecording 
              ? "聆听中..." 
              : "记录情报"
          }
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* 模式切换按钮 */}
      {!isRecording && !isAnalyzing && (
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              isHoldMode && [styles.modeButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setIsHoldMode(true)}
          >
            <Ionicons 
              name="hand-left" 
              size={16} 
              color={isHoldMode ? "#0a0a0a" : colors.text} 
            />
            <Text style={[
              styles.modeText,
              isHoldMode && { color: "#0a0a0a", fontWeight: "600" }
            ]}>
              按住说话
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              !isHoldMode && [styles.modeButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setIsHoldMode(false)}
          >
            <Ionicons 
              name="toggle" 
              size={16} 
              color={!isHoldMode ? "#0a0a0a" : colors.text} 
            />
            <Text style={[
              styles.modeText,
              !isHoldMode && { color: "#0a0a0a", fontWeight: "600" }
            ]}>
              点击切换
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 录音状态显示 */}
      <View style={styles.content}>
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
              AI正在分析...
            </Text>
          </View>
        ) : (
          <>
            {/* 波形可视化 */}
            <View style={[styles.waveContainer, { transform: [{ scale: waveScale }] }]}>
              <Svg width={WAVE_WIDTH} height={WAVE_HEIGHT} viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}>
                <Defs>
                  {/* 金色渐变 */}
                  <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={isRecording ? "#d4b978" : colors.primary} stopOpacity="0.9" />
                    <Stop offset="50%" stopColor={isRecording ? "#c9a962" : colors.primary} stopOpacity="0.6" />
                    <Stop offset="100%" stopColor={isRecording ? "#a88b4a" : colors.primary} stopOpacity="0.3" />
                  </LinearGradient>
                  
                  {/* 发光滤镜 */}
                  <Defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </Defs>
                </Defs>
                
                <Path
                  d={wavePath}
                  fill="url(#goldGradient)"
                  stroke={isRecording ? colors.primary : `${colors.primary}50`}
                  strokeWidth={2}
                  opacity={isRecording ? 1 : 0.3}
                />
              </Svg>
              
              {/* 装饰性中心圆点 */}
              {isRecording && (
                <View style={[styles.centerDot, { backgroundColor: colors.primary }]} />
              )}
            </View>

            {/* 录音提示文字 */}
            <Text style={[styles.hint, { 
              color: isInCancelZone ? colors.danger : colors.textMuted 
            }]}>
              {getHintText()}
            </Text>

            {/* 录音时长 */}
            {isRecording && (
              <Text style={[styles.duration, { color: colors.primary }]}>
                {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:
                {(recordingDuration % 60).toString().padStart(2, "0")}
              </Text>
            )}
          </>
        )}
      </View>

      {/* 底部区域 */}
      {!isAnalyzing && (
        <View style={styles.bottomContainer}>
          {/* 取消区域 - 仅在按住模式录音时显示 */}
          {isHoldMode && isRecording && (
            <Animated.View 
              onLayout={onCancelZoneLayout}
              style={[
                styles.cancelZone,
                { 
                  backgroundColor: isInCancelZone 
                    ? `${colors.danger}40` 
                    : `${colors.danger}20`,
                  borderColor: isInCancelZone ? colors.danger : `${colors.danger}50`,
                },
                cancelStyle,
              ]}
            >
              <Ionicons 
                name="close-circle" 
                size={32} 
                color={isInCancelZone ? colors.danger : `${colors.danger}80`} 
              />
              <Text style={[styles.cancelText, { 
                color: isInCancelZone ? colors.danger : `${colors.danger}80` 
              }]}>
                拖动到此处取消
              </Text>
            </Animated.View>
          )}

          {/* 切换模式下的取消按钮 */}
          {!isHoldMode && isRecording && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.danger }]}
              onPress={handleToggleCancel}
            >
              <Ionicons name="close" size={24} color={colors.danger} />
              <Text style={[styles.cancelButtonText, { color: colors.danger }]}>
                取消
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.micContainer}>
            {/* 脉冲光圈 */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { backgroundColor: isInCancelZone ? colors.danger : colors.primary },
                  pulseStyle,
                ]}
              />
            )}
            
            {/* 波纹效果 */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.waveRing,
                  { borderColor: isInCancelZone ? colors.danger : colors.primary },
                  waveStyle,
                ]}
              />
            )}
            
            {/* 录音按钮 */}
            <Animated.View style={micStyle}>
              <View
                {...(isHoldMode ? panResponder.panHandlers : {})}
                style={[
                  styles.micButton,
                  {
                    backgroundColor: isRecording 
                      ? (isInCancelZone ? colors.danger : colors.primary) 
                      : colors.primary,
                    shadowColor: isRecording 
                      ? (isInCancelZone ? colors.danger : colors.primary) 
                      : colors.primary,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleTogglePress}
                  disabled={isHoldMode}
                  activeOpacity={0.8}
                  style={styles.micButtonInner}
                >
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={36}
                    color="#0a0a0a"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 44,
  },
  modeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  modeButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modeText: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  analyzingContainer: {
    alignItems: "center",
    gap: 20,
  },
  analyzingText: {
    fontSize: 16,
    marginTop: 16,
  },
  waveContainer: {
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  centerDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#c9a962",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  hint: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  duration: {
    fontSize: 48,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
  },
  bottomContainer: {
    paddingBottom: 60,
    alignItems: "center",
    gap: 20,
  },
  cancelZone: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  cancelText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  micContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  waveRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  micButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: "center",
    justifyContent: "center",
  },
});

import type { ReactNode } from "react";
import { View, Text } from "react-native";

interface DefaultAvatarProps {
  nickname?: string;
  size?: number;
  className?: string;
}

/**
 * 默认头像组件
 * 根据用户昵称首字母生成渐变背景头像
 * 没有昵称时显示跑步图标
 */
export function DefaultAvatar({
  nickname,
  size = 80,
  className = "",
}: DefaultAvatarProps) {
  // 获取首字母
  const initial = nickname?.charAt(0)?.toUpperCase() || "🏃";

  // 根据首字母选择渐变颜色
  const getGradientColors = (char: string) => {
    const colors = [
      { from: "#6366F1", to: "#8B5CF6" }, // 靛紫
      { from: "#3B82F6", to: "#06B6D4" }, // 蓝青
      { from: "#10B981", to: "#14B8A6" }, // 绿青
      { from: "#F59E0B", to: "#EF4444" }, // 橙红
      { from: "#EC4899", to: "#8B5CF6" }, // 粉紫
      { from: "#14B8A6", to: "#3B82F6" }, // 青蓝
    ];

    // 根据字符的 charCode 选择颜色
    if (char === "🏃") return colors[0]; // 默认颜色
    const index = char.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const colors = getGradientColors(initial);

  // 字体大小根据容器大小调整
  const fontSize = size * 0.4;

  return (
    <View
      className={`items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.from,
      }}
    >
      {/* 渐变效果使用伪阴影 */}
      <View
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: colors.to,
          opacity: 0.5,
          transform: [{ scale: 0.8 }],
        }}
      />

      {/* 内圈高光 */}
      <View
        className="absolute top-1 left-1 right-1 rounded-full"
        style={{
          height: size * 0.4,
          backgroundColor: "rgba(255,255,255,0.2)",
        }}
      />

      {/* 首字母或图标 */}
      <Text
        style={{
          fontSize,
          fontWeight: "bold",
          color: "#fff",
          textShadowColor: "rgba(0,0,0,0.1)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

/**
 * 带阴影的头像容器
 */
export function AvatarContainer({
  children,
  size = 80,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {children}
    </View>
  );
}

export default DefaultAvatar;

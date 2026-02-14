import type { FC } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  SwitchProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Switch 颜色主题预设
 */
export type SwitchColorScheme =
  | "primary"    // 蓝色 #3B82F6
  | "success"    // 绿色 #10B981
  | "warning"    // 黄色 #F59E0B
  | "danger"     // 红色 #EF4444
  | "purple"     // 紫色 #A855F7
  | "custom";    // 自定义颜色

/**
 * 颜色配置
 */
const COLOR_SCHEMES: Record<Exclude<SwitchColorScheme, "custom">, string> = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#A855F7",
};

/**
 * SwitchItem 组件属性
 */
export interface SwitchItemProps {
  /** 标题 */
  title: string;

  /** 副标题/描述 */
  subtitle?: string;

  /** 当前开关值 - 支持双向绑定 */
  value: boolean;

  /** 值变化回调 */
  onValueChange: (value: boolean) => void;

  /** 图标名称 (Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;

  /** 颜色主题 */
  colorScheme?: SwitchColorScheme;

  /** 自定义颜色 (当 colorScheme 为 'custom' 时使用) */
  customColor?: string;

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否加载中 */
  loading?: boolean;

  /** 自定义样式类名 */
  className?: string;

  /** 是否显示分隔线（用于列表中） */
  showDivider?: boolean;

  /** 点击整个行触发切换 */
  toggleOnRowPress?: boolean;

  /** 额外的 Switch 属性 */
  switchProps?: Omit<SwitchProps, 'value' | 'onValueChange' | 'disabled'>;
}

export const SwitchItem: FC<SwitchItemProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  icon,
  colorScheme = "primary",
  customColor,
  disabled = false,
  loading = false,
  className = "",
  showDivider = false,
  toggleOnRowPress = false,
  switchProps,
}) => {
  // 获取主题色
  const themeColor = colorScheme === "custom"
    ? customColor || "#3B82F6"
    : COLOR_SCHEMES[colorScheme];

  // 处理值变化
  const handleValueChange = (newValue: boolean) => {
    if (!disabled && !loading) {
      onValueChange(newValue);
    }
  };

  // 处理行点击
  const handleRowPress = () => {
    if (toggleOnRowPress && !disabled && !loading) {
      onValueChange(!value);
    }
  };

  // 计算背景色透明度
  const bgColor = `${themeColor}20`; // 20 = 约 12% 透明度

  const Content = (
    <View
      className={`
        flex-row items-center justify-between p-4 bg-white dark:bg-slate-800
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {/* 左侧：图标 + 文字 */}
      <View className="flex-row items-center flex-1 mr-4">
        {icon && (
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: bgColor }}
          >
            <Ionicons name={icon} size={18} color={themeColor} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base text-slate-700 dark:text-slate-200 font-medium">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* 右侧：加载指示器或 Switch */}
      {loading ? (
        <ActivityIndicator size="small" color={themeColor} />
      ) : (
        <Switch
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
          trackColor={{
            false: "#767577",
            true: themeColor
          }}
          thumbColor={value ? "#fff" : "#f4f3f4"}
          ios_backgroundColor="#767577"
          // 确保动画效果一致
          style={{
            transform: [{ scale: 1 }], // 防止缩放导致的渲染问题
          }}
          {...switchProps}
        />
      )}
    </View>
  );

  // 如果需要点击整行切换，包装在 TouchableOpacity 中
  if (toggleOnRowPress) {
    return (
      <TouchableOpacity
        onPress={handleRowPress}
        activeOpacity={0.7}
        disabled={disabled || loading}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

/**
 * 简洁版 SwitchItem（仅 Switch，无图标）
 */
export const SimpleSwitch: FC<Omit<SwitchItemProps, 'icon' | 'subtitle'>> = (
  props
) => <SwitchItem {...props} />;

export default SwitchItem;

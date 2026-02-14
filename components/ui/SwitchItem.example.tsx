/**
 * SwitchItem 组件使用示例
 * 
 * 这个文件展示了 SwitchItem 组件的各种使用方式
 * 实际项目中不需要引入此文件
 */

import React, { useState } from "react";
import { View, ScrollView, Text } from "react-native";
import { SwitchItem } from "./SwitchItem";
import { Divider } from "./Divider";

// ============================================
// 示例 1: 基础用法（双向绑定）
// ============================================
function BasicExample() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchItem
      title="启用功能"
      value={enabled}
      onValueChange={setEnabled}
    />
  );
}

// ============================================
// 示例 2: 带图标和副标题
// ============================================
function WithIconAndSubtitle() {
  const [autoSync, setAutoSync] = useState(true);

  return (
    <SwitchItem
      icon="sync-outline"
      title="自动同步"
      subtitle="跑步结束后自动备份到云端"
      value={autoSync}
      onValueChange={setAutoSync}
      colorScheme="success"
    />
  );
}

// ============================================
// 示例 3: 不同颜色主题
// ============================================
function ColorSchemes() {
  const [values, setValues] = useState({
    primary: true,
    success: true,
    warning: false,
    danger: true,
    purple: false,
  });

  return (
    <View>
      <SwitchItem
        icon="notifications"
        title="Primary 主题"
        value={values.primary}
        onValueChange={(v) => setValues({ ...values, primary: v })}
        colorScheme="primary"
      />
      <Divider />
      <SwitchItem
        icon="checkmark-circle"
        title="Success 主题"
        value={values.success}
        onValueChange={(v) => setValues({ ...values, success: v })}
        colorScheme="success"
      />
      <Divider />
      <SwitchItem
        icon="warning"
        title="Warning 主题"
        value={values.warning}
        onValueChange={(v) => setValues({ ...values, warning: v })}
        colorScheme="warning"
      />
      <Divider />
      <SwitchItem
        icon="alert-circle"
        title="Danger 主题"
        value={values.danger}
        onValueChange={(v) => setValues({ ...values, danger: v })}
        colorScheme="danger"
      />
      <Divider />
      <SwitchItem
        icon="moon"
        title="Purple 主题"
        value={values.purple}
        onValueChange={(v) => setValues({ ...values, purple: v })}
        colorScheme="purple"
      />
    </View>
  );
}

// ============================================
// 示例 4: 自定义颜色
// ============================================
function CustomColor() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchItem
      icon="color-palette"
      title="自定义颜色"
      subtitle="使用自定义主题色"
      value={enabled}
      onValueChange={setEnabled}
      colorScheme="custom"
      customColor="#FF6B6B"
    />
  );
}

// ============================================
// 示例 5: 禁用状态
// ============================================
function DisabledState() {
  const [enabled, setEnabled] = useState(true);

  return (
    <View>
      <SwitchItem
        icon="wifi"
        title="WiFi 同步"
        subtitle="此选项已禁用"
        value={enabled}
        onValueChange={setEnabled}
        disabled
      />
      <Divider />
      <SwitchItem
        icon="airplane"
        title="飞行模式"
        value={false}
        onValueChange={() => {}}
        disabled
        colorScheme="danger"
      />
    </View>
  );
}

// ============================================
// 示例 6: 加载状态
// ============================================
function LoadingState() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchItem
      icon="cloud-upload"
      title="正在同步"
      subtitle="请稍候..."
      value={enabled}
      onValueChange={setEnabled}
      loading={loading}
      colorScheme="primary"
    />
  );
}

// ============================================
// 示例 7: 整行可点击
// ============================================
function ToggleOnRowPress() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchItem
      icon="finger-print"
      title="点击整行切换"
      subtitle="点击这一行的任意位置都可以切换开关"
      value={enabled}
      onValueChange={setEnabled}
      toggleOnRowPress
      colorScheme="success"
    />
  );
}

// ============================================
// 示例 8: 与 Zustand Store 结合使用
// ============================================
// import { useSettingsStore } from "@/store/settingsStore";

function WithZustandStore() {
  // const { settings, updateSetting } = useSettingsStore();

  return (
    <SwitchItem
      icon="notifications"
      title="启用通知"
      subtitle="接收应用推送通知"
      // value={settings.notifications.enabled}
      // onValueChange={(value) => updateSetting("notifications.enabled", value)}
      value={true}
      onValueChange={() => {}}
      colorScheme="primary"
    />
  );
}

// ============================================
// 示例 9: 完整的设置页面
// ============================================
export function CompleteExample() {
  const [settings, setSettings] = useState({
    autoSync: true,
    wifiOnly: false,
    notifications: true,
    darkMode: false,
    analytics: true,
  });

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Text className="text-slate-500 text-xs font-bold uppercase m-4 mb-2">
        同步设置
      </Text>
      <View className="mx-4 bg-white rounded-xl overflow-hidden">
        <SwitchItem
          icon="sync-outline"
          title="自动同步"
          subtitle="应用启动时自动同步数据"
          value={settings.autoSync}
          onValueChange={(v) => updateSetting("autoSync", v)}
          colorScheme="success"
        />
        <Divider />
        <SwitchItem
          icon="wifi"
          title="仅 WiFi 同步"
          subtitle="节省移动数据流量"
          value={settings.wifiOnly}
          onValueChange={(v) => updateSetting("wifiOnly", v)}
          colorScheme="primary"
        />
      </View>

      <Text className="text-slate-500 text-xs font-bold uppercase m-4 mb-2">
        应用设置
      </Text>
      <View className="mx-4 bg-white rounded-xl overflow-hidden">
        <SwitchItem
          icon="notifications"
          title="推送通知"
          value={settings.notifications}
          onValueChange={(v) => updateSetting("notifications", v)}
          colorScheme="warning"
        />
        <Divider />
        <SwitchItem
          icon="moon"
          title="深色模式"
          value={settings.darkMode}
          onValueChange={(v) => updateSetting("darkMode", v)}
          colorScheme="purple"
        />
        <Divider />
        <SwitchItem
          icon="analytics"
          title="使用统计"
          subtitle="帮助改进应用体验"
          value={settings.analytics}
          onValueChange={(v) => updateSetting("analytics", v)}
          colorScheme="primary"
        />
      </View>
    </ScrollView>
  );
}

export default {
  BasicExample,
  WithIconAndSubtitle,
  ColorSchemes,
  CustomColor,
  DisabledState,
  LoadingState,
  ToggleOnRowPress,
  WithZustandStore,
  CompleteExample,
};

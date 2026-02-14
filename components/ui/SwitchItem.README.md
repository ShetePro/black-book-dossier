# SwitchItem 组件

统一的开关列表项组件，用于替代项目中分散使用的 React Native Switch。

## 特性

- ✅ 统一的外观和交互
- ✅ 支持图标、标题、副标题
- ✅ 多种颜色主题
- ✅ 支持双向绑定
- ✅ 支持加载状态
- ✅ 支持禁用状态
- ✅ 支持整行点击切换
- ✅ 支持深色模式

## 安装

无需安装，组件已位于 `components/ui/SwitchItem.tsx`

## 基础用法

### 1. 最简单的用法（双向绑定）

```tsx
import { useState } from "react";
import { SwitchItem } from "@/components/ui/SwitchItem";

function MyComponent() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchItem
      title="启用功能"
      value={enabled}
      onValueChange={setEnabled}
    />
  );
}
```

### 2. 带图标和副标题

```tsx
<SwitchItem
  icon="sync-outline"
  title="自动同步"
  subtitle="跑步结束后自动备份"
  value={autoSync}
  onValueChange={setAutoSync}
  colorScheme="success"
/>
```

### 3. 与 Zustand Store 结合

```tsx
import { useSettingsStore } from "@/store/settingsStore";

function SettingsComponent() {
  const { settings, updateSetting } = useSettingsStore();

  return (
    <SwitchItem
      icon="notifications"
      title="启用通知"
      subtitle="接收应用推送通知"
      value={settings.notifications.enabled}
      onValueChange={(value) => updateSetting("notifications.enabled", value)}
      colorScheme="primary"
    />
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | 必填 | 标题 |
| `subtitle` | `string` | - | 副标题/描述 |
| `value` | `boolean` | 必填 | 当前值 |
| `onValueChange` | `(value: boolean) => void` | 必填 | 值变化回调 |
| `icon` | `Ionicons name` | - | 图标名称 |
| `colorScheme` | `"primary" \| "success" \| "warning" \| "danger" \| "purple" \| "custom"` | `"primary"` | 颜色主题 |
| `customColor` | `string` | - | 自定义颜色（当 colorScheme="custom" 时使用） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否加载中 |
| `toggleOnRowPress` | `boolean` | `false` | 是否点击整行触发切换 |
| `switchProps` | `SwitchProps` | - | 额外的 Switch 属性 |

## 颜色主题

| 主题 | 颜色值 | 用途建议 |
|------|--------|----------|
| `primary` | `#3B82F6` (蓝色) | 主要功能、通用设置 |
| `success` | `#10B981` (绿色) | 启用、开启、成功状态 |
| `warning` | `#F59E0B` (黄色) | 警告、提醒 |
| `danger` | `#EF4444` (红色) | 危险操作、删除 |
| `purple` | `#A855F7` (紫色) | 深色模式、特殊功能 |
| `custom` | 自定义 | 使用 customColor 指定 |

## 高级用法

### 加载状态

```tsx
<SwitchItem
  title="正在同步"
  value={syncEnabled}
  onValueChange={setSyncEnabled}
  loading={isSyncing}
  colorScheme="primary"
/>
```

### 禁用状态

```tsx
<SwitchItem
  title="WiFi 同步"
  subtitle="需要 WiFi 连接"
  value={wifiSync}
  onValueChange={setWifiSync}
  disabled={!isWifiConnected}
/>
```

### 整行点击切换

```tsx
<SwitchItem
  title="点击整行切换"
  subtitle="点击任意位置都可以切换"
  value={enabled}
  onValueChange={setEnabled}
  toggleOnRowPress
/>
```

### 自定义颜色

```tsx
<SwitchItem
  icon="heart"
  title="喜欢"
  value={liked}
  onValueChange={setLiked}
  colorScheme="custom"
  customColor="#FF6B6B"
/>
```

## 项目中的使用位置

以下页面已更新为使用 SwitchItem 组件：

1. **云端同步页面** (`app/(views)/cloud-sync.tsx`)
   - 自动同步开关
   - 仅 WiFi 同步开关

2. **通知设置页面** (`app/(views)/notifications.tsx`)
   - 主通知开关
   - 跑步完成通知
   - 周报通知
   - 运动提醒

3. **用户页面** (`app/(tabs)/user.tsx`)
   - 深色模式开关

## 迁移指南

### 从旧代码迁移

**旧代码：**
```tsx
<View className="flex-row items-center justify-between p-4">
  <View className="flex-row items-center">
    <View className="w-8 h-8 rounded-lg bg-blue-100 mr-3">
      <Ionicons name="wifi" size={18} color="#3B82F6" />
    </View>
    <Text>WiFi 同步</Text>
  </View>
  <Switch
    value={wifiOnly}
    onValueChange={setWifiOnly}
    trackColor={{ false: "#767577", true: "#3B82F6" }}
    thumbColor={wifiOnly ? "#fff" : "#f4f3f4"}
  />
</View>
```

**新代码：**
```tsx
<SwitchItem
  icon="wifi"
  title="WiFi 同步"
  value={wifiOnly}
  onValueChange={setWifiOnly}
  colorScheme="primary"
/>
```

## 注意事项

1. **必须使用受控组件模式**：`value` 和 `onValueChange` 都是必需的
2. **颜色主题**：选择合适的颜色主题以保持界面一致性
3. **图标**：图标是可选的，但建议为重要的开关添加图标以提高可识别性
4. **副标题**：当开关功能需要额外说明时，使用 `subtitle` 属性

## 相关文件

- `components/ui/SwitchItem.tsx` - 组件源码
- `components/ui/SwitchItem.example.tsx` - 使用示例
- `components/ui/Divider.tsx` - 配合使用的分隔线组件

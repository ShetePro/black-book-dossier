# Black Book - Agent Instructions

## Project Overview

Black Book is a React Native Expo app - a Local-First, AI-powered networking intelligence system for high-net-worth individuals. Features voice-first recording, biometric security, and encrypted local SQLite storage.

## Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81 (New Architecture enabled)
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind 4.x (Tailwind CSS)
- **Database**: Expo SQLite
- **State**: Zustand
- **Animation**: React Native Reanimated 4.x
- **Icons**: @expo/vector-icons
- **Localization**: i18next

## Build Commands

```bash
# Development
npx expo start                    # Start Metro bundler
npx expo start --clear            # Clear Metro cache
npx expo run:ios                  # Build iOS (requires Xcode)
npx expo run:android              # Build Android
npx expo run:ios --clear          # Clean iOS build

# Testing
npm test                          # Run tests (watch mode)
npx jest --testPathPattern="Button" --no-coverage   # Single test file
npx jest --testNamePattern="should render"          # Tests by pattern
npx jest --coverage               # Run with coverage

# Linting & Types
npm run lint                      # Run ESLint
npx eslint . --fix                # Auto-fix ESLint
npx tsc --noEmit                  # Type check only

# Native
npx expo prebuild --clean         # Regenerate native directories
cd ios && pod install             # Install iOS pods
npx expo install --fix            # Fix dependency versions
```

## Code Style Guidelines

### TypeScript

- **Strict mode**: No `any` types
- **Path aliases**: Use `@/` prefix (e.g., `@/components/Button`)
- **Interfaces over types**: Prefer `interface` for object shapes
- **Explicit return types**: Always declare function return types
- **Destructured imports**: Use `import { useState } from 'react'` not `React.useState`

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `VoiceRecorder.tsx` |
| Hooks | camelCase with `use` | `useVoiceRecording.ts` |
| Utils | camelCase | `formatters.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| Tests | Co-located `.test.ts` | `Button.test.tsx` |

### Imports Order

```typescript
// 1. React/React Native
import { useState } from 'react';
import { View } from 'react-native';

// 2. Expo modules
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';

// 3. Third-party libraries
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// 4. Absolute imports (@/*)
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';

// 5. Relative imports
import { styles } from './styles';
```

### Component Structure

```typescript
interface Props {
  contactId: string;
  onPress?: (id: string) => void;
}

export const ContactCard: React.FC<Props> = ({ contactId, onPress }) => {
  // hooks first
  const router = useRouter();
  const { contact } = useContact(contactId);
  
  // callbacks
  const handlePress = () => onPress?.(contactId);
  
  // early returns
  if (!contact) return null;
  
  return <Pressable onPress={handlePress}>{/* JSX */}</Pressable>;
};
```

### Styling (NativeWind)

Use Tailwind utility classes with custom colors from `constants/Colors.ts`:
- Backgrounds: `bg-void`, `bg-surface`
- Text: `text-elite`, `text-elite-muted`, `text-primary`
- Actions: `text-accent`, `text-danger`
- Components use `className` prop (e.g., `<View className="flex-1 bg-void">`)

### Error Handling

```typescript
// Always try-catch async operations
try {
  await createContact(db, contact);
} catch (error) {
  console.error('Failed to create contact:', error);
  throw error; // Re-throw if caller needs to handle
}
```

### Localization

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

t('contacts.title');
t('contacts.count', { count: 5 });
```

## Git Workflow

1. **Atomic commits**: One logical change per commit
2. **Commit format**: `<type>(<scope>): <description>`
   - Types: `feat`, `fix`, `refactor`, `chore`, `docs`
   - Example: `feat(contacts): add swipe to delete`
3. **Chinese descriptions**: 使用中文描述 commit
4. **No secrets**: Never commit API keys or .env files

## Architecture Patterns

- **Local-First**: SQLite only, no cloud dependencies
- **Zero-Knowledge**: Encrypted storage + biometric auth
- **Voice-First**: Voice recording as main interface
- **Privacy**: All data stays on device

## Important Notes

- Always test on real device for audio/biometric features
- New Architecture enabled (`newArchEnabled: true`)
- iOS builds require Xcode and valid team ID
- Use `expo-dev-client` for development builds
- Clear Metro cache: `npx expo start --clear`
- FileSystem API: Use `expo-file-system` (new) or `expo-file-system/legacy` (deprecated methods)

## Current Development Tasks

### Phase 1: 联系人列表（通讯录风格）- 进行中

#### 功能需求
- [ ] 联系人列表 UI（FlatList + SectionList 分组按首字母）
- [ ] 字母索引栏（右侧 A-Z 快速跳转）
- [ ] 搜索栏（实时过滤姓名、公司）
- [ ] 标签/分组筛选
- [ ] 设置中的排序选项（姓名、优先级、最近联系）

#### 技术要点
- 使用 `useContactStore` 获取联系人数据
- 支持拼音排序（使用 `pinyin` 库）
- 空状态和加载状态处理

### Phase 2: 联系人档案管理 - 待开始

#### 功能需求
- [ ] 联系人详情页（CIA 风格档案卡片）
- [ ] 时间轴组件展示所有交往记录
- [ ] 情报分类展示（健康、偏好、禁忌、家庭、商业）
- [ ] 编辑功能（支持添加家庭成员）
- [ ] 标签管理页面

#### 技术要点
- 使用 `Interaction` 类型展示历史记录
- 时间轴按日期分组显示
- 可展开/折叠的情报卡片

### Phase 3: AI Agent 智能处理 - 待开始

#### 功能需求
- [ ] 相似度匹配算法（精确、拼音、模糊匹配）
- [ ] AI Agent 决策流程
- [ ] 确认弹窗（高置信度自动提示）
- [ ] 候选联系人列表（中置信度）
- [ ] 设置项：匹配阈值、自动合并选项

#### 技术要点
- 新服务：`services/ai/contactMatcher.ts`
- 匹配策略：精确匹配 > 拼音匹配 > 模糊匹配 > 上下文匹配
- 阈值设置：high(0.9) | medium(0.7) | low(0.5)
- 集成到录音流程：停止录音 → 实体提取 → 匹配联系人 → 确认/创建

### Phase 4: 语音录制集成 - 待开始

#### 功能需求
- [ ] 录音后自动触发 AI Agent
- [ ] 根据匹配结果显示确认弹窗或创建页面
- [ ] 支持快速创建新联系人

#### 数据模型

**已有模型（无需改动）：**
- `Contact` - 联系人基础信息
- `Interaction` - 交往记录
- `ActionItem` - 待办事项

**新增设置项：**
```typescript
interface AISettings {
  aiMatchingThreshold: number;        // 0.5 - 1.0
  aiAutoMergeHighConfidence: boolean; // 是否自动合并高置信度
  aiShowSimilarContacts: boolean;     // 是否显示相似建议
}
```

### 开发优先级
1. **P0**: 联系人列表（基础功能）
2. **P1**: 联系人档案详情页
3. **P2**: AI Agent 匹配算法
4. **P3**: 语音流程集成

### 交付时间估算
- 阶段 1：2-3 天
- 阶段 2：3-4 天
- 阶段 3：4-5 天
- 阶段 4：1-2 天
- **总计：约 10-14 天**

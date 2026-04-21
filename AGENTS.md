# Black Book - Agent Instructions

## Project Overview

Black Book is a React Native Expo app - a Local-First, AI-powered networking intelligence system for high-net-worth individuals. Features voice-first recording, biometric security, and encrypted local SQLite storage.

## Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81 (New Architecture enabled)
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router v6 (file-based)
- **Styling**: NativeWind 4.x (Tailwind CSS)
- **Database**: Expo SQLite 16.x
- **State**: Zustand 5.x
- **Animation**: React Native Reanimated 4.x
- **Security**: Expo LocalAuthentication + SecureStore
- **Icons**: @expo/vector-icons (Ionicons)
- **Localization**: i18next + react-i18next

## Project Structure

```
app/                    # Expo Router 文件路由
├── (tabs)/             # 主标签栏 (首页 / 联系人)
├── (views)/            # 功能视图 (contact/, action-item/, interaction/)
├── _layout.tsx         # 根布局

components/             # UI 组件库
├── contact/            # 联系人组件 (Card, List, EmptyState)
├── ui/                 # 基础组件 (Button, Input, Tag, Dialog)
├── analysis/           # AI 分析组件
├── __tests__/          # 组件测试

hooks/                  # 自定义 Hooks (useContacts, useInteractions)
store/                  # Zustand 状态管理 (contactStore, interactionStore)
db/                     # SQLite 操作封装 (operations.ts, migrations/)
services/               # 业务服务层 (ai/, export/)
types/                  # TypeScript 类型定义 (Contact, Interaction, ActionItem)
constants/              # 主题配色 (Colors.ts)
memory-bank/            # Memory Bank 知识库
```

## Build Commands

```bash
# Development
npx expo start                    # Start Metro bundler
npx expo start --clear            # Clear Metro cache
npx expo run:ios                  # Build iOS (requires Xcode)
npx expo run:android              # Build Android

# Testing (jest-expo preset)
npm test                          # Run tests (watch mode)
npx jest --testPathPattern="Button" --no-coverage   # Single test file
npx jest --testNamePattern="should render"          # Tests by pattern
npx jest --coverage               # Run with coverage
npx jest --silent --no-coverage   # CI mode (no watch)

# Linting & Types
npm run lint                      # Run ESLint (expo-config)
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

### Navigation (Expo Router)

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';

const router = useRouter();
router.push('/contact/new');           // 新建联系人
router.push(`/contact/${contactId}`);  // 跳转详情页
router.back();                         // 返回上一页

const { id } = useLocalSearchParams(); // 获取路由参数
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';

export interface ContactState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  loadContacts: () => Promise<void>;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,
  loadContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const database = await db.getDatabase();
      const contacts = await db.getAllContacts(database);
      set({ contacts, isLoading: false });
    } catch (error) {
      set({ error: '加载联系人失败', isLoading: false });
    }
  },
}));
```

### Database Operations

```typescript
import * as db from '@/db/operations';

const database = await db.getDatabase();
const contacts = await db.getAllContacts(database);
await db.createContact(database, contact);
await db.updateContact(database, contact);
await db.deleteContact(database, id);
```

### Error Handling

```typescript
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
2. **Commit format**: `<type>(<scope>): <中文描述>`
   - Types: `feat`, `fix`, `refactor`, `chore`, `docs`
   - Example: `feat(contacts): 新增联系人卡片组件`
3. **No secrets**: Never commit API keys or .env files

## Architecture Patterns

- **Local-First**: SQLite only, no cloud dependencies
- **Zero-Knowledge**: Encrypted storage + biometric auth
- **Voice-First**: Voice recording as main interface
- **Privacy**: All data stays on device
- **Repository Pattern**: 数据库操作封装在 `db/operations.ts`
- **Service Layer**: 业务逻辑封装在 `services/` 目录

## Memory Bank Protocol

项目的"长期记忆"存储在 `memory-bank/` 文件夹：

- **Session Start**: 必须优先读取 `activeContext.md` 和 `progress.md`
- **Context Overflow**: 当 Token 紧张时，调用 `/update-memory` 存档
- **关键文件**: `systemPatterns.md` (系统模式), `techContext.md` (技术上下文)

## Important Notes

- Always test on real device for audio/biometric features
- New Architecture enabled (`newArchEnabled: true`)
- iOS builds require Xcode and valid team ID
- Use `expo-dev-client` for development builds
- Clear Metro cache: `npx expo start --clear`
- FileSystem API: Use `expo-file-system` (new) or `expo-file-system/legacy` (deprecated)
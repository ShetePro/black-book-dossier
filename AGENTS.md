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

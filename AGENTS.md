# Black Book - Agent Instructions

## Project Overview

Black Book is a React Native Expo app - a Local-First, AI-powered minimal networking intelligence system for high-net-worth individuals. Features voice-first recording, biometric security, and encrypted local SQLite storage.

## Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81
- **Language**: TypeScript (strict mode enabled)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **Database**: Expo SQLite
- **State**: Zustand
- **Animation**: React Native Reanimated 4.x
- **Icons**: @expo/vector-icons
- **Localization**: i18next + react-i18next

## Build Commands

```bash
# Development
npx expo start                    # Start Metro bundler
npx expo run:ios                  # Build and run iOS (requires Xcode)
npx expo run:android              # Build and run Android
npx expo run:ios --clear          # Clean build iOS
npx expo run:android --clear      # Clean build Android

# Testing
npm test                          # Run all tests with watch mode
npx jest                          # Run tests once
npx jest --testPathPattern="Component"  # Run single test file
npx jest --testNamePattern="should"     # Run tests matching pattern
npx jest --watch --testPathPattern="db" # Watch mode single file

# Linting
npm run lint                      # Run ESLint
npx eslint . --fix                # Run ESLint with auto-fix
npx tsc --noEmit                  # Type check only

# Native (iOS)
cd ios && pod install             # Install iOS pods
npx expo prebuild --clean         # Regenerate native directories

# Clean Everything
rm -rf node_modules pnpm-lock.yaml ios android .expo .metro
pnpm install
```

## Code Style Guidelines

### TypeScript

- **Strict mode**: Always enabled - no `any` types
- **Path aliases**: Use `@/` prefix for imports (e.g., `@/components/Button`)
- **Interfaces over types**: Prefer `interface` for object shapes
- **Explicit return types**: Always declare function return types
- **No implicit returns**: All code paths must return a value

### File Naming

- Components: PascalCase (e.g., `VoiceRecorder.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useVoiceRecording.ts`)
- Utils: camelCase (e.g., `formatters.ts`)
- Constants: UPPER_SNAKE_CASE or PascalCase
- Tests: Same name as file + `.test.ts` (co-located or in `__tests__/`)

### Imports Order

```typescript
// 1. React/React Native
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Expo modules
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';

// 3. Third-party libraries
import { create } from 'zustand';
import { Ionicons } from '@expo/vector-icons';

// 4. Absolute imports (@/*)
import { useAuthStore } from '@/store';
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
  const handlePress = () => {
    onPress?.(contactId);
  };
  
  // early returns
  if (!contact) return null;
  
  return (
    <Pressable onPress={handlePress}>
      {/* JSX */}
    </Pressable>
  );
};
```

### Styling (NativeWind)

- Use Tailwind utility classes: `className="bg-void text-elite p-4"`
- Custom colors defined in `tailwind.config.js`:
  - `void`, `void-light`, `void-lighter` - backgrounds
  - `elite`, `elite-muted`, `elite-dim` - text
  - `accent`, `accent-light` - primary actions
  - `danger`, `danger-light` - warnings/errors
- Custom classes in `styles/global.css`: `card-void`, `btn-primary`, `input-dark`

### Error Handling

```typescript
// Always use try-catch for async operations
try {
  await createContact(db, contact);
} catch (error) {
  console.error('Failed to create contact:', error);
  // Re-throw if component needs to handle it
  throw error;
}

// Use Result type pattern for operations
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Database Operations

- Always use parameterized queries
- Use transactions for multiple operations
- Handle JSON serialization for arrays/objects
- Close database connections appropriately

### Localization

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Use namespaces
t('contacts.title');
t('recording.holdToRecord');

// With interpolation
t('contacts.count', { count: 5 });
```

## Git Workflow

1. **Atomic commits**: One logical change per commit
2. **Commit format**: `<type>(<scope>): <description>`
   - Types: `feat`, `fix`, `ui`, `refactor`, `chore`
   - Example: `feat(contacts): add swipe to delete`
3. **Chinese descriptions**: 使用中文描述 commit
4. **No secrets**: Never commit API keys, certs, or .env files

## Common Tasks

### Adding a new screen
1. Create file in `app/(tabs)/` or `app/(auth)/`
2. Follow Expo Router naming conventions
3. Add to `_layout.tsx` if needed
4. Use `SafeAreaView` and dark theme colors

### Adding a database table
1. Update `db/operations.ts` with schema
2. Run migration in `initDatabase()`
3. Add TypeScript types to `types/index.ts`
4. Create CRUD operations

### Running a single test
```bash
npx jest --testPathPattern="entityExtractor" --no-coverage
```

## Architecture Patterns

- **Local-First**: No cloud dependencies, SQLite only
- **Zero-Knowledge**: Encrypted storage, biometric auth
- **Voice-First**: Main interface is voice recording
- **Privacy**: All data stays on device

## Important Notes

- Always test on real device for audio/biometric features
- New Architecture is enabled (`newArchEnabled: true`)
- iOS builds require Xcode and valid team ID
- Use `expo-dev-client` for development builds
- Metro cache issues: `npx expo start --clear`

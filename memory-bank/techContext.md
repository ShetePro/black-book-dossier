# Tech Context

## Development Setup

### Prerequisites
- Node.js (LTS version)
- iOS: Xcode (for iOS builds)
- Android: Android Studio + SDK

### Installation
```bash
# 安装依赖
npm install

# iOS 额外步骤
cd ios && pod install
```

### Development Commands
```bash
# 启动开发服务器
npx expo start

# 带清除缓存启动
npx expo start --clear

# 平台特定构建
npx expo run:ios
npx expo run:android

# 代码质量
npm run lint          # ESLint 检查
npx tsc --noEmit      # TypeScript 类型检查

# 测试
npm test              # Jest 测试（watch 模式）
```

### Native Development
```bash
# 重新生成原生目录
npx expo prebuild --clean

# 修复依赖版本
npx expo install --fix
```

## Dependencies

### Core Framework
- **expo**: ~54.0.12 - Expo SDK
- **react-native**: 0.81.4 - React Native (New Architecture enabled)
- **react**: 19.1.0 - React
- **typescript**: ~5.9.2 - TypeScript

### Navigation & Router
- **expo-router**: ~6.0.10 - 文件系统路由
- **@react-navigation/native**: ^7.1.28 - React Navigation
- **@react-navigation/bottom-tabs**: ^7.13.0 - 底部标签导航

### State & Storage
- **zustand**: ^5.0.9 - 轻量级状态管理
- **expo-sqlite**: ~16.0.8 - SQLite 数据库
- **@react-native-async-storage/async-storage**: 2.2.0 - 异步存储
- **expo-secure-store**: ~14.0.0 - 安全存储

### Security & Authentication
- **expo-local-authentication**: ~15.0.0 - 生物识别认证

### Audio & Voice
- **expo-av**: ~14.0.7 - 音频/视频播放录制
- **whisper.rn**: ^0.5.4 - 语音识别

### UI & Styling
- **nativewind**: 4.2 - Tailwind CSS for React Native
- **tailwindcss**: ^3.4.15 - Tailwind CSS
- **@gorhom/bottom-sheet**: ^5.2.8 - 底部弹窗
- **expo-linear-gradient**: ^15.0.8 - 渐变效果
- **expo-blur**: ~15.0.8 - 模糊效果
- **expo-haptics**: ~15.0.7 - 触感反馈

### Animation
- **react-native-reanimated**: ~4.1.1 - 高性能动画
- **react-native-gesture-handler**: ~2.28.0 - 手势处理

### Utilities
- **dayjs**: ^1.11.19 - 日期处理
- **uuid**: ^11.0.0 - UUID 生成
- **react-hook-form**: ^7.71.1 - 表单管理
- **i18next**: ^24.0.2 - 国际化
- **react-i18next**: ^15.1.2 - React i18next

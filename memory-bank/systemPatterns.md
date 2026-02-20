# System Patterns

## Architecture
**Local-First Mobile Architecture (本地优先移动架构)**
- 完全离线的本地 SQLite 数据库，无云端依赖
- 文件系统路由 (File-based Routing) 的 Expo Router
- 分层状态管理：Zustand 全局状态 + React 本地状态
- 服务层分离：AI、安全、语音等业务逻辑独立封装

## Tech Stack
| 层级 | 技术 |
|------|------|
| **语言** | TypeScript (Strict Mode) |
| **框架** | Expo SDK 54 + React Native 0.81 (New Architecture) |
| **路由** | Expo Router v6 (文件系统路由) |
| **状态管理** | Zustand 5.x |
| **数据库** | Expo SQLite 16.x (本地加密存储) |
| **样式** | NativeWind 4.x (Tailwind CSS) |
| **动画** | React Native Reanimated 4.x |
| **安全** | Expo LocalAuthentication + SecureStore |
| **音频** | Expo AV + whisper.rn |
| **图标** | @expo/vector-icons |
| **国际化** | i18next + react-i18next |

## Design Patterns
- **Local-First Data Pattern**: 所有数据本地存储，零网络依赖
- **Repository Pattern**: 数据库操作封装在 `db/` 目录
- **Service Layer Pattern**: 业务逻辑封装在 `services/` 目录 (ai/, security/, voice/)
- **Component Composition**: UI 组件细粒度拆分，支持复用
- **Hook Pattern**: 自定义 Hooks 封装业务逻辑
- **File-Based Routing**: 路由由文件结构自动生成

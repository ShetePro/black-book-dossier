# Black Book

> 一个 Local-First、基于 AI 的极简人脉情报系统，专为那些**"关系比钱更重要"**的人设计。

## 🎯 核心价值

- **Zero-Knowledge Privacy (零知隐私)**：数据只存在于 iPhone 的加密芯片中
- **Ambient Intelligence (环境智能)**：把酒后的胡言乱语转化为结构化的商业情报
- **Curated Network (精选网络)**：不是为了存 5000 个泛泛之交，而是为了管理 150 个核心利益相关者

## 🏗️ 技术架构

基于 **Expo + React Native** 构建，参考 sim-run-app 架构：

| 层级 | 技术 |
|------|------|
| **路由** | Expo Router (文件系统路由) |
| **状态管理** | Zustand |
| **数据库** | Expo SQLite (本地加密) |
| **样式** | NativeWind (Tailwind CSS) |
| **安全** | Expo LocalAuthentication + SecureStore |
| **音频** | Expo AV |
| **动画** | React Native Reanimated |

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 📁 项目结构

```
app/
├── (auth)/              # 认证流程
│   ├── onboarding.tsx   # 隐私承诺引导页
│   └── auth-lock.tsx    # FaceID/TouchID 锁
├── (tabs)/              # 主标签栏
│   ├── index.tsx        # 首页 - 巨大录音按钮
│   ├── contacts/        # 人脉档案
│   └── settings.tsx     # 设置（Kill Switch）
├── (views)/             # 详情视图
└── _layout.tsx          # 根布局

components/
├── auth/                # 认证组件
├── recording/           # 录音组件
├── contacts/            # 联系人组件
└── ui/                  # 基础 UI

store/                   # Zustand 状态管理
db/                      # SQLite 数据库操作
services/
├── ai/                  # AI 实体提取
├── security/            # 生物识别认证
└── voice/               # 语音录制
types/                   # TypeScript 类型定义
```

## ✨ 核心功能

### P0 (MVP) - 已完成

1. **The Vault (安全与信任)**
   - ✅ FaceID/TouchID 生物识别锁
   - ✅ 隐私承诺引导页
   - ✅ Kill Switch 一键数据自毁

2. **The Input (情报录入)**
   - ✅ 语音优先界面（巨大录音按钮）
   - ✅ 离线音频录制
   - ✅ 模拟转文字（MVP 阶段）

3. **The Brain (AI 情报分析师)**
   - ✅ 规则引擎实体提取（人名、健康、需求、偏好）
   - ✅ 自动生成待办事项
   - ✅ 自动归档到联系人档案

4. **The Dossier (档案与关系)**
   - ✅ CIA 风格人物卡片
   - ✅ 健康、偏好、禁忌追踪
   - ✅ 交往时间轴

### P1 (后续版本)

- [ ] 本地 Vosk 语音识别
- [ ] 本地 ONNX AI 模型
- [ ] 自然语言搜索
- [ ] 伪装密码模式
- [ ] 数据导出/备份

## 🎨 设计规范

- **主题**：Dark Mode Only (全黑模式)
- **字体**：衬线体 (Serif) 用于标题，营造报纸/杂志的高级感
- **颜色**：
  - Void: `#0a0a0a` - 背景
  - Elite: `#f5f5f5` - 主文字
  - Accent: `#c9a962` - 强调色（金色）
  - Danger: `#dc2626` - 危险/警告
- **触感**：大量使用 Haptic Feedback

## 🔐 隐私声明

```
No Cloud. No Servers. Only on your Device.
```

- 所有数据仅存储于本地 SQLite 数据库
- 生物识别用于应用锁定
- Kill Switch 可立即销毁所有数据
- 无网络请求（除可选的云端语音识别）

## 📄 许可证

Private - 仅供学习和内部使用

---

**Black Book** - 为精英阶层设计的情报系统

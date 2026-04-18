# Black Book

> **Local-First, AI-Powered Networking Intelligence System**
> 
> 专为那些**"关系比钱更重要"**的人设计。
> 一个将日常交往转化为结构化商业情报的私人智库。

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-000000?style=for-the-badge&logo=react" alt="Platform" />
  <img src="https://img.shields.io/badge/Framework-Expo%20SDK%2054-6B7280?style=for-the-badge&logo=expo" alt="Framework" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript" alt="Language" />
  <img src="https://img.shields.io/badge/Architecture-Local--First-22C55E?style=for-the-badge" alt="Architecture" />
</p>

---

## 🎯 核心价值

| 理念 | 描述 |
|:---:|---|
| 🛡️ **Zero-Knowledge Privacy** | 数据仅存在于您设备的加密芯片中。无云端，无服务器，无追踪。 |
| 🧠 **Ambient Intelligence** | 将酒后的闲聊转化为结构化的商业情报。自动提取人名、需求、偏好。 |
| 🤝 **Curated Network** | 不管理 5000 个泛泛之交，只深耕 150 个核心利益相关者。 |

---

## ✨ 核心功能

### 🎙️ 语音优先 (Voice-First)
- **一键录音**：打开即录，松开即止。无需复杂操作。
- **智能转录**：自动将语音转换为文本，提取关键实体。
- **离线可用**：核心录音功能完全离线运行。

### 🕵️ 智能分析 (AI Analyst)
- **LLM 智能提取**：自动识别对话中的人名、公司、职位、需求、偏好。
- **自动归档**：将提取的信息自动关联到对应联系人档案。
- **待办生成**：从语音中自动生成待办事项，不错过任何承诺。

### 📂 档案与关系 (The Dossier)
- **CIA 风格档案**：专业、极简的联系人详情页。
- **情报追踪**：健康状况、个人偏好、商业禁忌、家庭成员。
- **交往时间轴**：完整记录每一次互动，支持按时间、类型筛选。
- **标签管理**：灵活的多维标签系统，快速圈选特定人群。

### 🔐 安全与信任 (The Vault)
- **生物识别锁**：Face ID / Touch ID 守护应用入口。
- **Kill Switch**：一键永久销毁所有数据，彻底无痕。
- **本地加密存储**：基于 SQLite 的本地加密数据库，数据不出设备。

### 📊 待办与提醒 (Tasks & Reminders)
- **智能待办**：关联特定联系人的任务管理。
- **优先级管理**：高/中/低三级优先级，逾期自动标红。
- **数据统计**：可视化展示待办完成率与趋势。

---

## 🏗️ 技术架构

基于 **Expo + React Native** 构建，采用现代前端工程化实践：

| 层级 | 技术选型 | 说明 |
|:---:|---|---|
| **框架** | Expo SDK 54 + RN 0.81 | 最新架构，支持 New Architecture |
| **语言** | TypeScript (Strict) | 类型安全，拒绝 `any` |
| **路由** | Expo Router | 文件系统路由，支持嵌套布局 |
| **状态** | Zustand | 轻量、高效的状态管理 |
| **数据库** | Expo SQLite | 本地关系型数据库 |
| **样式** | NativeWind 4.x | Tailwind CSS 的 RN 实现 |
| **动画** | Reanimated 4.x | 高性能原生动画 |
| **国际化** | i18next | 支持中/英多语言切换 |

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm / pnpm
- Xcode (iOS) 或 Android Studio (Android)

### 安装与运行
```bash
# 1. 克隆项目
git clone https://github.com/ShetePro/black-book-dossier.git
cd black-book-dossier

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npx expo start

# 4. 运行到设备
npx expo run:ios   # iOS (需配置签名)
npx expo run:android # Android
```

### 项目结构
```
app/
├── (tabs)/              # 主标签栏 (首页 / 联系人)
├── (views)/             # 功能视图
│   ├── contact/         # 联系人详情 / 编辑 / 新建
│   ├── action-item/     # 待办管理 / 新建
│   ├── interaction/     # 交往记录
│   └── settings.tsx     # 设置中心
├── _layout.tsx          # 根布局
└── ...

components/
├── contact/             # 联系人列表 / 卡片 / 空状态
├── actionItem/          # 待办列表
├── analysis/            # LLM 智能分析卡片
└── ...

store/                   # Zustand 状态管理
db/                      # SQLite 数据库操作
services/
├── ai/                  # AI 实体提取与分析
├── export/              # CSV 数据导出
└── ...
```

---

## 🎨 设计规范

- **主题**：Dark Mode Only (全黑模式)
- **字体**：系统默认无衬线体，标题加粗
- **配色**：
  - 🌑 Void: `#0a0a0a` - 背景
  - ⚪ Elite: `#f5f5f5` - 主文字
  - 🥇 Accent: `#c9a962` - 强调色（金色）
  - 🔴 Danger: `#ef4444` - 危险/警告
- **交互**：全局触感反馈 (Haptic Feedback)

---

## 🔐 隐私声明

```
No Cloud. No Servers. Only on your Device.
```

- 所有数据仅存储于本地 SQLite 数据库。
- 生物识别用于应用锁定，指纹/面容数据不离开设备安全区。
- Kill Switch 可立即销毁所有数据，不可恢复。
- 无后台网络请求，杜绝数据泄露风险。

---

## 📄 许可证

Private - 仅供学习和内部使用。

---

**Black Book** - 为精英阶层设计的私人情报系统。

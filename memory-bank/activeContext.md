# Active Context

## Current Focus
增强 AI 实体提取功能，支持多维度分析（时间、地点、对象、事件、特征、建议），并添加语音识别修正功能。

## Recent Changes
- ✅ Store 模块化重构: 将 store 拆分为 auth/contacts/recording 三个独立模块
- ✅ 自定义 Hooks: 新增 useContacts, useContact, useContactSearch, useCreateContact
- ✅ UI 组件库: 新增 ContactCard, ContactList, ContactEmptyState, ContactSkeleton
- ✅ 页面重构: contacts.tsx 从 287行简化到 118行，[id].tsx 从 412行简化到 245行
- ✅ 通讯录导入: 集成 expo-contacts，支持从设备通讯录批量导入
- ✅ 依赖修复: 修复 expo-linking 和 expo-contacts 版本兼容问题
- ✅ 功能缺口文档: 创建 MISSING_FEATURES.md 记录项目缺失功能
- ✅ **新增**: 增强型实体类型定义 (types/entity.ts) - 支持时间/地点/人物/事件/需求/偏好/健康/建议/组织多维度
- ✅ **新增**: 增强型实体提取服务 (services/ai/enhancedEntityExtractor.ts) - 使用 NLP 模式匹配
- ✅ **新增**: 语音识别修正功能 - 基于通讯录联系人匹配纠正识别错误
- ✅ **新增**: 分析组件库 (components/analysis/) - EnhancedEntityCard, AnalysisSummaryCard, TranscriptionCorrectionPanel

## Project Status
- **当前阶段**: AI 实体提取增强
- **已完成**: 多维度实体类型、增强提取器、语音识别修正、分析 UI 组件
- **待集成**: 将增强分析器接入 agent-review.tsx

## New Features

### 多维度实体提取
| 维度 | 子类型 | 提取内容 |
|------|--------|----------|
| 时间 | specific/relative/duration/recurring | 具体日期、相对时间、时间段、周期性 |
| 地点 | city/venue/address/online | 城市、场所、地址、线上平台 |
| 人物 | contact/family/colleague | 联系人、家人、同事，含职位/公司 |
| 事件 | meeting/activity/milestone/issue/opportunity | 会议、活动、里程碑、问题、机会 |
| 需求 | explicit/implicit/urgent | 明确需求、隐性需求、紧急需求 |
| 偏好 | like/dislike/taboo/habit | 喜好、厌恶、禁忌、习惯 |
| 健康 | condition/medication/allergy | 疾病、用药、过敏 |
| 建议 | recommendation/action/strategy/warning | 推荐、行动、策略、警告 |
| 组织 | company/institution/department | 公司、机构、部门 |

### 语音识别修正
- 基于 Levenshtein 距离的模糊匹配
- 自动识别可能识别错误的联系人姓名
- 高置信度 (>80%) 自动建议修正
- 中置信度 (60-80%) 备选建议

## Technical Notes
- 新增文件:
  - `types/entity.ts` - 增强型实体类型定义
  - `services/ai/enhancedEntityExtractor.ts` - 实体提取服务
  - `hooks/useEnhancedEntityExtraction.ts` - React Hook
  - `components/analysis/EnhancedEntityCard.tsx` - 实体卡片
  - `components/analysis/AnalysisSummaryCard.tsx` - 摘要卡片
  - `components/analysis/TranscriptionCorrectionPanel.tsx` - 修正面板

## iOS 权限问题说明
NSContactsUsageDescription 已正确配置在 app.json 和 Info.plist 中。如果应用仍崩溃，需要：
```bash
cd ios && xcodebuild clean && cd ..
npx expo run:ios
```

## Next Steps
1. ✅ 集成增强分析器到 agent-review.tsx
2. ✅ 添加语音识别修正 UI
3. 测试多维度实体提取准确性
4. 根据测试结果优化模式匹配规则

## Blockers
- 无

## Last Updated
2026-04-03 - 完成增强型实体提取系统

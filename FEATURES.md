# Black Book - 功能文档

## 项目概述

Black Book 是一个 Local-First、AI 驱动的智能人脉与活动记录系统。通过自然语言交互，帮助用户无感记录社交/活动轨迹，并利用 AI Agent 进行深度查询、统计分析与关系维护提醒。

## 核心功能

### 1. 活动记录管理

#### 1.1 活动创建
- 支持创建多种类型的活动（篮球、爬山、会议、聚餐等）
- 记录活动时间、地点、参与者
- 支持活动描述和 AI 分析

#### 1.2 活动查询
- 查看所有活动列表
- 按活动类型筛选
- 查看活动详情和参与者

#### 1.3 活动统计
- 总活动数量统计
- 按类型分布统计
- 月度趋势分析
- 最活跃联系人排行

### 2. AI Agent 智能助手

#### 2.1 自然语言查询
支持以下类型的查询：

**活动统计查询**
- "有多少人和我打过篮球？"
- "谁和我最常一起吃饭？"
- "活动统计"

**休眠联系人查询**
- "哪些联系人超过3个月没联系了？"
- "哪些联系人超过半年没联系了？"
- "多久没联系的人了？"

**活动历史查询**
- "我和张三最近的活动"
- "查看李四的活动历史"

#### 2.2 智能响应
- 自动识别查询意图
- 提取关键参数
- 生成自然语言回答
- 显示执行的 SQL（调试用）

### 3. 智能提醒

#### 3.1 休眠关系提醒
- 自动检测超过阈值未联系的联系人
- 高优先级（>180天）
- 中优先级（90-180天）

#### 3.2 重要关系提醒
- 识别需要关注的重要联系人
- 基于互动频率和优先级

#### 3.3 提醒设置
- 自定义休眠阈值（默认90天）
- 推送通知开关
- 检查频率设置

### 4. 数据统计与可视化

#### 4.1 统计概览
- 总活动数
- 活动类型数
- 本月活动数

#### 4.2 数据可视化
- 活动类型分布条形图
- 月度趋势条形图
- 互动排行榜

#### 4.3 时间范围筛选
- 7天
- 30天
- 90天
- 1年

## 技术架构

### 数据库设计

#### 核心表
1. **activities** - 活动记录
2. **activity_participants** - 活动参与者关联
3. **activity_types** - 活动类型定义
4. **contacts** - 联系人（扩展字段）

#### 触发器
- 自动更新联系人最后互动时间
- 自动统计联系人参与活动次数

### AI Agent 架构

```
用户输入
    ↓
NLP Processor (意图识别)
    ↓
Agent Tools (工具选择)
    ↓
Database Query (数据查询)
    ↓
Response Generator (响应生成)
    ↓
自然语言回答
```

### 服务层

#### Database Services
- `activities.ts` - 活动 CRUD
- `activityParticipants.ts` - 参与者管理
- `activityTypes.ts` - 活动类型管理
- `contactQueries.ts` - 联系人查询

#### AI Services
- `tools.ts` - Agent 工具定义
- `nlpProcessor.ts` - 自然语言处理
- `agentService.ts` - Agent 主服务

#### Reminder Services
- `reminderService.ts` - 提醒管理

## 使用指南

### 快速开始

#### 1. 查看活动记录
1. 打开应用
2. 进入"活动记录"页面
3. 查看所有活动列表
4. 点击活动查看详情

#### 2. 使用 AI 助手
1. 进入"AI 助手"页面
2. 输入自然语言查询，例如：
   - "有多少人和我打过篮球？"
   - "哪些联系人超过3个月没联系了？"
3. 查看 AI 返回的结果

#### 3. 查看智能提醒
1. 进入"智能提醒"页面
2. 查看需要维护的关系
3. 点击提醒跳转到联系人详情
4. 或忽略/延后提醒

#### 4. 查看统计数据
1. 进入"数据统计"页面
2. 查看活动统计概览
3. 切换时间范围查看趋势
4. 查看互动排行榜

### 高级功能

#### 自定义活动类型
系统预置了7种默认活动类型：
- 篮球 (basketball)
- 爬山 (hiking)
- 会议 (meeting)
- 聚餐 (dinner)
- 咖啡 (coffee)
- 电影 (movie)
- 旅行 (travel)

#### 提醒设置
1. 进入"智能提醒"页面
2. 调整休眠阈值（默认90天）
3. 开启/关闭推送通知
4. 设置检查频率

## API 参考

### Database API

#### Activities
```typescript
// 创建活动
const activityId = await createActivity(db, {
  title: '篮球活动',
  activityType: 'basketball',
  startedAt: Date.now(),
  // ...
});

// 获取活动
const activity = await getActivityById(db, activityId);

// 获取活动列表
const activities = await getActivities(db, { limit: 50 });
```

#### Agent API

```typescript
// 查询
const response = await agentService.query({
  question: '有多少人和我打过篮球？',
});

// 批量查询
const responses = await agentService.queryBatch([
  '有多少人和我打过篮球？',
  '哪些联系人超过3个月没联系了？',
]);
```

#### Reminder API

```typescript
// 检查提醒
const reminders = await reminderService.checkReminders();

// 获取设置
const settings = reminderService.getSettings();

// 更新设置
await reminderService.saveSettings({
  dormantContactThreshold: 60,
});
```

## 配置说明

### 提醒阈值
- **高优先级**: >180天未联系
- **中优先级**: 90-180天未联系
- **默认阈值**: 90天

### 时间范围
- **7天**: 最近一周
- **30天**: 最近一月
- **90天**: 最近三月
- **1年**: 最近一年

## 故障排除

### 常见问题

#### Q: AI 助手无法识别我的问题
A: 尝试使用以下格式：
- "有多少人和我[活动类型]？"
- "哪些联系人超过[时间]没联系了？"
- "我和[联系人姓名]最近的活动"

#### Q: 统计数据不准确
A: 
1. 检查活动是否正确创建
2. 确认参与者是否正确关联
3. 尝试刷新页面

#### Q: 提醒没有生成
A:
1. 检查提醒设置中的阈值
2. 确认联系人 last_interaction_at 字段
3. 手动触发检查：进入提醒页面下拉刷新

## 更新日志

### v1.0.0 (2026-04-07)
- ✅ Phase 1: 数据库与后端
- ✅ Phase 2: AI Agent 功能
- ✅ Phase 3: 核心功能页面
- ✅ Phase 4: 智能提醒
- ✅ Phase 5: 统计与可视化

## 贡献指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循现有代码风格
- 添加适当的错误处理
- 编写清晰的注释

### 提交规范
```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 构建/工具
```

## 许可证

Private - 仅供学习和内部使用

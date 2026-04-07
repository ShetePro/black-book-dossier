# Black Book - API 文档

## 数据库 API

### Activities Service

#### createActivity
创建新活动

```typescript
import { createActivity } from '@/services/db/activities';

const activityId = await createActivity(db, {
  userId: 'user_123',
  title: '篮球活动',
  description: '和朋友一起打篮球',
  activityType: 'basketball',
  startedAt: Date.now(),
  endedAt: Date.now() + 7200000, // 2小时后
  locationName: '奥体中心',
  locationLat: 39.9042,
  locationLng: 116.4074,
  rawInput: '今天下午和朋友在奥体中心打篮球',
  aiAnalysis: { summary: '愉快的篮球活动' },
  sentiment: 'positive',
});
```

**参数**: `CreateActivityInput`
- `userId`: string | null - 用户ID
- `title`: string - 活动标题（必填）
- `description`: string | null - 活动描述
- `activityType`: string - 活动类型（必填）
- `startedAt`: number - 开始时间戳（必填）
- `endedAt`: number | null - 结束时间戳
- `locationName`: string | null - 地点名称
- `locationLat`: number | null - 纬度
- `locationLng`: number | null - 经度
- `rawInput`: string | null - 原始输入
- `aiAnalysis`: object - AI分析结果
- `sentiment`: 'positive' | 'neutral' | 'negative' | null - 情感

**返回**: `Promise<string>` - 活动ID

---

#### getActivityById
根据ID获取活动

```typescript
import { getActivityById } from '@/services/db/activities';

const activity = await getActivityById(db, 'activity_123');
```

**参数**:
- `db`: SQLiteDatabase
- `id`: string - 活动ID

**返回**: `Promise<Activity | null>`

---

#### getActivities
获取活动列表

```typescript
import { getActivities } from '@/services/db/activities';

const activities = await getActivities(db, {
  userId: 'user_123',
  activityType: 'basketball',
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
  endDate: Date.now(),
  limit: 50,
  offset: 0,
});
```

**参数**: `ActivityQueryFilters`
- `userId`: string - 用户ID筛选
- `activityType`: string - 活动类型筛选
- `startDate`: number - 开始时间筛选
- `endDate`: number - 结束时间筛选
- `sentiment`: ActivitySentiment - 情感筛选
- `limit`: number - 返回数量限制
- `offset`: number - 偏移量

**返回**: `Promise<Activity[]>`

---

#### getActivityWithParticipants
获取活动及参与者信息

```typescript
import { getActivityWithParticipants } from '@/services/db/activities';

const activity = await getActivityWithParticipants(db, 'activity_123');
```

**返回**: `Promise<ActivityWithParticipants | null>`

---

#### updateActivity
更新活动

```typescript
import { updateActivity } from '@/services/db/activities';

await updateActivity(db, 'activity_123', {
  title: '新的标题',
  description: '新的描述',
});
```

**参数**:
- `db`: SQLiteDatabase
- `id`: string - 活动ID
- `updates`: `UpdateActivityInput` - 更新字段

---

#### deleteActivity
删除活动

```typescript
import { deleteActivity } from '@/services/db/activities';

await deleteActivity(db, 'activity_123');
```

---

#### getActivityStats
获取活动统计

```typescript
import { getActivityStats } from '@/services/db/activities';

const stats = await getActivityStats(db, 'user_123');
```

**返回**: `Promise<ActivityStats>`
- `totalCount`: number - 总活动数
- `byType`: Record<string, number> - 按类型分布
- `byMonth`: Record<string, number> - 按月分布
- `byContact`: Array - 按联系人分布

---

### Activity Participants Service

#### addParticipant
添加参与者

```typescript
import { addParticipant } from '@/services/db/activityParticipants';

const participantId = await addParticipant(db, {
  activityId: 'activity_123',
  contactId: 'contact_456',
  role: 'organizer',
  notes: '组织者',
});
```

---

#### addParticipants
批量添加参与者

```typescript
import { addParticipants } from '@/services/db/activityParticipants';

await addParticipants(db, 'activity_123', [
  'contact_456',
  'contact_789',
], 'participant');
```

---

#### getParticipantsByActivity
获取活动参与者

```typescript
import { getParticipantsByActivity } from '@/services/db/activityParticipants';

const participants = await getParticipantsByActivity(db, 'activity_123');
```

---

### Activity Types Service

#### createActivityType
创建活动类型

```typescript
import { createActivityType } from '@/services/db/activityTypes';

const typeId = await createActivityType(db, {
  userId: 'user_123',
  name: 'swimming',
  icon: 'water-outline',
  color: '#3498DB',
  category: 'sports',
});
```

---

#### getAllActivityTypes
获取所有活动类型

```typescript
import { getAllActivityTypes } from '@/services/db/activityTypes';

const types = await getAllActivityTypes(db, 'user_123');
```

---

### Contact Queries Service

#### getDormantContacts
获取休眠联系人

```typescript
import { getDormantContacts } from '@/services/db/contactQueries';

const dormantContacts = await getDormantContacts(db, 90, 20);
// 超过90天未联系的前20个联系人
```

**参数**:
- `db`: SQLiteDatabase
- `daysThreshold`: number - 天数阈值
- `limit`: number - 返回数量

**返回**: `Promise<DormantContact[]>`

---

#### getMostActiveContacts
获取最活跃联系人

```typescript
import { getMostActiveContacts } from '@/services/db/contactQueries';

const topContacts = await getMostActiveContacts(db, 10);
// 前10个最活跃联系人
```

---

#### getContactsNeedingAttention
获取需要关注的联系人

```typescript
import { getContactsNeedingAttention } from '@/services/db/contactQueries';

const needingAttention = await getContactsNeedingAttention(db, 30, 90);
// 30天高优先级，90天中优先级
```

**返回**: `{ high: DormantContact[], medium: DormantContact[] }`

---

## AI Agent API

### Agent Service

#### query
发送查询请求

```typescript
import { agentService } from '@/services/ai/agent';

const response = await agentService.query({
  question: '有多少人和我打过篮球？',
  useLLM: false, // 是否使用LLM增强
});
```

**参数**: `AgentQueryRequest`
- `question`: string - 查询问题（必填）
- `useLLM`: boolean - 是否使用LLM
- `context`: Record<string, unknown> - 上下文

**返回**: `AgentQueryResponse`
- `success`: boolean - 是否成功
- `answer`: string - 自然语言回答
- `data`: unknown - 原始数据
- `toolUsed`: string - 使用的工具
- `confidence`: number - 置信度
- `sql`: string - 执行的SQL
- `processingTime`: number - 处理时间

---

#### queryBatch
批量查询

```typescript
const responses = await agentService.queryBatch([
  '有多少人和我打过篮球？',
  '哪些联系人超过3个月没联系了？',
  '活动统计',
]);
```

---

#### getQueryHistory
获取查询历史

```typescript
const history = agentService.getQueryHistory(10);
// 最近10条查询记录
```

---

#### getQuickQueries
获取快捷查询

```typescript
const quickQueries = agentService.getQuickQueries();
// ['有多少人和我打过篮球？', '哪些联系人超过3个月没联系了？', ...]
```

---

### NLP Processor

#### parseQuestion
解析自然语言问题

```typescript
import { nlpProcessor } from '@/services/ai/agent';

const parsed = nlpProcessor.parseQuestion('有多少人和我打过篮球？');
```

**返回**: `ParsedQuery | null`
- `intent`: string - 意图
- `toolName`: string - 工具名
- `parameters`: Record<string, unknown> - 参数
- `confidence`: number - 置信度

---

#### generateResponse
生成自然语言响应

```typescript
const answer = nlpProcessor.generateResponse(parsedQuery, resultData);
```

---

## Reminder Service API

### Reminder Service

#### init
初始化提醒服务

```typescript
import { reminderService } from '@/services/reminders';

await reminderService.init();
```

---

#### checkReminders
检查提醒

```typescript
const reminders = await reminderService.checkReminders();
```

**返回**: `Reminder[]`
- `id`: string - 提醒ID
- `type`: 'dormant_contact' | 'birthday' | 'anniversary' | 'suggestion'
- `title`: string - 标题
- `description`: string - 描述
- `priority`: 'high' | 'medium' | 'low'
- `contactId`: string - 联系人ID
- `contactName`: string - 联系人姓名

---

#### getReminders
获取提醒列表

```typescript
const reminders = reminderService.getReminders({
  type: 'dormant_contact',
  priority: 'high',
});
```

---

#### dismissReminder
忽略提醒

```typescript
reminderService.dismissReminder('reminder_123');
```

---

#### snoozeReminder
延后提醒

```typescript
reminderService.snoozeReminder('reminder_123', 24); // 延后24小时
```

---

#### getSettings
获取设置

```typescript
const settings = reminderService.getSettings();
```

**返回**: `ReminderSettings`
- `dormantContactThreshold`: number - 休眠阈值（天）
- `highPriorityDays`: number - 高优先级天数
- `mediumPriorityDays`: number - 中优先级天数
- `enablePushNotifications`: boolean - 推送通知
- `reminderFrequency`: 'daily' | 'weekly' | 'monthly' - 检查频率

---

#### saveSettings
保存设置

```typescript
await reminderService.saveSettings({
  dormantContactThreshold: 60,
  enablePushNotifications: true,
});
```

---

#### generateSuggestions
生成建议

```typescript
const suggestions = await reminderService.generateSuggestions();
// ['建议联系：张三、李四 等 5 位休眠联系人', ...]
```

---

## 类型定义

### Activity

```typescript
interface Activity {
  id: string;
  userId: string | null;
  title: string;
  description: string | null;
  activityType: string;
  startedAt: number;
  endedAt: number | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  rawInput: string | null;
  aiAnalysis: AIAnalysis;
  sentiment: ActivitySentiment | null;
  createdAt: number;
  updatedAt: number;
}
```

### ActivityParticipant

```typescript
interface ActivityParticipant {
  id: string;
  activityId: string;
  contactId: string;
  role: ParticipantRole | null;
  notes: string | null;
  createdAt: number;
}
```

### ActivityType

```typescript
interface ActivityType {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  category: ActivityCategory;
  createdAt: number;
}
```

### DormantContact

```typescript
interface DormantContact {
  contactId: string;
  contactName: string;
  contactAvatar: string | null;
  lastInteractionAt: number;
  daysSinceLastInteraction: number;
  totalActivities: number;
}
```

---

## 错误处理

所有 API 都可能抛出错误，建议使用 try-catch 处理：

```typescript
try {
  const activity = await getActivityById(db, id);
} catch (error) {
  console.error('Failed to get activity:', error);
  // 处理错误
}
```

## 最佳实践

1. **始终使用 try-catch** 包装数据库操作
2. **及时关闭数据库连接**（如需要）
3. **使用类型定义** 确保类型安全
4. **验证输入参数** 避免 SQL 注入
5. **使用事务** 处理多个相关操作

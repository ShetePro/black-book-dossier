# 智能交往记录自动提取计划

## 功能目标
语音识别后，自动提取事件和时间，添加到对应联系人的交往中。

## 示例场景
**语音输入**: "明天要和唐俊杰去爬山"

**自动提取**:
- 联系人：唐俊杰
- 日期：2026-04-06（明天的具体日期）
- 事件：爬山
- 类型：活动

**自动生成交往记录**:
```json
{
  "contactId": "tang-jun-jie-id",
  "type": "activity",
  "content": "和唐俊杰一起去爬山",
  "date": "2026-04-06",
  "location": null,
  "extractedFromVoice": true
}
```

## 实施步骤

### 任务 1: 创建智能分析服务
**文件**: `services/ai/smartAnalyzer.ts`

**功能**:
- 接收语音转录文本
- 提取时间信息（相对时间转绝对时间）
- 提取事件类型和描述
- 识别参与人
- 返回结构化数据

**核心函数**:
```typescript
export interface SmartAnalysisResult {
  eventType: 'activity' | 'meeting' | 'meal' | 'call' | 'other';
  eventDescription: string;
  date: string; // ISO 格式 YYYY-MM-DD
  time?: string; // HH:MM
  location?: string;
  participants: string[]; // 人名列表
  extractedContactName?: string; // 主要联系人
}

export const analyzeVoiceContent = async (
  text: string,
  contacts: Contact[]
): Promise<SmartAnalysisResult>
```

### 任务 2: 时间解析
**实现**:
```typescript
// 相对时间转绝对时间
const parseRelativeTime = (text: string): Date => {
  const now = new Date();
  
  // 明天
  if (text.includes('明天')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // 后天
  if (text.includes('后天')) {
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return dayAfterTomorrow;
  }
  
  // 下周X
  const weekdayMatch = text.match(/下周([一二三四五六日])/);
  if (weekdayMatch) {
    return parseWeekday(weekdayMatch[1]);
  }
  
  // 具体日期：X月X日
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (dateMatch) {
    const date = new Date(now.getFullYear(), parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]));
    return date;
  }
  
  return now;
};
```

### 任务 3: 事件类型识别
**实现**:
```typescript
const EVENT_PATTERNS: Record<string, string[]> = {
  activity: ['爬山', '游泳', '打球', '运动', '健身', '跑步', '旅游', '旅行', '逛街'],
  meeting: ['开会', '会议', '约谈', '见面', '谈事', '聊', '讨论', '汇报'],
  meal: ['吃饭', '聚餐', '请客', '晚宴', '午餐', '晚餐', '早餐', '喝咖啡', '喝茶'],
  call: ['电话', '通话', '打电话', '视频', '语音'],
  gift: ['送礼', '礼物', '红包', '请客'],
};

const detectEventType = (text: string): string => {
  for (const [type, keywords] of Object.entries(EVENT_PATTERNS)) {
    if (keywords.some(k => text.includes(k))) {
      return type;
    }
  }
  return 'other';
};
```

### 任务 4: 更新 agent-review.tsx
**文件**: `app/(views)/agent-review.tsx`

**修改内容**:
1. 在分析结果页面添加"自动创建交往记录"选项
2. 显示提取的事件、时间、联系人
3. 用户确认后自动创建记录

**UI 流程**:
```
AI 分析结果
├── 识别联系人：唐俊杰 [匹配度: 95%]
├── 提取事件：爬山
├── 提取时间：2026-04-06（明天）
└── [自动添加到交往记录] 按钮
```

### 任务 5: 创建自动添加功能
**文件**: `hooks/useAutoInteraction.ts`

**Hook 功能**:
```typescript
export const useAutoInteraction = () => {
  const createInteractionFromVoice = async (
    analysisResult: SmartAnalysisResult,
    matchedContact: Contact
  ): Promise<Interaction> => {
    // 1. 构建交往记录
    const interaction: InsertInteraction = {
      contactId: matchedContact.id,
      type: analysisResult.eventType,
      content: analysisResult.eventDescription,
      date: analysisResult.date,
      location: analysisResult.location,
      metadata: {
        extractedFromVoice: true,
        originalText: text,
      },
    };
    
    // 2. 保存到数据库
    return await addInteraction(interaction);
  };
  
  return { createInteractionFromVoice };
};
```

### 任务 6: 添加确认弹窗
**文件**: `components/interaction/AutoInteractionConfirm.tsx`

**功能**:
- 显示提取的信息
- 允许用户编辑日期、事件描述
- 确认/取消按钮

### 任务 7: 集成到录音流程
**文件**: `hooks/useRecorder.ts`

**修改**:
```typescript
const stopRecording = useCallback(async () => {
  // ... 现有代码 ...
  
  // 1. 转录语音
  const result = await transcribeAudio(uri, language);
  
  // 2. 智能分析
  const analysis = await analyzeVoiceContent(result.text, contacts);
  
  // 3. 匹配联系人
  const matchedContact = await findBestContactMatch(
    analysis.extractedContactName, 
    contacts
  );
  
  // 4. 如果置信度高，自动跳转到确认页面
  if (matchedContact && matchedContact.confidence > 0.8) {
    router.push({
      pathname: '/(views)/auto-interaction-confirm',
      params: {
        contactId: matchedContact.id,
        analysis: JSON.stringify(analysis),
      },
    });
  }
  
  return { text: result.text, audioUri: uri, analysis };
}, []);
```

## 数据模型

### SmartAnalysisResult
```typescript
interface SmartAnalysisResult {
  eventType: 'activity' | 'meeting' | 'meal' | 'call' | 'other';
  eventDescription: string;
  date: string;
  time?: string;
  location?: string;
  participants: string[];
  extractedContactName?: string;
  confidence: number;
}
```

## 使用示例

**用户说**: "明天要和唐俊杰去爬山"

**系统输出**:
```json
{
  "eventType": "activity",
  "eventDescription": "和唐俊杰一起去爬山",
  "date": "2026-04-06",
  "participants": ["唐俊杰"],
  "extractedContactName": "唐俊杰",
  "confidence": 0.95
}
```

**自动匹配**: 通讯录中的"唐俊杰"

**生成记录**:
- 类型：活动
- 内容：和唐俊杰一起去爬山
- 日期：2026-04-06
- 联系人：唐俊杰

## 运行 /start-work
执行 `/start-work` 开始实施此计划。

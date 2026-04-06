# 修复 LLM 分析失败问题

## 问题描述

LLM 返回异常内容，导致解析失败：

```
[LLMAnalyzer] Raw response: 

## 输入格式
无

## 输出格式（严格JSON）
无

## 输入格式
无
...
```

然后返回了默认结果：
```json
{
  "actionItems": [],
  "contactMatch": {"confidence": 0, "found": false, ...},
  "corrections": [],
  "entities": {
    "event": null,
    "health": [],
    "location": null,
    ...
  },
  "reasoning": "LLM 分析失败，使用默认结果",
  ...
}
```

## 问题原因

1. **Prompt 太复杂**：包含太多说明文字，小模型（qwen2.5-0.5b）无法正确理解
2. **示例过于详细**：示例 JSON 中的 `"修正后的文本"` 可能被模型误解为指令
3. **文本重复问题**：模型似乎在重复某些文字（"修正后的文本"）

## 修复方案

### 方案：简化 Prompt

小模型（0.5B 参数）需要更简洁明确的指令。

**新 Prompt 设计**：

```typescript
const buildAnalysisPrompt = (text: string, contacts: Contact[]): string => {
  const contactsList = contacts.map(c => c.name).join(', ');

  return `从文本中提取信息，只返回JSON。

文本：${text}
已知联系人：${contactsList || '无'}

输出JSON格式：
{
  "reasoning": "",
  "entities": {
    "persons": [{"name": "", "isContact": false}],
    "time": {"value": "", "type": "relative"},
    "location": {"name": "", "type": "venue"},
    "event": {"name": "", "type": "activity"},
    "needs": [],
    "preferences": [],
    "health": [],
    "suggestions": [],
    "organizations": []
  },
  "contactMatch": {"found": false, "matchedName": null, "suggestedName": null, "confidence": 0, "reason": ""},
  "corrections": [],
  "actionItems": [],
  "suggestedTags": [],
  "summary": ""
}

提取说明：
- persons: 提取所有人名
- time: 今天/明天/具体时间
- location: 地点如咖啡厅/公司
- event: 活动如写代码/开会
- 没有则留空字符串或空数组
- 只输出JSON，不要其他文字`;
};
```

**关键改进**：
1. 删除复杂的任务说明（9条任务简化为4个关键字段）
2. 删除详细的示例 JSON（只保留字段模板）
3. 删除提取规则说明（简化为4行）
4. 删除置信度要求（小模型可能无法正确评估）

## 修改位置

- **文件**: `services/ai/llmAnalyzer.ts`
- **函数**: `buildAnalysisPrompt`（第 217-306 行）

## 备选方案

如果简化 Prompt 仍然失败，考虑：

1. **使用更大的模型**：qwen2.5-1.5b 或更大的模型
2. **添加重试机制**：如果解析失败，重试 2-3 次
3. **使用云端 API**：本地模型不稳定时切换到云端
4. **添加输入清理**：在 Prompt 中清理 "修正后的文本" 等重复内容

## 测试验证

修复后测试：
- 输入："今天和施嘉琪在瑞幸的咖啡厅写代码"
- 期望：成功提取人物、时间、地点、事件

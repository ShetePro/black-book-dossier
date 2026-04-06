# 修复 LLM 联系人匹配问题

## 问题原因

当前 Prompt 虽然传递了联系人列表，但没有明确告诉 LLM 要做什么：
1. 没有明确指令要求 LLM 匹配联系人
2. 没有说明如何比较文本中的人名和联系人
3. 没有说明返回什么值

## 修复方案

### 1. 简化并明确 Prompt

```typescript
const buildAnalysisPrompt = (text: string, contacts: Contact[]): string => {
  const contactsList = contacts.map(c => c.name).join(', ');

  return `分析这段文本，返回JSON：${text}

联系人列表：${contactsList || '无'}

任务：
1. 提取文本中提到的所有人名
2. 如果人名在联系人列表中，contactMatch.found设为true，matchedName设为匹配的名字
3. 如果人名不在联系人列表中，contactMatch.found设为false，suggestedName设为提取的人名
4. 提取活动和偏好信息

返回格式：
{"reasoning":"","contactMatch":{"found":false,"matchedName":null,"suggestedName":null,"confidence":0,"reason":""},"corrections":[],"insights":{"activities":[],"preferences":[],"personality":[],"profession":null},"suggestedTags":[]}

只返回JSON，不要其他内容。`;
};
```

### 关键改进
1. 明确列出"联系人列表"而不是模糊的"联系人"
2. 添加具体任务说明，告诉 LLM 如何匹配
3. 说明 `contactMatch` 字段的用途
4. 简化 JSON 格式，单行显示

### 2. 清理其他文件

由于 git checkout 恢复了文件，其他修改（实体提取、组件等）都恢复到了原始状态。需要重新应用之前的修改。

## 修改位置

- **文件**: `services/ai/llmAnalyzer.ts`
- **函数**: `buildAnalysisPrompt`（第 118-140 行）

## 预期效果

输入："今天和施嘉琪去瑞幸咖啡厅写了代码"
联系人列表："施嘉琪, 王总, 李经理"

LLM 应该返回：
```json
{
  "contactMatch": {
    "found": true,
    "matchedName": "施嘉琪",
    "suggestedName": null,
    "confidence": 0.95,
    "reason": "文本中提到的人名与联系人列表完全匹配"
  }
}
```

## 执行命令

```bash
/start-work fix-llm-contact-matching
```

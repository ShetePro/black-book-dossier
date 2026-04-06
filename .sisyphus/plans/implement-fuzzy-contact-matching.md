# 实现模糊联系人匹配

## 问题

当前 LLM 智能分析无法通过拼音或模糊匹配找到联系人，只能精确匹配。

## 分析

发现已有完善的模糊匹配服务 `services/ai/contactMatcher.ts`：
- ✅ 支持拼音首字母匹配
- ✅ 支持编辑距离（相似度）匹配
- ✅ 支持上下文加成
- ✅ 支持包含匹配

但当前实现中 LLM 承担了匹配任务，而小模型（0.5B）不具备模糊匹配能力。

## 解决方案

### 方案：分离提取和匹配

1. **LLM 只负责提取人名** - 简化 Prompt，不传递联系人列表
2. **代码层面做模糊匹配** - 使用现有的 `contactMatcher.findBestMatch()`

## 实施步骤

### 步骤 1：简化 LLM Prompt

修改 `services/ai/llmAnalyzer.ts` 中的 `buildAnalysisPrompt`：

```typescript
const buildAnalysisPrompt = (text: string, contacts: Contact[]): string => {
  return `分析这段文本，返回JSON：${text}

任务：
1. 提取文本中提到的所有人名（放到suggestedTags数组中）
2. 提取活动和偏好信息

返回格式：
{"reasoning":"","contactMatch":{"found":false,"matchedName":null,"suggestedName":null,"confidence":0,"reason":""},"corrections":[],"insights":{"activities":[],"preferences":[],"personality":[],"profession":null},"suggestedTags":[]}

只返回JSON，不要其他内容。`;
};
```

**关键改变**：
- 不传递联系人列表给 LLM
- LLM 只提取人名放到 `suggestedTags`
- 不在 LLM 层面做匹配

### 步骤 2：在代码中做模糊匹配

修改 `analyzeWithLLM` 或调用方，在获得 LLM 结果后使用 `contactMatcher`：

```typescript
import { findBestMatch, shouldAutoSelect } from './contactMatcher';

// 在 analyzeWithLLM 中或调用方
const result = await analyzeWithLLM(text, contacts);

// 从 suggestedTags 获取提取到的人名
const extractedNames = result.suggestedTags || [];

// 对每个提取到的人名做模糊匹配
for (const name of extractedNames) {
  const match = findBestMatch(name, contacts);
  
  if (match && shouldAutoSelect(match.confidence)) {
    // 高置信度匹配
    result.contactMatch = {
      found: true,
      matchedName: match.contact.name,
      suggestedName: null,
      confidence: match.confidence,
      reason: match.reason,
    };
  } else if (match && shouldShowSuggestion(match.confidence)) {
    // 中置信度，显示建议
    result.contactMatch = {
      found: false,
      matchedName: null,
      suggestedName: match.contact.name,
      confidence: match.confidence,
      reason: match.reason,
    };
  }
}
```

## 预期效果

输入："今天和施嘉琪去瑞幸咖啡厅写了代码"
联系人列表：["施嘉琪", "王总", "李经理"]

**LLM 返回**：
```json
{
  "suggestedTags": ["施嘉琪"],
  "insights": {
    "activities": ["写代码"]
  }
}
```

**代码匹配**：
- 提取人名："施嘉琪"
- 模糊匹配：与联系人 "施嘉琪" 完全匹配（confidence: 1.0）
- 结果：`contactMatch.found = true`, `matchedName = "施嘉琪"`

## 备选方案

如果 LLM 连人名都提取不准确，可以：
1. 在代码中使用正则提取人名（2-4个中文字符）
2. 然后对每个候选词做模糊匹配
3. 选择置信度最高的作为结果

## 执行命令

```bash
/start-work implement-fuzzy-contact-matching
```

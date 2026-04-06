# LLM 实体提取重构计划

## 目标

将所有静态正则匹配替换为 LLM 驱动的实体提取，通过优化 Prompt 达到更好的提取效果。

---

## 当前架构分析

### 1. 现有实体提取方式

**文件**: `services/ai/entityExtractor.ts`
- 使用静态正则表达式匹配
- 支持：人名、健康问题、地点、需求、偏好、日期等
- 问题：模式固定，无法灵活理解上下文

**文件**: `services/ai/enhancedEntityExtractor.ts`
- 更复杂的正则模式
- 支持时间、地点、人物、事件、需求、偏好、健康、建议、组织等
- 问题：仍然是静态匹配，维护困难

**文件**: `services/ai/llmAnalyzer.ts`
- 已经使用 LLM 进行联系人匹配和分析
- 但输出格式不够详细，缺少完整的实体提取

---

## 重构方案

### 方案：扩展 LLM 分析器，完全替代静态提取

修改 `services/ai/llmAnalyzer.ts`，增强 Prompt 使其能够提取所有类型的实体。

#### 新的 Prompt 设计

```typescript
const buildEntityExtractionPrompt = (text: string, contacts: Contact[]): string => {
  const contactsList = contacts.map(c => c.name).join(', ');

  return `你是一位专业的自然语言处理助手，负责从文本中提取结构化信息。

## 任务
分析以下文本，提取所有关键实体和信息：

1. **人物**：提取所有提及的人员姓名
2. **时间**：提取日期、时间、时间段（今天、明天、下午3点等）
3. **地点**：提取地点、场所、位置（公司、咖啡厅、城市等）
4. **事件/活动**：提取正在进行或计划进行的活动（开会、写代码、吃饭等）
5. **需求**：提取明确的需求或求助（需要帮忙、想找房子等）
6. **偏好**：提取喜好或厌恶（喜欢咖啡、讨厌等待等）
7. **健康**：提取健康问题或状态（头痛、感冒、吃药等）
8. **建议**：提取建议或提醒（建议买礼物、别忘了等）
9. **组织**：提取公司、机构名称

## 已知联系人列表
${contactsList || '无'}

## 待分析文本
"${text}"

## 输出格式（严格JSON）
只输出以下格式的JSON，不要任何其他文字：

{
  "reasoning": "分析推理过程...",
  "entities": {
    "persons": [
      {
        "name": "施嘉琪",
        "isContact": false,
        "contactId": null,
        "relation": null
      }
    ],
    "time": {
      "value": "今天",
      "type": "relative",
      "normalized": "2024-01-15"
    },
    "location": {
      "name": "瑞幸的咖啡厅",
      "type": "venue",
      "address": null
    },
    "event": {
      "name": "写代码",
      "type": "activity",
      "participants": ["施嘉琪"]
    },
    "needs": [],
    "preferences": [],
    "health": [],
    "suggestions": [],
    "organizations": []
  },
  "contactMatch": {
    "found": false,
    "matchedName": null,
    "suggestedName": null,
    "confidence": 0,
    "reason": null
  },
  "corrections": [],
  "actionItems": [],
  "suggestedTags": [],
  "summary": "今天和施嘉琪在瑞幸咖啡厅一起写代码"
}

## 提取规则
1. **人物**：识别文本中所有人名，判断是否是已知联系人
2. **时间**：提取相对时间（今天、明天）和绝对时间（下午3点、2024年1月）
3. **地点**：识别具体场所名称（如"瑞幸的咖啡厅"）、城市、国家
4. **事件**：提取核心活动，如"写代码"、"开会"、"吃饭"等
5. **置信度**：对每个提取结果给出0-1的置信度分数
6. **上下文**：保留提取内容的原始上下文

## 重要规则
1. 只输出JSON，不要任何解释文字
2. 确保JSON格式完整，所有字段都存在（没有内容用空数组或null）
3. 不要输出markdown代码块
4. 如果文本信息不完整，合理推断但降低置信度`;
};
```

---

## 实施步骤

### Step 1: 修改 `services/ai/llmAnalyzer.ts`

1. **添加新的类型定义**
   ```typescript
   export interface EntityExtractionResult {
     reasoning: string;
     entities: {
       persons: PersonEntity[];
       time: TimeEntity | null;
       location: LocationEntity | null;
       event: EventEntity | null;
       needs: NeedEntity[];
       preferences: PreferenceEntity[];
       health: HealthEntity[];
       suggestions: SuggestionEntity[];
       organizations: OrganizationEntity[];
     };
     contactMatch: ContactMatchResult;
     corrections: Correction[];
     actionItems: ActionItem[];
     suggestedTags: string[];
     summary: string;
   }
   ```

2. **替换 `buildAnalysisPrompt`**
   - 使用上面设计的新 Prompt
   - 包含完整的实体提取要求

3. **更新 `parseLLMResult`**
   - 解析新的实体提取格式
   - 转换为应用内部使用的数据结构

### Step 2: 修改 `services/ai/entityExtractor.ts`

完全替换静态提取逻辑：

```typescript
export const extractEntities = async (
  text: string, 
  contacts: Contact[] = []
): Promise<ExtractionResult> => {
  // 使用 LLM 进行实体提取
  const llmResult = await analyzeWithLLM(text, contacts);
  
  if (!llmResult) {
    // LLM 失败时返回空结果
    return {
      entities: [],
      actionItems: [],
      contactName: undefined,
    };
  }
  
  // 转换 LLM 结果为应用格式
  const entities: ExtractedEntity[] = [
    ...llmResult.entities.persons.map(p => ({
      type: 'person' as const,
      value: p.name,
      confidence: p.confidence || 0.8,
      context: text,
    })),
    ...(llmResult.entities.location ? [{
      type: 'location' as const,
      value: llmResult.entities.location.name,
      confidence: llmResult.entities.location.confidence || 0.8,
      context: text,
    }] : []),
    // ... 其他实体类型
  ];
  
  return {
    entities,
    actionItems: llmResult.actionItems,
    contactName: llmResult.entities.persons[0]?.name,
  };
};
```

### Step 3: 更新调用方

修改所有调用 `extractEntities` 的地方，传入联系人列表：

```typescript
// 之前
const result = await extractEntities(text);

// 之后
const result = await extractEntities(text, contacts);
```

---

## 验证测试

### 测试用例 1
**输入**: "今天和施嘉琪一起去写了代码在瑞幸的咖啡厅"

**期望输出**:
```json
{
  "entities": {
    "persons": [{"name": "施嘉琪", "isContact": false}],
    "time": {"value": "今天", "type": "relative"},
    "location": {"name": "瑞幸的咖啡厅", "type": "venue"},
    "event": {"name": "写代码", "type": "activity", "participants": ["施嘉琪"]}
  }
}
```

### 测试用例 2
**输入**: "明天下午3点和王总在星巴克见面，讨论项目合作"

**期望提取**:
- 时间：明天下午3点
- 人物：王总
- 地点：星巴克
- 事件：讨论项目合作

---

## Success Criteria

- [ ] LLM Prompt 能够正确提取所有类型的实体
- [ ] 完全移除静态正则匹配逻辑
- [ ] 所有测试用例通过
- [ ] 性能可接受（有缓存机制）
- [ ] 错误处理完善（LLM 失败时有回退方案）

---

## 注意事项

1. **性能考虑**：LLM 调用比正则慢，需要：
   - 缓存机制（相同文本不重复调用）
   - 异步处理
   - 超时控制

2. **错误处理**：
   - LLM 可能返回无效 JSON
   - 需要健壮的错误处理和重试机制
   - 可以保留简单的正则作为最后回退

3. **成本考虑**：
   - 监控 LLM API 调用次数
   - 考虑本地模型 vs 云端模型

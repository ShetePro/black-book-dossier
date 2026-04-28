# 计划：LLM 推理过程可视化与智能标签生成

## 背景
当前 `agent-review.tsx` 中的 `analyzeWithLocalLLM` 是占位实现，没有真正的 LLM 推理。用户需要在 AI 分析结果页面看到 LLM 的推理过程和结果。

## 目标
实现 LLM 本地模型的完整推理流程，并在 Agent Review 页面可视化展示推理过程、修正建议和自动生成的标签。

---

## 任务 1: 设计 LLM 推理 Prompt

### 文件
- `services/ai/llmInference.ts` - 添加新的推理函数
- 或新建 `services/ai/llmAnalyzer.ts`

### 功能
创建一个新的函数 `analyzeWithLLM(text: string, contacts: Contact[]): Promise<LLMAnalysisResult>`

### Prompt 设计
```
你是一位智能助手，负责分析语音转录文本并提取关键信息。

## 任务
1. 分析文本中的关键人物
2. 尝试匹配已知联系人
3. 提取活动、偏好、性格特征
4. 生成合适的标签

## 已知联系人列表
{{contactsList}}

## 待分析文本
"{{text}}"

## 输出格式（JSON）
{
  "reasoning": "推理过程描述",
  "contactMatch": {
    "found": false,
    "matchedName": null,
    "suggestedName": "张三",
    "confidence": 0.85,
    "reason": "拼音相似，都是三个字的名字"
  },
  "corrections": [
    {
      "original": "斯加奇",
      "corrected": "张三",
      "type": "name"
    },
    {
      "original": "代碼",
      "corrected": "代码",
      "type": "typo"
    }
  ],
  "insights": {
    "activities": ["写代码"],
    "preferences": ["编程"],
    "personality": ["内向"],
    "profession": "程序员"
  },
  "suggestedTags": ["程序员", "内向", "喜欢编程", "技术爱好者"]
}
```

---

## 任务 2: 实现 LLM 分析服务

### 文件
- 新建 `services/ai/llmAnalyzer.ts`

### 接口定义
```typescript
interface LLMAnalysisResult {
  reasoning: string;
  contactMatch: {
    found: boolean;
    matchedName: string | null;
    suggestedName: string | null;
    confidence: number;
    reason: string;
  };
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'name' | 'typo' | 'grammar';
  }>;
  insights: {
    activities: string[];
    preferences: string[];
    personality: string[];
    profession: string | null;
  };
  suggestedTags: string[];
}

export const analyzeWithLLM = async (
  text: string,
  contacts: Contact[]
): Promise<LLMAnalysisResult> => {
  // 1. 构建 Prompt
  // 2. 调用 llmInference.correctTranscriptionWithLLM 或新函数
  // 3. 解析 JSON 结果
  // 4. 返回结构化数据
};
```

---

## 任务 3: 创建推理过程展示组件

### 文件
- 新建 `components/analysis/LLMReasoningCard.tsx`

### 功能
展示 LLM 的推理过程：
1. **推理链** - 显示 LLM 是如何一步步分析的
2. **联系人匹配** - 显示匹配结果和置信度
3. **文本修正** - 显示错别字修正
4. **洞察提取** - 显示活动、偏好、性格

### 设计
```typescript
interface LLMReasoningCardProps {
  reasoning: string;
  contactMatch: LLMAnalysisResult['contactMatch'];
  corrections: LLMAnalysisResult['corrections'];
  insights: LLMAnalysisResult['insights'];
}
```

---

## 任务 4: 创建智能标签组件

### 文件
- 新建 `components/analysis/SuggestedTags.tsx`

### 功能
1. 显示 LLM 建议的标签
2. 用户可以点击添加/删除标签
3. 支持自定义输入新标签
4. 一键应用到联系人

### 设计
- 标签云展示
- 颜色根据标签类型区分（职业、性格、兴趣等）
- 添加动画效果

---

## 任务 5: 更新 Agent Review 页面

### 文件
- `app/(views)/agent-review.tsx`

### 修改
1. **替换占位实现** - 修改 `analyzeWithLocalLLM` 函数
   ```typescript
   const analyzeWithLocalLLM = async (text: string) => {
     const result = await analyzeWithLLM(text, contacts);
     return {
       entities: convertToEntities(result), // 转换格式
       actionItems: extractActionItems(result),
       contactName: result.contactMatch.suggestedName,
       llmResult: result, // 保存完整结果用于展示
     };
   };
   ```

2. **添加状态** - 存储 LLM 分析结果
   ```typescript
   const [llmAnalysis, setLlmAnalysis] = useState<LLMAnalysisResult | null>(null);
   ```

3. **展示推理卡片** - 在分析结果区域添加
   ```typescript
   {llmAnalysis && (
     <LLMReasoningCard {...llmAnalysis} />
   )}
   ```

4. **展示标签建议** - 添加标签组件
   ```typescript
   {llmAnalysis?.suggestedTags && (
     <SuggestedTags 
       tags={llmAnalysis.suggestedTags}
       onApply={(tags) => applyTagsToContact(tags)}
     />
   )}
   ```

---

## 任务 6: 添加应用到联系人的功能

### 文件
- `app/(views)/agent-review.tsx`

### 功能
将 LLM 分析的结果（标签、洞察）应用到选中的联系人：
```typescript
const applyInsightsToContact = async (contactId: string, insights: Insights) => {
  // 1. 添加标签
  // 2. 更新备注/描述
  // 3. 保存到数据库
};
```

---

## UI 布局设计

### Agent Review 页面新布局
```
┌─────────────────────────────────┐
│ 转录文本                         │
│ "斯加奇今天写了一中午的代码..."  │
├─────────────────────────────────┤
│ 🤖 LLM 推理过程                 │
│ ├─ 联系人匹配                   │
│ │  "斯加奇" → 可能是 "张三"  │
│ ├─ 文本修正                     │
│ │  "代碼" → "代码"              │
│ └─ 情境分析                     │
│    活动: 写代码                 │
│    性格: 内向                   │
├─────────────────────────────────┤
│ 🏷️ 建议标签                     │
│ [程序员] [内向] [喜欢编程] [+自定义]│
├─────────────────────────────────┤
│ 📊 实体识别                      │
│ [人物] [时间] [活动] ...        │
├─────────────────────────────────┤
│ 👤 匹配联系人                    │
│ 张三 (85% 匹配)               │
└─────────────────────────────────┘
```

---

## 依赖条件
- LLM 本地模型已下载并启用
- `settings.ai.localModel.enabled` 为 true
- 有足够的存储空间运行 LLM

---

## 错误处理
1. **LLM 不可用** - 显示提示让用户下载模型
2. **LLM 推理失败** - 回退到规则引擎，并显示警告
3. **JSON 解析失败** - 使用正则提取关键信息

---

## 验收标准
- [ ] LLM 能够正确分析文本并返回结构化结果
- [ ] 推理过程可视化展示
- [ ] 联系人匹配建议显示
- [ ] 文本修正建议显示
- [ ] 标签建议可以一键应用到联系人
- [ ] 当 LLM 不可用时优雅降级到规则引擎

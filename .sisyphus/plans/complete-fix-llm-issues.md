# 完整修复方案

## 问题总结

1. **LLM 返回异常**：重复 "输出格式"，JSON 被截断
2. **组件类型不匹配**：期望 `entities`，实际 `insights`
3. **实体提取失败**：类型不兼容

## 修复策略

保持使用旧类型 `LLMAnalysisResult`，只简化 Prompt。

## 修改文件

### 1. services/ai/llmAnalyzer.ts

**目标**：简化 Prompt，保持旧类型

```typescript
const buildAnalysisPrompt = (text: string, contacts: Contact[]): string => {
  const contactsList = contacts.map(c => c.name).join(', ');

  return `分析这段文本，返回JSON：${text}

联系人：${contactsList || '无'}

返回格式：
{"reasoning":"","contactMatch":{"found":false,"matchedName":null,"suggestedName":null,"confidence":0,"reason":""},"corrections":[],"insights":{"activities":[],"preferences":[],"personality":[],"profession":null},"suggestedTags":[]}

只返回JSON，不要其他内容。`;
};
```

### 2. components/analysis/LLMReasoningCard.tsx

**目标**：使用旧的 `insights` 字段，添加空值保护

```typescript
const renderInsights = () => {
  const { insights } = result;
  
  // 添加空值保护
  if (!insights) return null;
  
  const hasInsights = insights.activities?.length > 0 || 
                      insights.preferences?.length > 0 || 
                      insights.personality?.length > 0 ||
                      insights.profession;

  if (!hasInsights) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="bulb" size={18} color="#c9a962" />
        <ThemedText style={styles.sectionTitle}>情境分析</ThemedText>
      </View>
      <View style={styles.insightsCard}>
        {insights.profession && (
          <View style={styles.insightRow}>
            <ThemedText style={styles.insightLabel}>职业:</ThemedText>
            <View style={styles.tagBadge}>
              <ThemedText style={styles.tagText}>{insights.profession}</ThemedText>
            </View>
          </View>
        )}
        
        {insights.activities?.length > 0 && (
          <View style={styles.insightRow}>
            <ThemedText style={styles.insightLabel}>活动:</ThemedText>
            <View style={styles.tagsRow}>
              {insights.activities.map((activity, i) => (
                <View key={i} style={styles.tagBadge}>
                  <ThemedText style={styles.tagText}>{activity}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {insights.preferences?.length > 0 && (
          <View style={styles.insightRow}>
            <ThemedText style={styles.insightLabel}>偏好:</ThemedText>
            <View style={styles.tagsRow}>
              {insights.preferences.map((pref, i) => (
                <View key={i} style={styles.tagBadge}>
                  <ThemedText style={styles.tagText}>{pref}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {insights.personality?.length > 0 && (
          <View style={styles.insightRow}>
            <ThemedText style={styles.insightLabel}>性格:</ThemedText>
            <View style={styles.tagsRow}>
              {insights.personality.map((trait, i) => (
                <View key={i} style={[styles.tagBadge, styles.personalityTag]}>
                  <ThemedText style={styles.tagText}>{trait}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
```

### 3. services/ai/entityExtractor.ts

**目标**：保持使用静态正则，不依赖 LLM

```typescript
export const extractEntities = async (text: string): Promise<ExtractionResult> => {
  const entities: ExtractedEntity[] = [];
  const actionItems: ActionItem[] = [];
  
  // 提取人物（简化版）
  const namePattern = /([\u4e00-\u9fa5]{2,4})/g;
  let match;
  while ((match = namePattern.exec(text)) !== null) {
    if (match[0].length >= 2 && match[0].length <= 4) {
      entities.push({
        type: 'person',
        value: match[0],
        confidence: 0.7,
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  }
  
  // 提取时间
  const datePattern = /(今天|明天|后天|昨天|\d{1,2}月\d{1,2}日|\d{4}年)/g;
  while ((match = datePattern.exec(text)) !== null) {
    entities.push({
      type: 'date',
      value: match[1],
      confidence: 0.8,
      context: text,
    });
  }
  
  // 提取地点
  const locationPattern = /(在|去|到)([\u4e00-\u9fa5]{2,8})(?:的|里|处|)/g;
  while ((match = locationPattern.exec(text)) !== null) {
    entities.push({
      type: 'location',
      value: match[2],
      confidence: 0.75,
      context: text,
    });
  }
  
  const personEntities = entities.filter((e) => e.type === 'person');
  const contactName = personEntities[0]?.value;
  
  return {
    entities,
    actionItems,
    contactName,
  };
};
```

### 4. app/(views)/agent-review.tsx

**目标**：修复 analyzeWithLocalLLM 使用旧类型

```typescript
const analyzeWithLocalLLM = async (text: string) => {
  console.log('[AgentReview] Using LLM analyzer for analysis');
  const result = await analyzeWithLLM(text, contacts);
  console.log(result, '大模型分析');
  setLlmAnalysis(result);

  // Convert LLM result to AnalyzedData format
  const entities: ExtractedEntity[] = [];

  // Add contact entity if matched
  if (result.contactMatch.found || result.contactMatch.suggestedName) {
    entities.push({
      type: 'person',
      value: result.contactMatch.suggestedName || result.contactMatch.matchedName || '',
      confidence: result.contactMatch.confidence,
      context: result.contactMatch.reason,
    });
  }

  // Add activity entities from insights
  if (result.insights?.activities) {
    result.insights.activities.forEach(activity => {
      entities.push({
        type: 'event',
        value: activity,
        confidence: 0.8,
      });
    });
  }

  // Add preference entities
  if (result.insights?.preferences) {
    result.insights.preferences.forEach(pref => {
      entities.push({
        type: 'preference',
        value: pref,
        confidence: 0.75,
      });
    });
  }

  return {
    entities,
    actionItems: [],
    contactName: result.contactMatch.suggestedName || result.contactMatch.matchedName || undefined,
  };
};
```

## 执行步骤

1. 恢复所有文件到 clean 状态
2. 应用上述修改
3. 测试验证

## 预期结果

- LLM 返回简洁有效的 JSON
- 组件正确显示 insights 数据
- 实体提取正常工作

# 实现自动联系人处理逻辑

## 需求

1. **如果没有匹配到联系人** → 提取人名，新建联系人
2. **如果匹配到联系人** → 在现有联系人上添加活动记录

## 当前代码分析

在 `app/(views)/agent-review.tsx` 中：

1. `analyzeWithLocalLLM` - 使用 LLM 分析，返回 `contactMatch`
2. `handleCreateNewContact` - 跳转到新建联系人页面
3. `handleAddToExisting` - 跳转到现有联系人页面（需要 selectedContactId）
4. `handleAutoInteractionConfirm` - 自动创建交往记录

## 实现方案

### 方案：根据匹配结果自动路由

修改分析完成后的处理逻辑，根据 `contactMatch` 自动决定下一步：

```typescript
// 在分析完成后
const handleAnalysisComplete = async (result: LLMAnalysisResult) => {
  const { contactMatch } = result;
  
  if (contactMatch.found && contactMatch.matchedName) {
    // 匹配到现有联系人 - 直接跳转到联系人详情页并添加记录
    const matchedContact = contacts.find(c => c.name === contactMatch.matchedName);
    if (matchedContact) {
      // 自动创建交往记录或跳转到详情页
      router.push({
        pathname: '/(views)/contact/[id]',
        params: {
          id: matchedContact.id,
          transcription,
          entities: JSON.stringify(analyzedData?.entities),
          mode: 'append', // 追加模式
        }
      });
    }
  } else if (contactMatch.suggestedName) {
    // 未匹配到，但有提取到的人名 - 跳转到新建联系人
    router.push({
      pathname: '/(views)/contact/new',
      params: {
        name: contactMatch.suggestedName, // 预填充人名
        transcription,
        entities: JSON.stringify(analyzedData?.entities),
      }
    });
  } else {
    // 没有提取到人名 - 显示选择界面让用户决定
    // 保持当前逻辑
  }
};
```

### 具体实现步骤

#### 步骤 1：添加自动路由函数

在 `agent-review.tsx` 中添加：

```typescript
const handleSmartRouting = async (result: LLMAnalysisResult) => {
  const { contactMatch, insights } = result;
  
  // 提取活动信息
  const activities = insights?.activities || [];
  
  if (contactMatch.found && contactMatch.matchedName) {
    // 高置信度匹配到现有联系人
    const matchedContact = contacts.find(c => c.name === contactMatch.matchedName);
    if (matchedContact) {
      console.log('[AgentReview] Auto-routing to existing contact:', matchedContact.name);
      
      // 可选：直接自动创建交往记录
      if (activities.length > 0) {
        // 自动创建记录
        await createInteractionForContact(matchedContact, activities, transcription);
      }
      
      // 跳转到联系人详情
      router.push({
        pathname: '/(views)/contact/[id]',
        params: {
          id: matchedContact.id,
          mode: 'view',
        }
      });
      return;
    }
  }
  
  if (contactMatch.suggestedName || (contactMatch.confidence > 0 && contactMatch.confidence < 0.7)) {
    // 有建议的人名但未匹配，或低置信度匹配
    const suggestedName = contactMatch.suggestedName || contactMatch.matchedName;
    console.log('[AgentReview] Auto-routing to create new contact:', suggestedName);
    
    router.push({
      pathname: '/(views)/contact/new',
      params: {
        name: suggestedName,
        transcription,
        activities: JSON.stringify(activities),
      }
    });
    return;
  }
  
  // 默认：显示选择界面
  console.log('[AgentReview] Showing manual selection UI');
};

const createInteractionForContact = async (
  contact: Contact, 
  activities: string[], 
  note: string
) => {
  try {
    // 创建交往记录
    const interaction = {
      id: Date.now().toString(),
      contactId: contact.id,
      date: new Date().toISOString(),
      type: 'voice',
      content: note,
      activities: activities,
      createdAt: Date.now(),
    };
    
    // 添加到联系人
    await addInteraction(contact.id, interaction);
    console.log('[AgentReview] Auto-created interaction for:', contact.name);
  } catch (error) {
    console.error('[AgentReview] Failed to create interaction:', error);
  }
};
```

#### 步骤 2：修改分析完成后的调用

在 `analyzeWithLocalLLM` 函数末尾调用 `handleSmartRouting`：

```typescript
const analyzeWithLocalLLM = async (text: string) => {
  // ... 现有代码 ...
  
  const result = await analyzeWithLLM(text, contacts);
  setLlmAnalysis(result);
  
  // 自动路由
  handleSmartRouting(result);
  
  return {
    entities,
    actionItems: [],
    contactName: result.contactMatch.matchedName || result.contactMatch.suggestedName,
  };
};
```

## 预期效果

1. **完全匹配**（confidence >= 0.9）
   - LLM 提取："施嘉琪"
   - 匹配到：联系人 "施嘉琪"
   - 结果：自动跳转到联系人详情页，可选自动创建交往记录

2. **低置信度匹配**（0.7 <= confidence < 0.9）
   - LLM 提取："史佳琪"
   - 模糊匹配：联系人 "施嘉琪"（相似度 0.8）
   - 结果：跳转到新建联系人页面，预填充 "史佳琪"

3. **未匹配**（confidence < 0.7）
   - LLM 提取："张三"
   - 无匹配联系人
   - 结果：跳转到新建联系人页面，预填充 "张三"

## 执行命令

```bash
/start-work implement-auto-contact-routing
```

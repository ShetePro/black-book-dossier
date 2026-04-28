# 修复计划：LLM 联系人姓名匹配

## 问题描述
语音识别将 "张三" 误识别为 "施迦奇"，但 LLM 修正功能没有正确匹配到联系人。

## 根本原因分析
1. `postProcessor.ts` 调用 `correctTranscriptionWithLLM()` 时**没有传递联系人上下文**
2. 虽然 `buildCorrectionPrompt()` 设计了 `contacts` 参数，但实际调用时传入的是空对象 `{}`
3. LLM 根本不知道应该匹配哪个联系人姓名

## 代码位置
- **问题文件**: `services/transcription/postProcessor.ts` 第 110 行
- **缺失功能**: `services/transcription/nameMatcher.ts` 缺少获取联系人列表的方法

## 当前代码（有问题的）
```typescript
// postProcessor.ts 第 110 行
const llmResult = await correctTranscriptionWithLLM(corrected); // ❌ 无上下文
```

## 修复方案

### 任务 1: 添加获取联系人姓名的方法 ✅ 已完成
**文件**: `services/transcription/nameMatcher.ts`

在 `ContactNameMatcher` 类中添加方法：
```typescript
/**
 * 获取所有已加载的联系人姓名
 * @returns 联系人姓名列表
 */
getNames(): string[] {
  return [...this.names];
}
```

### 任务 2: 修改 LLM 调用，传递联系人上下文 ✅ 已完成
**文件**: `services/transcription/postProcessor.ts`

修改第 108-116 行：
```typescript
if (useLLM && await isLLMAvailable()) {
  console.log('[TranscriptionEnhancer] Applying LLM correction...');
  
  // 获取联系人列表传递给 LLM
  const contactNames = this.contactsLoaded ? this.matcher.getNames() : [];
  const { settings } = useSettingsStore.getState();
  
  const llmResult = await correctTranscriptionWithLLM(corrected, {
    contacts: contactNames,
    language: settings.language,
  });
  
  if (llmResult.success && llmResult.text) {
    finalText = llmResult.text;
    llmApplied = true;
    console.log('[TranscriptionEnhancer] LLM correction applied');
  }
}
```

### 任务 3: 优化 LLM Prompt ✅ 已完成
**文件**: `services/ai/llmInference.ts`

优化 `buildCorrectionPrompt()` 函数，更明确地指示 LLM 匹配联系人：
```typescript
const buildCorrectionPrompt = (
  text: string,
  context: LLMContext
): string => {
  const contactsList = context.contacts?.join(', ') || '';
  const vocabList = context.vocabulary?.join(', ') || '';
  const language = context.language === 'en-US' ? 'English' : 'Chinese';

  return `你是一位语音识别纠错专家。请修正以下语音转录文本中的错误。

重要指令：
1. **联系人姓名匹配（最高优先级）** - 如果文本中出现与已知联系人相似的名字（同音字、近音字、形近字），必须修正为正确的联系人姓名
2. 修正语音识别错误（同音字、近音字混淆）
3. 修正语法，使文本更通顺
4. 将口语转换为书面语
5. 保持原意不变，不添加原文没有的信息
6. 只输出修正后的文本，不要解释

已知联系人列表：${contactsList}
专业词汇：${vocabList}
语言：${language}

待修正文本：
"${text}"

修正后文本：`;
};
```

## 验证步骤
1. 在联系人中添加 "张三"
2. 语音输入："施迦奇今天写了一中午的代码"
3. 预期结果：LLM 应该将 "施迦奇" 修正为 "张三"
4. 日志中应显示：传递了联系人列表给 LLM

## 影响范围
- `services/transcription/nameMatcher.ts` - 添加新方法 ✅
- `services/transcription/postProcessor.ts` - 修改 LLM 调用 ✅
- `services/ai/llmInference.ts` - 优化 Prompt ✅

## 依赖条件
- LLM 本地模型需要已下载并启用
- 设置中 `settings.ai.localModel.enabled` 必须为 true

## 状态
**✅ 已完成** - 2026-04-05

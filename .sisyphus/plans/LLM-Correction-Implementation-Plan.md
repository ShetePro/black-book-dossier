# LLM 修正功能实现计划

## 目标
为语音识别后的文本添加 LLM（本地大语言模型）修正功能，提高转录准确性。

## 背景
- 当前只有基于规则的字符串匹配修正（联系人姓名、行业词汇）
- 已集成 llama.rn 库用于本地 LLM 推理
- 已有模型管理器（llmModelManager.ts）支持下载和管理模型

## 当前修正流程
```
Whisper 语音识别 (原始文本)
    ↓
TranscriptionEnhancer (postProcessor.ts)
    ↓
ContactNameMatcher (nameMatcher.ts)
    ↓
Similarity 算法 (similarity.ts)
    ↓
修正后的文本
```

## 新的修正流程（增加 LLM）
```
Whisper 语音识别 (原始文本)
    ↓
TranscriptionEnhancer (postProcessor.ts)
    ├── 1. 基于规则的快速修正（现有）
    │   ├── 联系人姓名匹配
    │   ├── 职位后缀变体
    │   └── 行业词汇
    │
    └── 2. LLM 深度修正（新增）
        ├── 同音字纠正
        ├── 语法纠错
        ├── 口语转书面语
        └── 上下文理解
    ↓
最终修正文本
```

## 实现步骤

### 任务 0: 更新设置存储（前置任务）
**文件**: `store/settingsStore.ts`

**修改内容**:
1. 在 `ai.localModel` 中添加 `modelId` 字段（存储当前选择的模型 ID）
2. 修改默认值为推荐的模型（qwen2.5-0.5b）
3. 更新 `AppSettings` 接口定义

**代码修改**:
```typescript
// 添加 modelId 字段
localModel: {
  enabled: boolean;
  downloaded: boolean;
  modelId: string;           // 新增：模型 ID
  modelName: string;
  modelSize: number;
  version: string;
}

// 更新默认值
localModel: {
  enabled: false,
  downloaded: false,
  modelId: "qwen2.5-0.5b",   // 推荐模型 ID
  modelName: "Qwen 2.5 (0.5B)",
  modelSize: 350,
  version: "1.0",
}
```

**依赖**: 任务 0 完成后，其他任务才能正确获取模型 ID

### 任务 1: 创建 LLM 推理服务
**文件**: `services/ai/llmInference.ts`

**功能**:
- 根据设置中的 `modelId` 初始化对应 LLM 上下文（使用 llama.rn）
- 构建转录修正的 Prompt
- 执行 LLM 推理
- 处理结果并返回

**依赖**:
- llama.rn（已安装）
- llmModelManager.ts（已有）

**接口设计**:
```typescript
interface LLMResult {
  success: boolean;
  text?: string;
  error?: string;
  tokensUsed?: number;
}

export const correctTranscriptionWithLLM = async (
  text: string,
  context?: LLMContext
): Promise<LLMResult>

export const quickCorrect = async (text: string): Promise<string>

export const isLLMAvailable = async (): Promise<boolean>
```

**核心实现逻辑**:
```typescript
// 从设置获取当前模型 ID
const { settings } = useSettingsStore.getState();
const modelId = settings.ai.localModel.modelId as ModelId;

// 使用 modelId 获取模型路径
const modelPath = getModelPath(modelId);

// 初始化 LLM
const { LlamaContext } = await import('llama.rn');
llmContext = await LlamaContext.init({
  model: modelPath,
  useMetal: true,
  n_ctx: 2048,
});
```

**模型切换处理**:
- 当设置中的 `modelId` 变化时，需要重新初始化 LLM
- 缓存机制：如果 modelId 未变，复用现有上下文
- 错误处理：如果指定模型未下载，返回错误并提示用户

**Prompt 设计**:
```
You are a speech recognition text correction assistant...
[详细说明修正要求]
[提供联系人列表上下文]
[提供行业词汇上下文]
[输出格式要求]
```

### 任务 2: 更新 TranscriptionEnhancer
**文件**: `services/transcription/postProcessor.ts`

**修改内容**:
1. 添加 LLM 推理的调用逻辑
2. 在规则修正之后调用 LLM 修正
3. 支持配置是否启用 LLM（性能考虑）
4. 处理 LLM 超时和错误回退

**流程**:
```typescript
enhance(text: string): EnhancementResult {
  // 1. 规则修正（快速）
  const ruleBasedResult = this.matcher.correctText(text);
  
  // 2. LLM 修正（深度）- 可选
  if (this.llmEnabled && isLLMAvailable()) {
    const llmResult = await correctTranscriptionWithLLM(
      ruleBasedResult.corrected,
      { contacts: this.contacts }
    );
    if (llmResult.success) {
      return { ...ruleBasedResult, enhancedText: llmResult.text };
    }
  }
  
  return ruleBasedResult;
}
```

### 任务 3: 集成到 useRecorder Hook
**文件**: `hooks/useRecorder.ts`

**修改**:
1. 确保联系人数据加载
2. 配置是否启用 LLM 修正（基于设置）
3. 显示 LLM 修正进度（可选）

### 任务 4: 添加设置选项
**文件**: `store/settingsStore.ts`, `app/(views)/settings.tsx`

**新增设置项**:
```typescript
ai: {
  transcription: {
    useLLMCorrection: boolean;  // 启用 LLM 修正
    llmCorrectionThreshold: number;  // 何时使用 LLM（可选）
  }
}
```

### 任务 5: 性能优化
**考虑点**:
- LLM 推理较慢（可能 1-3 秒），需要异步处理
- 短文本可能不需要 LLM 修正（节省资源）
- 提供用户开关，在设置中关闭 LLM 以加快速度
- 考虑使用流式输出显示修正进度

## 技术细节

### LLM 模型选择
根据设置中的 `ai.localModel.modelId` 动态选择模型：

**支持的模型**:
- `qwen2.5-0.5b`（推荐）- 中文优化，350MB
- `tinyllama-1.1b` - 英文优化，600MB
- `llama-3.2-1b` - 多语言，800MB
- 其他模型...

**模型切换逻辑**:
```typescript
// 获取设置中的模型 ID
const { settings } = useSettingsStore.getState();
const modelId = settings.ai.localModel.modelId as ModelId;

// 检查模型是否已下载
const isDownloaded = await isModelDownloaded(modelId);
if (!isDownloaded) {
  throw new Error(`Model ${modelId} not downloaded`);
}

// 使用对应模型路径
const modelPath = getModelPath(modelId);
```

**不同模型的处理**:
- 中文文本 → 优先使用 Qwen 模型
- 英文文本 → 可使用 TinyLlama 或 Llama
- 多语言 → 使用 Llama 3.2 或 Gemma

### Prompt 工程
需要针对不同模型调整 Prompt：
- 准确性：能正确纠正常见错误
- 速度：不要生成过多内容
- 稳定性：输出格式一致

### 错误处理
- LLM 初始化失败 → 回退到规则修正
- LLM 推理超时 → 使用原始文本
- 模型未下载 → 提示用户下载

## 依赖安装
```bash
# 确保 llama.rn 已安装
npm install llama.rn

# iOS 需要额外配置
npx pod-install
```

## 更新 AI 模型选择页面
**文件**: `app/(views)/ai-models.tsx`

**修改内容**:
当用户选择/启用模型时，同时更新 `modelId`：
```typescript
// 启用模型时
await updateSetting('ai.localModel.enabled', true);
await updateSetting('ai.localModel.modelId', selectedModel);  // 新增
await updateSetting('ai.localModel.modelName', AVAILABLE_MODELS[selectedModel].name);
await updateSetting('ai.localModel.modelSize', AVAILABLE_MODELS[selectedModel].size);
```

## 测试计划
1. 测试中文语音识别修正（使用 Qwen 模型）
2. 测试英文语音识别修正（使用 Llama/TinyLlama）
3. 测试联系人姓名纠错
4. 测试同音字纠正
5. 测试口语转书面语
6. 测试模型切换功能
7. 性能测试（不同模型的推理延迟）

## 预期效果
- 同音字错误率降低 70%+
- 语法错误自动修正
- 口语化表达转为规范书面语
- 保持原有语义不变

## 交付物
1. **修改** `store/settingsStore.ts` - 添加 `modelId` 字段（任务 0）
2. **修改** `app/(views)/ai-models.tsx` - 启用模型时保存 `modelId`
3. **创建** `services/ai/llmInference.ts` - LLM 推理服务
4. **修改** `services/transcription/postProcessor.ts` - 集成 LLM
5. **修改** `hooks/useRecorder.ts` - 调用逻辑
6. **修改** `app/(views)/settings.tsx` - 设置界面（LLM 开关）
7. **更新** 翻译文件 - 新增设置项翻译

## 时间估算
- 任务 0-1（设置更新 + AI 模型页面）: 30 分钟
- 任务 2（LLM 推理服务）: 1 小时
- 任务 3-5（集成 + 设置）: 1 小时
- 测试：30 分钟
- **总计：3 小时**

## 运行 /start-work
执行 `/start-work` 开始实施此计划。

# Draft: AI 模型切换问题修复

## 问题描述
在设置中的 AI 模型管理页面，已下载的模型无法切换选中使用的模型。

## 问题分析

通过代码审查发现，问题出在 `app/(views)/ai-models.tsx` 文件中的 `getEnabledModelId()` 函数：

**当前实现（有 bug）：**
```typescript
const getEnabledModelId = (): ModelId | null => {
  if (!settings.ai.localModel.enabled) return null;
  const enabledModel = models.find(m => m.name === settings.ai.localModel.modelName);
  return enabledModel?.id || null;
};
```

**问题原因：**
1. 当用户启用模型时，`handleEnable()` 正确设置了 `ai.localModel.modelId`
2. 但是 `getEnabledModelId()` 没有优先使用 `modelId`，而是通过 `modelName` 查找
3. 通过 name 查找不可靠，因为 name 可能重复或不匹配

## 修复方案

修改 `getEnabledModelId()` 函数，优先使用存储的 `modelId`：

```typescript
const getEnabledModelId = (): ModelId | null => {
  if (!settings.ai.localModel.enabled) return null;
  // 优先使用存储的 modelId，如果无效则回退到通过 name 查找
  const storedModelId = settings.ai.localModel.modelId;
  if (storedModelId && AVAILABLE_MODELS[storedModelId]) {
    return storedModelId;
  }
  // 兼容旧数据：通过 name 查找
  const enabledModel = models.find(m => m.name === settings.ai.localModel.modelName);
  return enabledModel?.id || null;
};
```

## 修改位置
- 文件：`app/(views)/ai-models.tsx`
- 行号：第 131-136 行

## 测试步骤
1. 打开设置 -> AI 模型管理
2. 下载至少两个模型
3. 点击第一个模型，启用它
4. 返回列表，应该显示该模型为"当前使用"
5. 点击第二个模型，启用它
6. 返回列表，应该切换到第二个模型为"当前使用"
7. 第一个模型应该不再显示"当前使用"

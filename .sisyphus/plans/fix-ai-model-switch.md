# 修复 AI 模型管理切换功能

## TL;DR

修复 AI 模型管理页面已下载模型无法切换选中使用模型的问题。

**问题根源**：`getEnabledModelId()` 函数没有优先使用存储的 `modelId`，而是通过 `modelName` 查找，导致切换不生效。

**修复方案**：修改函数逻辑，优先使用 `settings.ai.localModel.modelId`。

---

## Context

### 问题现象
- 在设置 > AI 模型管理页面
- 用户下载多个模型后
- 无法切换当前使用的模型
- 点击"启用模型"后，列表中显示的"当前使用"标记不更新

### 代码分析

**问题位置**：`app/(views)/ai-models.tsx` 第 131-136 行

**当前有 bug 的实现**：
```typescript
const getEnabledModelId = (): ModelId | null => {
  if (!settings.ai.localModel.enabled) return null;
  const enabledModel = models.find(m => m.name === settings.ai.localModel.modelName);
  return enabledModel?.id || null;
};
```

**问题原因**：
1. `handleEnable()` 正确设置了 `ai.localModel.modelId`
2. 但 `getEnabledModelId()` 没有使用 `modelId`，而是通过 `modelName` 查找
3. `modelName` 查找不可靠，可能存在匹配问题

### 相关代码

**启用模型的代码**（工作正常）：
```typescript
const handleEnable = async () => {
  if (selectedModel) {
    await updateSetting('ai.localModel.enabled', true);
    await updateSetting('ai.localModel.modelId', selectedModel);  // ✅ 正确设置
    await updateSetting('ai.localModel.modelName', AVAILABLE_MODELS[selectedModel].name);
    await updateSetting('ai.localModel.modelSize', AVAILABLE_MODELS[selectedModel].size);
  }
};
```

---

## Work Objectives

### Core Objective
修复 AI 模型管理页面的模型切换功能，确保用户可以正常切换已下载的模型。

### Concrete Deliverables
- 修改 `app/(views)/ai-models.tsx` 中的 `getEnabledModelId()` 函数
- 优先使用 `settings.ai.localModel.modelId` 获取当前模型
- 兼容旧数据（通过 name 回退查找）

### Definition of Done
- [ ] 修复后的代码可以正确显示当前启用的模型
- [ ] 用户可以在多个已下载模型之间正常切换
- [ ] 兼容旧版本数据的查找逻辑

### Must Have
- 优先使用 `modelId` 确定当前模型
- 兼容旧数据（modelId 不存在时回退到 name 查找）

### Must NOT Have
- 不影响其他功能
- 不修改 UI 组件
- 不修改服务层逻辑

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: NO（不需要，UI 交互修复）
- **Agent-Executed QA**: YES

### QA Policy
通过 Playwright 验证修复效果。

---

## Execution Strategy

### Parallel Execution Waves

这是一个单文件、单行数的小修复，直接执行。

```
Wave 1 (唯一 Wave):
└── Task 1: 修复 getEnabledModelId 函数逻辑
```

### Agent Dispatch Summary

- **1**: **1** - T1 → `quick`

---

## TODOs

- [ ] 1. 修复 getEnabledModelId 函数

  **What to do**:
  - 打开文件 `app/(views)/ai-models.tsx`
  - 找到第 131-136 行的 `getEnabledModelId` 函数
  - 修改函数实现，优先使用 `settings.ai.localModel.modelId`
  - 保留兼容旧数据的逻辑

  **具体修改**：
  ```typescript
  // 旧代码（删除）
  const getEnabledModelId = (): ModelId | null => {
    if (!settings.ai.localModel.enabled) return null;
    const enabledModel = models.find(m => m.name === settings.ai.localModel.modelName);
    return enabledModel?.id || null;
  };

  // 新代码（替换为）
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

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - 这是一个简单的单行逻辑修改

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Sequential**: 唯一任务
  - **Blocks**: 无
  - **Blocked By**: 无

  **Acceptance Criteria**:
  - [ ] 代码修改完成
  - [ ] TypeScript 类型检查通过 (`npx tsc --noEmit`)
  - [ ] ESLint 检查通过 (`npm run lint`)

  **QA Scenarios**:

  ```
  Scenario: 模型切换功能正常工作
    Tool: Playwright
    Preconditions: 应用已启动，至少下载两个 AI 模型
    Steps:
      1. 导航到设置 > AI 模型管理
      2. 点击第一个已下载模型卡片
      3. 点击"启用模型"按钮
      4. 关闭详情弹窗
      5. 验证第一个模型显示"当前使用"标记
      6. 点击第二个已下载模型卡片
      7. 点击"启用模型"按钮
      8. 关闭详情弹窗
      9. 验证第二个模型显示"当前使用"标记
      10. 验证第一个模型不再显示"当前使用"标记
    Expected Result: 可以正常切换模型，标记正确显示
    Evidence: .sisyphus/evidence/task-1-model-switch.png
  ```

  **Commit**: YES
  - Message: `fix(ai-models): 修复模型切换功能`
  - Files: `app/(views)/ai-models.tsx`
  - Pre-commit: `npm run lint && npx tsc --noEmit`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  检查代码修改是否符合计划。
  Output: `VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  运行 `npx tsc --noEmit` 和 `npm run lint`。
  Output: `Type Check [PASS/FAIL] | Lint [PASS/FAIL]`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  使用 Playwright 验证模型切换功能。
  Output: `Scenario [PASS/FAIL]`

---

## Commit Strategy

- **1**: `fix(ai-models): 修复模型切换功能` - app/(views)/ai-models.tsx, lint + type check

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit        # Expected: 无错误
npm run lint            # Expected: 无错误
```

### Final Checklist
- [ ] 代码修改完成
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] QA 场景验证通过

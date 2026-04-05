# 更新模型下载提示 UI 计划

## 当前问题
`recording.tsx` 中使用的是简单的内联弹窗，而不是精美的 `ModelDownloadSheet` 组件。

## 目标
用 `ModelDownloadSheet` 组件替换 `recording.tsx` 中的简单下载确认弹窗。

## 实施步骤

### 任务 1: 导入 ModelDownloadSheet 组件
**文件**: `app/(views)/recording.tsx`

在 imports 部分添加：
```typescript
import { ModelDownloadSheet } from '@/components/ui/ModelDownloadSheet';
```

### 任务 2: 替换内联弹窗
**文件**: `app/(views)/recording.tsx` (约第 427-454 行)

**当前代码**:
```tsx
{showDownloadConfirm && (
  <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
    <Text style={[styles.confirmTitle, { color: colors.text }]}>
      {t('aiModels.downloadModelTitle')}
    </Text>
    <Text style={[styles.confirmMessage, { color: colors.textMuted }]}>
      {t('aiModels.downloadModelWifi', { size: formatFileSize(getModelInfo().size * 1024 * 1024) })}
    </Text>
    <View style={styles.confirmButtons}>
      <TouchableOpacity
        style={[styles.confirmButton, { borderColor: colors.border }]}
        onPress={handleDownloadCancel}
      >
        <Text style={[styles.confirmButtonText, { color: colors.text }]}>
          {t('common.cancel')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: colors.primary }]}
        onPress={handleDownloadConfirm}
      >
        <Text style={[styles.confirmButtonText, { color: '#0a0a0a' }]}>
          {t('aiModels.downloadModel')}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

**替换为**:
```tsx
<ModelDownloadSheet
  visible={showDownloadConfirm}
  title={t('aiModels.downloadModelTitle')}
  message={t('aiModels.downloadModelWifi', { size: formatFileSize(getModelInfo().size * 1024 * 1024) })}
  size={formatFileSize(getModelInfo().size * 1024 * 1024)}
  isDownloading={isCheckingModel}
  progress={modelDownloadProgress}
  onConfirm={handleDownloadConfirm}
  onCancel={handleDownloadCancel}
/>
```

### 任务 3: 添加进度状态
**文件**: `app/(views)/recording.tsx`

确保有 `modelDownloadProgress` 状态：
```typescript
const [modelDownloadProgress, setModelDownloadProgress] = useState(0);
```

在下载过程中更新进度：
```typescript
const handleDownloadConfirm = async () => {
  setIsCheckingModel(true);
  setShowDownloadConfirm(false);
  
  try {
    const result = await downloadModel(currentModelId, (progress) => {
      setModelDownloadProgress(progress.percentage / 100);
    });
    // ...
  } catch (error) {
    // ...
  }
};
```

### 任务 4: 清理旧样式
**文件**: `app/(views)/recording.tsx`

删除不再使用的样式：
- `confirmContainer`
- `confirmTitle`
- `confirmMessage`
- `confirmButtons`
- `confirmButton`
- `confirmButtonText`

## 预期结果
- 使用精美的 iOS Liquid Glass 风格弹窗
- 显示下载进度条
- 符合暗夜金奢主题
- 动画效果流畅

## 运行 /start-work
执行 `/start-work` 开始实施此计划。

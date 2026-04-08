# 添加手动文本输入功能

## 需求描述
在现有语音输入的基础上，添加手动文本输入功能，允许用户直接输入文本进行活动记录和分析，而不需要录音。

## 用户场景
用户可能有以下需求：
1. 在安静环境中，不方便语音输入
2. 需要快速记录，不想等待语音转录
3. 已经有文字内容，直接粘贴输入
4. 更精确地控制输入内容

## 设计方案

### UI 设计

#### 1. 首页修改 (app/(tabs)/index.tsx)
**当前状态**：
- 一个大的麦克风按钮

**修改方案**：
- 在麦克风按钮旁边添加一个文本输入图标按钮
- 两个按钮并排显示，或使用 Tab 切换
- 文本输入按钮使用 `create-outline` 图标

**布局选项**：
- **选项 A**：两个按钮并排（推荐）
  ```
  [麦克风按钮] [文本输入按钮]
  ```
- **选项 B**：Tab 切换
  ```
  [语音] [文本]
  大按钮区域
  ```

#### 2. 文本输入界面

**方案 A：底部弹窗（推荐）**
- 从底部弹出
- 包含文本输入框
- 快捷提示词
- 提交按钮

**方案 B：新页面**
- 跳转到新页面
- 更大的输入空间
- 可能影响流畅性

#### 3. 分析流程
文本输入后：
1. 提取文本
2. 调用 AI 分析（与语音流程相同）
3. 跳转到 agent-review 页面
4. 显示分析结果

## 实现步骤

### Step 1: 创建文本输入组件
**文件**：`components/ui/TextInputSheet.tsx`

**功能**：
- 底部弹窗组件
- 多行文本输入框
- 字数统计（最大 500 字）
- 快捷提示按钮
- 提交按钮
- 关闭按钮

**Props**：
```typescript
interface TextInputSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}
```

**UI 元素**：
- 标题："文本输入"
- 提示文字："输入活动描述，AI 将自动提取信息并匹配联系人"
- 占位符："例如：昨天下午和张三在奥体中心打篮球，聊得很开心"
- 快捷提示：['打篮球', '喝咖啡', '开会']
- 字数统计：{text.length}/500
- 提交按钮："开始分析" + 发送图标

**样式**：
- 背景遮罩：bg-black/50
- 弹窗背景：bg-surface
- 圆角：rounded-t-3xl
- 输入框背景：bg-background
- 提交按钮：bg-primary (active) / bg-elite-muted/20 (disabled)

### Step 2: 修改首页
**文件**：`app/(tabs)/index.tsx`

**修改点**：
1. 添加状态管理：
   ```typescript
   const [showTextInput, setShowTextInput] = useState(false);
   ```

2. 修改麦克风按钮布局：
   - 将单个麦克风按钮改为并排的两个按钮
   - 左边：麦克风按钮（语音输入）
   - 右边：文本输入按钮

3. 添加文本输入按钮：
   ```typescript
   <TouchableOpacity
     onPress={() => setShowTextInput(true)}
     className="w-20 h-20 rounded-full bg-surface border border-primary items-center justify-center"
   >
     <Ionicons name="create-outline" size={32} color={colors.primary} />
   </TouchableOpacity>
   ```

4. 添加文本输入弹窗：
   ```typescript
   <TextInputSheet
     visible={showTextInput}
     onClose={() => setShowTextInput(false)}
     onSubmit={handleTextSubmit}
   />
   ```

5. 实现提交处理：
   ```typescript
   const handleTextSubmit = (text: string) => {
     // 跳转到 agent-review，传递文本
     router.push({
       pathname: "/(views)/agent-review",
       params: { text, mode: 'text' }
     });
   };
   ```

### Step 3: 修改 agent-review 页面
**文件**：`app/(views)/agent-review.tsx`

**修改点**：
1. 接收文本参数：
   ```typescript
   const { text, mode } = useLocalSearchParams<{ text: string; mode?: 'voice' | 'text' }>();
   ```

2. 根据模式调整 UI：
   - 语音模式：显示音频播放器
   - 文本模式：直接显示文本（无音频）

3. AI 分析流程保持不变

### Step 4: 更新国际化
**文件**：`i18n/locales/zh-CN.json` 和 `i18n/locales/en-US.json`

**添加翻译**：
```json
{
  "textInput": {
    "title": "文本输入",
    "hint": "输入活动描述，AI 将自动提取信息并匹配联系人",
    "placeholder": "例如：昨天下午和张三在奥体中心打篮球，聊得很开心",
    "submit": "开始分析",
    "quickHints": {
      "basketball": "打篮球",
      "coffee": "喝咖啡",
      "meeting": "开会"
    }
  }
}
```

## 技术要点

### 动画
- 使用 react-native-reanimated
- 进入动画：FadeInUp.springify()
- 退出动画：FadeOutDown.springify()

### 键盘处理
- 使用 KeyboardAvoidingView
- iOS 使用 'padding' behavior
- Android 使用 'height' behavior

### 状态管理
- 文本内容：useState
- 焦点状态：useState（用于边框高亮）
- 弹窗显示：useState（父组件控制）

### 导航
- 使用 expo-router
- 传递参数：router.push({ pathname, params })
- 接收参数：useLocalSearchParams

## 文件清单

### 新增文件
1. `components/ui/TextInputSheet.tsx` - 文本输入弹窗组件

### 修改文件
1. `app/(tabs)/index.tsx` - 首页，添加文本输入按钮和弹窗
2. `app/(views)/agent-review.tsx` - 分析页面，支持文本模式
3. `i18n/locales/zh-CN.json` - 中文翻译
4. `i18n/locales/en-US.json` - 英文翻译

## 测试要点

### 功能测试
- [ ] 点击文本输入按钮，弹窗正常显示
- [ ] 输入文本，字数统计正确
- [ ] 点击快捷提示，文本正确追加
- [ ] 提交按钮禁用状态正确（空文本时禁用）
- [ ] 提交后跳转到 agent-review 页面
- [ ] agent-review 正确显示文本和分析结果
- [ ] 点击遮罩或关闭按钮，弹窗正确关闭

### UI 测试
- [ ] 弹窗动画流畅
- [ ] 键盘弹出时布局正确
- [ ] 输入框焦点状态边框高亮
- [ ] 长文本滚动正常
- [ ] 字数限制生效（500 字）

### 边界测试
- [ ] 空文本提交（应被阻止）
- [ ] 最大字数限制（500 字）
- [ ] 快速连续点击按钮
- [ ] 键盘收起后再打开
- [ ] 旋转屏幕后状态保持

## 验收标准

1. **用户可以通过文本输入记录活动**
   - 输入文本
   - 点击提交
   - 看到 AI 分析结果

2. **UI 美观流畅**
   - 动画平滑
   - 布局合理
   - 符合应用整体风格

3. **功能完整**
   - 支持文本输入
   - 支持快捷提示
   - 支持字数限制
   - 支持键盘适配

4. **代码质量**
   - TypeScript 类型安全
   - 组件可复用
   - 代码结构清晰

## 预期效果

用户在首页看到两个按钮：
- 左边：麦克风按钮（语音输入）
- 右边：文本输入按钮（文本输入）

点击文本输入按钮后：
1. 底部弹出文本输入弹窗
2. 用户输入文本
3. 点击"开始分析"
4. 跳转到 agent-review 页面
5. 显示 AI 分析结果

整个过程流畅自然，与语音输入形成互补。
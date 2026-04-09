# 重新设计输入界面

## 问题描述
当前设计：首页显示两个按钮（语音 + 文本）太丑
期望设计：参考 LLM 软件，一个添加入口，进入后中间大输入框，旁边切换语音/键盘

## 新设计方案

### 1. 首页修改
**当前**：麦克风按钮 + 文本输入按钮并排
**新设计**：
- 一个圆形 "+" 添加按钮（金色，奢华风格）
- 点击后进入新的 InputScreen 页面

### 2. 新建输入页面
**文件**：`app/(views)/input/index.tsx`

**布局**：
```
┌─────────────────────────────┐
│  ← 返回        新建记录      │
├─────────────────────────────┤
│                             │
│     [大输入框区域]          │
│     多行文本输入            │
│     占位符：描述你的活动...  │
│                             │
│                             │
├─────────────────────────────┤
│  快捷提示：[打篮球][咖啡][开会]│
├─────────────────────────────┤
│                             │
│  [🎤 语音输入]  [⌨️ 键盘输入] │
│                             │
│     圆形发送按钮            │
│                             │
└─────────────────────────────┘
```

**交互逻辑**：
1. 默认显示键盘输入模式
2. 点击语音按钮切换到语音录制模式
3. 语音录制时显示波形动画
4. 录制完成自动转文本填入输入框
5. 点击发送按钮跳转到 agent-review

### 3. 输入页面功能

**键盘模式**：
- 大输入框（多行，最大 500 字）
- 字数统计
- 快捷提示按钮
- 发送按钮

**语音模式**：
- 大圆形录音按钮
- 波形动画
- 录音时长显示
- 上滑取消提示
- 录制完成后自动转文本并填入输入框
- 自动切换回键盘模式

**切换方式**：
- 底部 Tab 切换：键盘 | 语音
- 或左右滑动切换
- 切换时保持已输入的内容

### 4. 技术实现

**文件结构**：
```
app/(views)/input/
├── index.tsx          # 主输入页面
├── KeyboardInput.tsx  # 键盘输入组件
├── VoiceInput.tsx     # 语音输入组件
└── InputToolbar.tsx   # 底部工具栏（切换按钮）
```

**状态管理**：
```typescript
const [inputMode, setInputMode] = useState<'keyboard' | 'voice'>('keyboard');
const [text, setText] = useState('');
const [isRecording, setIsRecording] = useState(false);
```

**流程**：
1. 首页点击 "+" 按钮 → router.push('/(views)/input')
2. InputScreen 默认显示键盘模式
3. 用户输入文本或切换语音录制
4. 点击发送 → 携带 text 跳转到 agent-review
5. agent-review 分析文本

### 5. UI 设计细节

**颜色**：
- 背景：深色主题（bg-void）
- 输入框：bg-surface，圆角大
- 按钮：金色 primary
- 发送按钮：大圆形，金色

**动画**：
- 页面进入：FadeIn
- 模式切换：滑动动画
- 录音按钮：脉冲动画

**尺寸**：
- 输入框：最小高度 200px
- 发送按钮：64px 圆形
- 切换按钮：底部固定

### 6. 代码实现步骤

#### Step 1: 修改首页
**文件**：`app/(tabs)/index.tsx`

**修改**：
1. 移除原有的麦克风和文本输入按钮
2. 添加新的 "+" 添加按钮（圆形，金色）
3. 点击跳转到 `/(views)/input`

#### Step 2: 创建输入页面
**文件**：`app/(views)/input/index.tsx`

**实现**：
1. 页面布局和状态管理
2. 键盘输入组件
3. 语音输入组件
4. 模式切换逻辑
5. 发送按钮处理

#### Step 3: 创建子组件
**文件**：
- `components/input/KeyboardInputMode.tsx`
- `components/input/VoiceInputMode.tsx`
- `components/input/ModeSwitcher.tsx`

#### Step 4: 修改 agent-review
**文件**：`app/(views)/agent-review.tsx`

**修改**：
- 确保能接收 text 参数
- 文本模式下不显示音频播放器

### 7. 文件清单

**修改文件**：
1. `app/(tabs)/index.tsx` - 首页，改为单个添加按钮
2. `app/(views)/agent-review.tsx` - 支持文本模式（已完成）

**新建文件**：
1. `app/(views)/input/index.tsx` - 输入页面主文件
2. `components/input/KeyboardInputMode.tsx` - 键盘输入组件
3. `components/input/VoiceInputMode.tsx` - 语音输入组件
4. `components/input/ModeSwitcher.tsx` - 模式切换组件

### 8. 验收标准

- [x] 首页显示一个漂亮的 "+" 添加按钮
- [x] 点击进入输入页面
- [x] 输入页面有中间大输入框
- [x] 底部可以切换键盘/语音模式
- [x] 语音录制完成后自动填入文本
- [x] 点击发送跳转到分析页面
- [x] 整体 UI 美观，动画流畅
- [x] 符合应用现有设计风格

## 注意事项

1. 保留原有的语音录制功能（复用 useRecorder hook）
2. 输入页面参考 ChatGPT/Claude 等 LLM 软件的输入界面
3. 确保文本输入和语音输入可以无缝切换
4. 保持已输入内容不丢失
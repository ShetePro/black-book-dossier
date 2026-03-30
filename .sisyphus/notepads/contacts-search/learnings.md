# 搜索功能实现学习笔记

## 实现概述
在 contacts.tsx 中实现了完整的联系人搜索功能，包括：

### 功能特性
1. **搜索栏点击展开** - 点击占位搜索栏展开全屏搜索界面
2. **实时搜索** - 使用 `useContactSearch` hook，内置 300ms 防抖
3. **搜索结果高亮展示** - 复用 `ContactList` 组件展示结果
4. **清空搜索** - 输入框右侧显示清除按钮
5. **无结果空状态** - 自定义 `SearchEmptyState` 组件
6. **搜索结果点击跳转** - 点击联系人跳转到详情页

### 技术实现

#### 动画效果（react-native-reanimated）
- `searchExpandProgress`: 控制搜索界面展开/关闭的共享值
- `searchOverlayStyle`: 搜索覆盖层淡入淡出 + 点击事件控制
- `searchBarExpandStyle`: 搜索栏轻微缩放效果
- `searchInputContainerStyle`: 搜索输入框从上滑入动画

#### 依赖处理技巧
由于 `handleContactPress` 需要在 `closeSearch` 定义之前使用，采用 ref 模式：
```typescript
const closeSearchRef = useRef<(() => void) | null>(null);
// 在 handleContactPress 中使用 closeSearchRef.current?.()
// 在 useEffect 中同步 closeSearch 到 ref
```

#### Hook 使用
```typescript
const { results, isSearching, query, setQuery } = useContactSearch();
// 自动处理防抖（300ms）
// 自动调用 store 的 searchContacts 方法
```

### UI 设计
- 保持现有深色主题风格（background: #0a0a0a）
- 金色强调色（primary: #c9a962）用于取消按钮
- 搜索覆盖层 zIndex: 100 确保在最上层
- 搜索头部 paddingTop: 60 适配 SafeArea

### 样式定义
新增样式：
- `searchOverlay`: 全屏覆盖层
- `searchHeader`: 搜索头部布局
- `searchInputContainer`: 搜索输入框容器
- `searchInput`: 文本输入框
- `clearButton`: 清空按钮
- `cancelButton`: 取消按钮
- `searchContent`: 搜索结果容器
- `searchEmptyContainer/Title/Subtitle`: 空状态样式

## 遇到的问题
1. **循环依赖**: `handleContactPress` 调用 `closeSearch`，但后者定义在前者之后
   - 解决：使用 ref 模式解耦

2. **未使用导入**: `Pressable` 被导入但未使用
   - 解决：从导入中移除

3. **依赖项问题**: `closeSearch` 依赖 `searchExpandProgress`（共享值）
   - 解决：共享值不需要放入 useCallback 依赖数组

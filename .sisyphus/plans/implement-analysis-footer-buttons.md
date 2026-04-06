# 实现分析结果页底部动态按钮

## 需求

根据匹配结果在页面底部显示不同按钮：
1. **匹配到联系人** → "添加活动" + "取消"
2. **未匹配到联系人** → "创建联系人" + "取消"
3. 点击后将分析数据传递到目标页面

## 当前代码分析

`app/(views)/agent-review.tsx` 结构：
- 使用 `SafeAreaView` 作为容器
- `Animated.ScrollView` 作为主内容区
- `AutoInteractionConfirm` 弹窗显示在底部
- 没有固定的底部操作按钮区域

## 实现方案

### 步骤 1：添加底部按钮组件

在 ScrollView 之后、SafeAreaView 结束之前添加底部按钮区域：

```typescript
{/* 底部操作按钮 */}
{!isAnalyzing && analyzedData && (
  <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
    {llmAnalysis?.contactMatch?.found ? (
      // 匹配到联系人 - 显示"添加活动"
      <>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: colors.surface }]}
          onPress={handleCancelAnalysis}
          activeOpacity={0.8}
        >
          <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonPrimary, { backgroundColor: colors.primary }]}
          onPress={handleAddActivityToContact}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="#0a0a0a" />
          <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>添加活动</Text>
        </TouchableOpacity>
      </>
    ) : (
      // 未匹配到联系人 - 显示"创建联系人"
      <>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: colors.surface }]}
          onPress={handleCancelAnalysis}
          activeOpacity={0.8}
        >
          <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonPrimary, { backgroundColor: colors.primary }]}
          onPress={handleCreateContactWithData}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={20} color="#0a0a0a" />
          <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>创建联系人</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
)}
```

### 步骤 2：添加处理函数

```typescript
// 取消分析
const handleCancelAnalysis = async () => {
  await deleteAudioFile();
  router.back();
};

// 添加活动到已匹配的联系人
const handleAddActivityToContact = async () => {
  if (!llmAnalysis?.contactMatch?.matchedName) {
    Alert.alert('错误', '未找到匹配的联系人');
    return;
  }
  
  const matchedContact = contacts.find(
    c => c.name === llmAnalysis.contactMatch.matchedName
  );
  
  if (!matchedContact) {
    Alert.alert('错误', '联系人不存在');
    return;
  }
  
  // 准备传递的数据
  const activities = llmAnalysis.insights?.activities || [];
  const preferences = llmAnalysis.insights?.preferences || [];
  
  await deleteAudioFile();
  router.push({
    pathname: '/(views)/contact/[id]',
    params: {
      id: matchedContact.id,
      mode: 'addInteraction',
      transcription,
      activities: JSON.stringify(activities),
      preferences: JSON.stringify(preferences),
      summary: analyzedData?.summary,
    }
  });
};

// 创建新联系人并带入数据
const handleCreateContactWithData = async () => {
  const suggestedName = llmAnalysis?.contactMatch?.suggestedName || 
                       analyzedData?.contactName || '';
  
  // 准备传递的数据
  const activities = llmAnalysis?.insights?.activities || [];
  const preferences = llmAnalysis?.insights?.preferences || [];
  
  await deleteAudioFile();
  router.push({
    pathname: '/(views)/contact/new',
    params: {
      name: suggestedName,
      transcription,
      activities: JSON.stringify(activities),
      preferences: JSON.stringify(preferences),
      summary: analyzedData?.summary,
    }
  });
};
```

### 步骤 3：添加样式

```typescript
footer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  paddingHorizontal: 20,
  paddingVertical: 16,
  paddingBottom: 34, // 适配 iPhone 底部安全区域
  gap: 12,
  borderTopWidth: 1,
},
footerButton: {
  flex: 1,
  height: 48,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},
footerButtonPrimary: {
  flex: 1.5,
},
footerButtonText: {
  fontSize: 16,
  fontWeight: '600',
},
footerButtonTextPrimary: {
  color: '#0a0a0a',
},
```

### 步骤 4：修改 ScrollView 底部留白

由于添加了底部固定按钮，需要给 ScrollView 增加底部内边距：

```typescript
<Animated.ScrollView
  style={styles.content}
  contentContainerStyle={[
    styles.contentContainer,
    { paddingBottom: 120 } // 为底部按钮留出空间
  ]}
  showsVerticalScrollIndicator={false}
>
```

## 数据传递结构

### 添加活动时传递的数据

```typescript
{
  id: string,           // 联系人ID
  mode: 'addInteraction', // 模式：添加交往记录
  transcription: string, // 原始语音文本
  activities: string,    // JSON.stringify(活动数组)
  preferences: string,   // JSON.stringify(偏好数组)
  summary: string,       // 分析摘要
}
```

### 创建联系人时传递的数据

```typescript
{
  name: string,          // 预填充的联系人姓名
  transcription: string, // 原始语音文本
  activities: string,    // JSON.stringify(活动数组)
  preferences: string,   // JSON.stringify(偏好数组)
  summary: string,       // 分析摘要
}
```

## 目标页面处理

### 联系人详情页 (contact/[id])

需要支持 `mode: 'addInteraction'`，自动打开添加交往记录的表单并预填充数据。

### 新建联系人页 (contact/new)

需要支持预填充：
- `name` - 姓名
- `activities` - 活动记录
- `preferences` - 偏好信息

## 完整代码修改

需要修改的文件：
1. `app/(views)/agent-review.tsx` - 添加底部按钮和逻辑
2. `app/(views)/contact/[id].tsx` - 支持 mode: 'addInteraction'
3. `app/(views)/contact/new.tsx` - 支持预填充数据

## 执行命令

```bash
/start-work implement-analysis-footer-buttons
```

# 修复实体提取问题

## 问题描述

用户反馈：实体提取不正确

**输入示例**："今天和施嘉琪一起去写了代码在瑞幸的咖啡厅"

**期望输出**：
- 事件：写代码
- 地点：瑞幸的咖啡厅
- 时间：今天
- 人物：施嘉琪

**当前问题**：
1. 地点提取失败（"瑞幸的咖啡厅"没有被识别为地点）
2. 事件提取可能不准确（"写代码"没有被识别为活动）

---

## 问题分析

### 1. 地点提取问题

在 `services/ai/enhancedEntityExtractor.ts` 第 243-247 行，当前的地点模式：

```typescript
const venuePatterns = [
  { pattern: /(\w*)(?:酒店|餐厅|咖啡厅|茶馆|办公室|会议室|家里|公司)/g, subtype: 'venue' as const },
  { pattern: /(在|去|到|从)(.+?)(?:的|里|处|见面|聊)/g, subtype: 'venue' as const },
  { pattern: /(\w*广场|\w*大厦|\w*中心|\w*路\d+号)/g, subtype: 'venue' as const },
];
```

**问题**：
- 无法识别"瑞幸的咖啡厅"（"瑞幸" + "的" + "咖啡厅"的结构）
- 缺少常见的商业场所后缀（如"店"、"馆"等）
- 第二个正则的结束标记太少，导致匹配不完整

### 2. 事件提取问题

在 `services/ai/enhancedEntityExtractor.ts` 第 456-462 行，当前的事件模式：

```typescript
const eventPatterns = [
  { pattern: /(约|安排|组织|准备)(.+?)(?:会议|会面|见面|吃饭|聚会|活动)/g, type: 'meeting' as const },
  { pattern: /(开会|见面|聚餐|谈判|签约|合作|生日|婚礼|葬礼)/g, type: 'activity' as const },
  { pattern: /(\w+)(?:项目|活动|计划|任务)(?:启动|上线|完成|结束)/g, type: 'milestone' as const },
  { pattern: /(出|发生)(.+?)(?:问题|状况|事故|冲突|困难|挑战)/g, type: 'issue' as const },
  { pattern: /(机会|机遇|可能|潜力|前景|合作机会|商机)/g, type: 'opportunity' as const },
];
```

**问题**：
- 没有匹配"写代码"这样的工作/学习活动
- 缺少常见的活动动词（如"写"、"做"、"学"等）

---

## 修复方案

### 修复 1：改进地点提取模式

修改 `extractLocationEntities` 中的 `venuePatterns`：

```typescript
const venuePatterns = [
  // 支持更多场所类型：店、厅、馆、咖啡、奶茶等
  { pattern: /(\w+)(?:酒店|餐厅|咖啡厅|咖啡馆|茶馆|办公室|会议室|家里|公司|店|厅|馆)/g, subtype: 'venue' as const },
  // 改进上下文匹配，支持"在...写/工作"等场景
  { pattern: /(在|去|到|从|于)(.+?)(?:的|里|处|见面|聊|工作|写|学习)/g, subtype: 'venue' as const },
  { pattern: /(\w*广场|\w*大厦|\w*中心|\w*路\d+号)/g, subtype: 'venue' as const },
  // 新增：品牌+场所类型（如"瑞幸咖啡"、"星巴克"）
  { pattern: /(\w+)(?:咖啡|奶茶|快餐|书店|健身房)/g, subtype: 'venue' as const },
];
```

### 修复 2：改进事件提取模式

修改 `extractEventEntities` 中的 `eventPatterns`：

```typescript
const eventPatterns = [
  { pattern: /(约|安排|组织|准备)(.+?)(?:会议|会面|见面|吃饭|聚会|活动)/g, type: 'meeting' as const },
  { pattern: /(开会|见面|聚餐|谈判|签约|合作|生日|婚礼|葬礼)/g, type: 'activity' as const },
  { pattern: /(\w+)(?:项目|活动|计划|任务)(?:启动|上线|完成|结束)/g, type: 'milestone' as const },
  { pattern: /(出|发生)(.+?)(?:问题|状况|事故|冲突|困难|挑战)/g, type: 'issue' as const },
  { pattern: /(机会|机遇|可能|潜力|前景|合作机会|商机)/g, type: 'opportunity' as const },
  // 新增：工作/学习活动
  { pattern: /(写|做|学|练习|开发|研究|阅读|讨论)(.+?)(?:代码|作业|项目|书|技术)/g, type: 'activity' as const },
  // 新增：一般活动动词+内容
  { pattern: /(?:一起|去|来)(.+?)(?:了|过|的)?(?:，|。|在|$)/g, type: 'activity' as const },
];
```

---

## 修改位置

1. **文件**: `services/ai/enhancedEntityExtractor.ts`
   - 第 243-247 行: 修改 `venuePatterns`
   - 第 456-462 行: 修改 `eventPatterns`

---

## 验证测试

测试用例："今天和施嘉琪一起去写了代码在瑞幸的咖啡厅"

**期望提取结果**：
- 时间实体："今天"
- 人物实体："施嘉琪"
- 事件实体："写代码" 或 "一起写代码"
- 地点实体："瑞幸的咖啡厅" 或 "瑞幸咖啡"

---

## Success Criteria

- [ ] 能够正确提取"瑞幸的咖啡厅"作为地点
- [ ] 能够正确提取"写代码"作为事件/活动
- [ ] 不影响其他文本的实体提取

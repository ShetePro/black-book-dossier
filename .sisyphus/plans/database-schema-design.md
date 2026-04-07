# 智能人脉与活动记录 App - 数据库设计

## 项目概述

基于大语言模型（LLM）驱动的智能人脉与活动记录系统，通过自然语言交互无感记录社交/活动轨迹，并利用 AI Agent 进行深度查询、统计分析与关系维护提醒。

## 核心工作流

1. **多模态输入**：文本或语音输入日常活动
2. **LLM 实体抽取**：提取 Who（对象）、When（时间）、Where（地点）、What（事件）
3. **结构化存储**：构建关系网络并更新联系人状态
4. **Agent 智能检索**：自然语言查询转为数据检索

---

## 数据库表结构设计

### 1. 用户表 (users)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 联系人表 (contacts)

```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    avatar_url TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    
    -- 动态状态字段（由触发器自动更新）
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    total_activities INTEGER DEFAULT 0,
    
    -- AI 生成的联系人画像
    ai_summary TEXT,
    preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_contact_per_user UNIQUE (user_id, name)
);

-- 索引
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_last_interaction ON contacts(user_id, last_interaction_at);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
```

### 3. 活动表 (activities)

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基础信息
    title VARCHAR(200) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL, -- basketball, hiking, meeting, etc.
    
    -- 时空信息
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    location_name VARCHAR(200),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- 原始输入（用于溯源）
    raw_input TEXT,
    
    -- AI 分析结果
    ai_analysis JSONB DEFAULT '{}',
    sentiment VARCHAR(20), -- positive, neutral, negative
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(user_id, activity_type);
CREATE INDEX idx_activities_time ON activities(user_id, started_at);
CREATE INDEX idx_activities_location ON activities USING GIN(to_tsvector('chinese', location_name));
```

### 4. 活动参与者关联表 (activity_participants)

```sql
CREATE TABLE activity_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- 参与者在本次活动中的角色/表现
    role VARCHAR(50), -- organizer, participant, etc.
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_participant_per_activity UNIQUE (activity_id, contact_id)
);

-- 索引
CREATE INDEX idx_participants_activity ON activity_participants(activity_id);
CREATE INDEX idx_participants_contact ON activity_participants(contact_id);
```

### 5. 活动类型定义表 (activity_types)

```sql
CREATE TABLE activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL 表示系统默认类型
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    category VARCHAR(50), -- sports, social, work, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_type_per_user UNIQUE (user_id, name)
);

-- 系统默认活动类型
INSERT INTO activity_types (name, icon, color, category) VALUES
('basketball', 'basketball-outline', '#FF6B6B', 'sports'),
('hiking', 'walk-outline', '#4ECDC4', 'sports'),
('meeting', 'people-outline', '#45B7D1', 'work'),
('dinner', 'restaurant-outline', '#FFA07A', 'social'),
('coffee', 'cafe-outline', '#8B4513', 'social'),
('movie', 'film-outline', '#9B59B6', 'entertainment'),
('travel', 'airplane-outline', '#3498DB', 'travel');
```

---

## 触发器与函数

### 1. 自动更新联系人最后互动时间

```sql
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts
    SET last_interaction_at = NEW.started_at,
        total_activities = total_activities + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (
        SELECT contact_id FROM activity_participants WHERE activity_id = NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_interaction
AFTER INSERT ON activities
FOR EACH ROW
EXECUTE FUNCTION update_contact_last_interaction();
```

### 2. 更新联系人活动计数

```sql
CREATE OR REPLACE FUNCTION recalculate_contact_activity_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts
    SET total_activities = (
        SELECT COUNT(*) FROM activity_participants 
        WHERE contact_id = COALESCE(NEW.contact_id, OLD.contact_id)
    )
    WHERE id = COALESCE(NEW.contact_id, OLD.contact_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_count
AFTER INSERT OR DELETE ON activity_participants
FOR EACH ROW
EXECUTE FUNCTION recalculate_contact_activity_count();
```

---

## AI Agent Function Calling 设计

### Tool 1: 查询联系人活动统计

```typescript
const queryContactActivityStats = {
  name: "query_contact_activity_stats",
  description: "统计与特定活动类型相关的联系人数量或列表",
  parameters: {
    type: "object",
    properties: {
      activityTypes: {
        type: "array",
        items: { type: "string" },
        description: "活动类型列表，如 ['basketball', 'hiking']"
      },
      queryType: {
        type: "string",
        enum: ["count", "list", "both"],
        description: "查询类型：统计数量、列出名单、或两者都要"
      },
      timeRange: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" }
        }
      }
    },
    required: ["activityTypes", "queryType"]
  }
};

// SQL 实现
/*
-- 统计数量
SELECT COUNT(DISTINCT contact_id) 
FROM activity_participants ap
JOIN activities a ON ap.activity_id = a.id
WHERE a.user_id = $1 
  AND a.activity_type = ANY($2)
  AND a.started_at BETWEEN $3 AND $4;

-- 列出联系人详情
SELECT c.id, c.name, c.avatar_url, COUNT(*) as activity_count
FROM contacts c
JOIN activity_participants ap ON c.id = ap.contact_id
JOIN activities a ON ap.activity_id = a.id
WHERE c.user_id = $1 
  AND a.activity_type = ANY($2)
GROUP BY c.id, c.name, c.avatar_url
ORDER BY activity_count DESC;
*/
```

### Tool 2: 查询休眠关系

```typescript
const queryDormantContacts = {
  name: "query_dormant_contacts",
  description: "找出超过指定时间未联系的人",
  parameters: {
    type: "object",
    properties: {
      daysThreshold: {
        type: "integer",
        description: "未联系天数阈值",
        default: 90
      },
      limit: {
        type: "integer",
        description: "返回结果数量限制",
        default: 20
      },
      orderBy: {
        type: "string",
        enum: ["last_interaction_desc", "last_interaction_asc"],
        default: "last_interaction_asc"
      }
    },
    required: ["daysThreshold"]
  }
};

// SQL 实现
/*
SELECT 
    c.id,
    c.name,
    c.avatar_url,
    c.last_interaction_at,
    c.total_activities,
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - c.last_interaction_at) as days_since_last
FROM contacts c
WHERE c.user_id = $1
  AND c.last_interaction_at < CURRENT_TIMESTAMP - INTERVAL '$2 days'
ORDER BY c.last_interaction_at ASC
LIMIT $3;
*/
```

### Tool 3: 查询活动历史

```typescript
const queryActivityHistory = {
  name: "query_activity_history",
  description: "查询与特定联系人的活动历史",
  parameters: {
    type: "object",
    properties: {
      contactName: {
        type: "string",
        description: "联系人姓名（支持模糊匹配）"
      },
      activityTypes: {
        type: "array",
        items: { type: "string" },
        description: "筛选特定活动类型"
      },
      limit: {
        type: "integer",
        default: 10
      }
    },
    required: ["contactName"]
  }
};

// SQL 实现
/*
SELECT 
    a.id,
    a.title,
    a.activity_type,
    a.started_at,
    a.location_name,
    a.description
FROM activities a
JOIN activity_participants ap ON a.id = ap.activity_id
JOIN contacts c ON ap.contact_id = c.id
WHERE a.user_id = $1
  AND c.name ILIKE '%' || $2 || '%'
  AND ($3::text[] IS NULL OR a.activity_type = ANY($3))
ORDER BY a.started_at DESC
LIMIT $4;
*/
```

### Tool 4: 自然语言转查询

```typescript
const naturalLanguageQuery = {
  name: "natural_language_query",
  description: "将自然语言问题转换为数据库查询",
  parameters: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "用户的自然语言问题"
      }
    },
    required: ["question"]
  }
};

// 示例问题映射
const questionPatterns = {
  "有多少人和我打过篮球": {
    tool: "query_contact_activity_stats",
    params: { activityTypes: ["basketball"], queryType: "count" }
  },
  "哪些联系人已经超过3个月没有联系了": {
    tool: "query_dormant_contacts",
    params: { daysThreshold: 90 }
  },
  "我和张三最近的活动": {
    tool: "query_activity_history",
    params: { contactName: "张三", limit: 5 }
  }
};
```

---

## 完整查询示例

### 示例 1：统计打过篮球和爬山的联系人

```sql
-- Agent 生成的查询
WITH activity_stats AS (
    SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT a.id) as activity_count,
        ARRAY_AGG(DISTINCT a.activity_type) as activity_types
    FROM contacts c
    JOIN activity_participants ap ON c.id = ap.contact_id
    JOIN activities a ON ap.activity_id = a.id
    WHERE c.user_id = 'user-uuid'
      AND a.activity_type IN ('basketball', 'hiking')
    GROUP BY c.id, c.name
)
SELECT 
    name,
    activity_count,
    activity_types
FROM activity_stats
ORDER BY activity_count DESC;
```

### 示例 2：找出 90 天未联系的联系人

```sql
-- Agent 生成的查询
SELECT 
    c.name,
    c.last_interaction_at,
    c.total_activities,
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - c.last_interaction_at) as days_since_last,
    CASE 
        WHEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - c.last_interaction_at) > 180 THEN '长期未联系'
        WHEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - c.last_interaction_at) > 90 THEN '需要关注'
        ELSE '正常'
    END as alert_level
FROM contacts c
WHERE c.user_id = 'user-uuid'
  AND c.last_interaction_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
ORDER BY c.last_interaction_at ASC
LIMIT 20;
```

---

## API 设计（供 App 使用）

### RESTful API

```typescript
// 创建活动
POST /api/activities
{
  "title": "篮球活动",
  "activityType": "basketball",
  "startedAt": "2024-01-15T14:00:00Z",
  "endedAt": "2024-01-15T16:00:00Z",
  "locationName": "奥体中心",
  "rawInput": "昨天下午和张三在奥体中心打了两个小时篮球",
  "contactIds": ["contact-uuid-1", "contact-uuid-2"]
}

// 查询联系人
GET /api/contacts?dormantDays=90&limit=20

// 统计活动
GET /api/stats/activities?types=basketball,hiking&groupBy=contact

// AI Agent 查询端点
POST /api/agent/query
{
  "question": "有多少人和我打过篮球？"
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "answer": "有 5 个人和你打过篮球",
    "contacts": [
      { "name": "张三", "activityCount": 8 },
      { "name": "李四", "activityCount": 5 }
    ],
    "sql": "SELECT ...",
    "queryTime": "45ms"
  }
}
```

---

## 扩展建议

1. **全文搜索**：使用 PostgreSQL 的 `to_tsvector` 支持活动描述搜索
2. **地理位置**：使用 PostGIS 扩展支持位置查询（附近的人/活动）
3. **图数据库**：如果关系复杂，可迁移到 Neo4j 进行关系分析
4. **缓存层**：使用 Redis 缓存热点查询结果（如休眠关系列表）
5. **时区处理**：所有时间戳使用 `TIMESTAMP WITH TIME ZONE`

---

## 文件位置

`.sisyphus/plans/database-schema-design.md`

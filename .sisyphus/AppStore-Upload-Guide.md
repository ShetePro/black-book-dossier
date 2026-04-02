# App Store Connect 上传指南

## 准备工作

### 1. Apple Developer 账号
- 确保你有有效的 Apple Developer Program 会员资格（$99/年）
- 访问 https://developer.apple.com

### 2. App Store Connect 设置
- 访问 https://appstoreconnect.apple.com
- 登录你的 Apple ID

## 创建新应用

### 步骤 1: 点击"我的 App" -> "+" 按钮

### 步骤 2: 填写应用信息

| 字段 | 值 |
|------|-----|
| 平台 | iOS |
| 应用名称 | Black Book |
| 主要语言 | 中文（简体） |
| Bundle ID | com.blackbook.app |
| SKU | blackbook-001 |
| 用户访问权限 | 完全访问权限 |

### 步骤 3: 填写应用详情

**副标题**: 私密人脉管理

**类别**: 
- 主要：商务
- 次要：效率

**内容版权**: 否

**年龄分级**: 4+

## 上传构建版本

### 方式 1: 使用 Transporter 应用（推荐）

1. 从 Mac App Store 下载 Transporter
2. 打开 Transporter，登录 Apple ID
3. 拖放 IPA 文件到 Transporter
4. 点击"交付"
5. 等待处理完成（可能需要 10-30 分钟）

### 方式 2: 使用命令行

```bash
# 使用 altool 上传
xcrun altool --upload-app \
    -f build/BlackBook.ipa \
    -t ios \
    -u "your-apple-id@example.com" \
    -p "your-app-specific-password"
```

生成 App 专用密码:
1. 访问 https://appleid.apple.com
2. 登录 -> "App 专用密码" -> "生成"

## 填写 App Store 信息

### 版本信息

**版本号**: 1.0.0

**此版本的新增内容**:
```
首个版本发布

- AI 智能语音记录与分析
- CIA 风格联系人档案管理
- 本地优先的隐私保护
- 完整的导入导出功能
```

### 预览和截图

**6.5 英寸显示屏**（必需）:
- 尺寸：1290 x 2796 像素
- 数量：最多 10 张
- 推荐：首页、联系人列表、详情页、录音界面、设置页

**5.5 英寸显示屏**（必需）:
- 尺寸：1242 x 2208 像素
- 数量：最多 10 张

### 宣传文本

**宣传文本**:
AI 驱动的私密人脉管理工具。本地存储，绝对隐私。

**关键词**: 人脉管理,CRM,联系人,关系维护,AI助手,商务社交,客户管理,销售助手

**描述**: 见 .sisyphus/AppStore-Metadata.json

**技术支持网址**: https://github.com/ShetePro/black-book/issues

## 提交审核

### 审核信息

**登录信息**: 无需登录

**联系信息**:
- 姓名：[你的名字]
- 电话：[你的电话]
- 邮箱：[你的邮箱]

**备注**:
```
Black Book 是一款本地优先的人脉管理应用。

重要说明：
1. 所有数据仅存储在用户设备本地，不会上传到任何服务器
2. 已实现账户删除功能（设置 -> 危险区域 -> 紧急销毁数据）
3. 隐私政策已在应用内提供（设置 -> 隐私政策）
4. 应用使用 Face ID / Touch ID 进行生物识别保护
5. 不需要网络连接即可使用核心功能

权限说明：
- 麦克风：用于语音录音功能
- 通讯录：用于导入联系人（可选）
- Face ID：用于应用锁保护
```

### 内容权利

**是否包含第三方内容**: 否

**广告标识符 (IDFA)**: 否

## 提交流程

1. ✅ 构建并上传 IPA
2. ✅ 在 App Store Connect 填写所有必填信息
3. ✅ 上传截图
4. ✅ 填写审核信息
5. ✅ 点击"提交以供审核"

## 审核时间

- 通常：1-3 个工作日
- 首次提交可能需要更长时间

## 审核状态查询

- App Store Connect -> 我的 App -> Black Book -> 活动
- 或通过邮件接收状态更新

## 常见被拒原因及解决方案

### 1. 崩溃或明显 Bug
- 确保在真机上充分测试
- 检查不同 iOS 版本的兼容性

### 2. 权限说明不清晰
- ✅ 已配置多语言权限说明
- 确保权限提示清晰说明用途

### 3. 隐私政策缺失
- ✅ 已在应用内添加隐私政策页面
- 确保可以从应用内访问

### 4. 账户删除功能
- ✅ 已实现 Kill Switch 功能
- 确保可以删除所有用户数据

### 5. 元数据不完整
- 确保应用描述准确
- 截图符合规范
- 关键词不堆砌

## 发布后

### 查看下载数据
App Store Connect -> App 分析

### 用户评论
App Store Connect -> 评分与评论

### 版本更新
1. 修改代码
2. 更新版本号（app.json）
3. 重新构建上传
4. 提交新版本审核

## 参考链接

- [App Store Connect 帮助](https://help.apple.com/app-store-connect/)
- [App Store 审核指南](https://developer.apple.com/app-store/review/guidelines/)
- [iOS 开发文档](https://developer.apple.com/documentation/)

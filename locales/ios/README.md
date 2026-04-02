# iOS 权限提示本地化

本项目支持 iOS 权限提示的多语言显示。

## 文件结构

```
locales/ios/
├── en.lproj/InfoPlist.strings      # 英文（默认）
└── zh-Hans.lproj/InfoPlist.strings # 简体中文
```

## 支持的权限

- `NSContactsUsageDescription` - 通讯录访问权限
- `NSMicrophoneUsageDescription` - 麦克风访问权限
- `NSFaceIDUsageDescription` - Face ID 使用权限

## 使用说明

### 对于 Expo Prebuild 项目

在运行 `expo prebuild` 生成 iOS 原生项目后，需要执行以下步骤：

1. 复制本地化文件到 iOS 项目：

```bash
# 复制英文本地化
mkdir -p ios/blackbook/en.lproj
cp locales/ios/en.lproj/InfoPlist.strings ios/blackbook/en.lproj/

# 复制中文本地化
mkdir -p ios/blackbook/zh-Hans.lproj
cp locales/ios/zh-Hans.lproj/InfoPlist.strings ios/blackbook/zh-Hans.lproj/
```

2. 在 Xcode 中，确保这些文件被添加到项目中，并正确配置本地化。

### 系统语言匹配规则

iOS 会根据用户设备的系统语言自动选择对应的本地化文件：

- 系统语言为 **中文（简体）** → 显示中文提示
- 系统语言为 **其他语言** → 显示英文提示

## 修改权限提示文本

如需修改权限提示文本，请编辑以下文件：

- 英文：`locales/ios/en.lproj/InfoPlist.strings`
- 中文：`locales/ios/zh-Hans.lproj/InfoPlist.strings`

注意：同时需要更新 `app.json` 中的默认权限文本，保持一致性。

## 添加更多语言支持

1. 创建新的语言目录：
   ```bash
   mkdir -p locales/ios/[语言代码].lproj
   ```

2. 复制并翻译 InfoPlist.strings 文件

3. 常见语言代码：
   - `en` - 英文
   - `zh-Hans` - 简体中文
   - `zh-Hant` - 繁体中文
   - `ja` - 日语
   - `ko` - 韩语
   - `fr` - 法语
   - `de` - 德语
   - `es` - 西班牙语

## 参考

- [Apple 本地化文档](https://developer.apple.com/documentation/xcode/localization)
- [InfoPlist.strings 格式](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Introduction/Introduction.html)

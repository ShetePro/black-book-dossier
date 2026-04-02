#!/bin/bash

# iOS App Store 截图脚本
# 使用 Xcode Simulator 自动截图

# 设备列表
# iPhone 15 Pro Max (6.5英寸): iPhone 15 Pro Max
# iPhone 14 Pro Max (6.5英寸): iPhone 14 Pro Max
# iPhone 8 Plus (5.5英寸): iPhone 8 Plus

# 截图场景
SCENES=(
  "home:首页-录音按钮"
  "contacts:联系人列表"
  "contact-detail:联系人详情"
  "recording:录音界面"
  "ai-review:AI分析结果"
  "settings:设置页面"
)

# 创建设备截图目录
mkdir -p screenshots/iPhone-6.5
mkdir -p screenshots/iPhone-5.5

echo "=== Black Book App Store 截图工具 ==="
echo ""
echo "支持的设备:"
echo "1. iPhone 15 Pro Max (6.5英寸)"
echo "2. iPhone 14 Pro Max (6.5英寸)"
echo "3. iPhone 8 Plus (5.5英寸)"
echo ""
echo "截图场景:"
for scene in "${SCENES[@]}"; do
  echo "  - ${scene}"
done
echo ""
echo "使用说明:"
echo "1. 启动 Xcode Simulator"
echo "2. 选择目标设备"
echo "3. 运行应用"
echo "4. 使用 cmd + S 截图"
echo "5. 保存到对应目录"
echo ""
echo "截图尺寸要求:"
echo "- 6.5英寸: 1290 x 2796 像素 (iPhone 15 Pro Max)"
echo "- 5.5英寸: 1242 x 2208 像素 (iPhone 8 Plus)"

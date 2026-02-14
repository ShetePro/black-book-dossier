#!/bin/bash

# SimRun Logo 生成脚本
# 将 SVG 转换为各种尺寸的 PNG

echo "🎨 SimRun Logo 生成器"
echo "======================"

# 检查是否安装了必要工具
if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ 未找到 rsvg-convert"
    echo ""
    echo "请安装 librsvg："
    echo "  macOS: brew install librsvg"
    echo "  Linux: sudo apt-get install librsvg2-bin"
    echo ""
    echo "或使用在线转换工具："
    echo "  https://convertio.co/svg-png/"
    echo ""
    exit 1
fi

SVG_FILE="assets/images/logo.svg"
OUTPUT_DIR="assets/images"

if [ ! -f "$SVG_FILE" ]; then
    echo "❌ 未找到 SVG 文件: $SVG_FILE"
    exit 1
fi

echo "✅ 找到 SVG 文件"
echo ""

# 生成各种尺寸的图标
echo "📐 正在生成图标..."

# 主图标 1024x1024
rsvg-convert -w 1024 -h 1024 "$SVG_FILE" -o "$OUTPUT_DIR/icon.png"
echo "  ✓ icon.png (1024×1024)"

# 启动图标 1024x1024
rsvg-convert -w 1024 -h 1024 "$SVG_FILE" -o "$OUTPUT_DIR/splash-icon.png"
echo "  ✓ splash-icon.png (1024×1024)"

# Android 自适应图标 1024x1024
rsvg-convert -w 1024 -h 1024 "$SVG_FILE" -o "$OUTPUT_DIR/adaptive-icon.png"
echo "  ✓ adaptive-icon.png (1024×1024)"

echo ""
echo "✅ Logo 生成完成！"
echo ""
echo "文件位置:"
echo "  - $OUTPUT_DIR/icon.png"
echo "  - $OUTPUT_DIR/splash-icon.png"
echo "  - $OUTPUT_DIR/adaptive-icon.png"
echo ""
echo "下一步:"
echo "  npx expo prebuild --clean"
echo ""

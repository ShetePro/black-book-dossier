echo "🚀 Black Book iOS Release 构建工具"
echo "=================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f "app.json" ]; then
    echo "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
echo "📱 应用版本: $VERSION"
echo ""

echo "${YELLOW}步骤 1/7: 清理缓存...${NC}"
npx expo start --clear &
EXPO_PID=$!
sleep 5
kill $EXPO_PID 2>/dev/null || true
echo "${GREEN}✓ 缓存清理完成${NC}"
echo ""

echo "${YELLOW}步骤 2/7: 检查依赖...${NC}"
if ! command -v pod &> /dev/null; then
    echo "${RED}错误: 未找到 CocoaPods，请先安装: sudo gem install cocoapods${NC}"
    exit 1
fi

if [ ! -d "ios" ]; then
    echo "${YELLOW}iOS 目录不存在，需要生成原生项目...${NC}"
    npx expo prebuild -p ios --clean
else
    echo "${GREEN}✓ iOS 目录已存在${NC}"
fi
echo ""

echo "${YELLOW}步骤 3/7: 复制本地化文件...${NC}"
if [ -d "locales/ios" ]; then
    mkdir -p ios/blackbook/en.lproj
    mkdir -p ios/blackbook/zh-Hans.lproj
    cp locales/ios/en.lproj/InfoPlist.strings ios/blackbook/en.lproj/ 2>/dev/null || true
    cp locales/ios/zh-Hans.lproj/InfoPlist.strings ios/blackbook/zh-Hans.lproj/ 2>/dev/null || true
    echo "${GREEN}✓ 本地化文件已复制${NC}"
else
    echo "${YELLOW}警告: 未找到本地化文件目录${NC}"
fi
echo ""

echo "${YELLOW}步骤 4/7: 安装 CocoaPods 依赖...${NC}"
cd ios
pod install --repo-update
cd ..
echo "${GREEN}✓ Pods 安装完成${NC}"
echo ""

echo "${YELLOW}步骤 5/7: 检查签名配置...${NC}"
echo "${YELLOW}⚠️ 请确保在 Xcode 中配置了以下签名信息:${NC}"
echo "  • Team ID"
echo "  • Bundle Identifier: com.blackbook.app"
echo "  • Provisioning Profile"
echo ""
read -p "签名配置已完成? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${YELLOW}请在 Xcode 中完成签名配置后再运行此脚本${NC}"
    echo "打开方式: open ios/BlackBook.xcworkspace"
    exit 1
fi
echo "${GREEN}✓ 签名配置确认${NC}"
echo ""

echo "${YELLOW}步骤 6/7: 构建 Archive...${NC}"
echo "${YELLOW}这将使用 Xcode 命令行工具构建 Release 版本${NC}"
echo ""

xcodebuild -workspace ios/BlackBook.xcworkspace \
    -scheme BlackBook \
    -configuration Release \
    -sdk iphoneos \
    -archivePath build/BlackBook.xcarchive \
    archive \
    CODE_SIGN_IDENTITY="iPhone Distribution" \
    DEVELOPMENT_TEAM="YOUR_TEAM_ID" \
    PROVISIONING_PROFILE_SPECIFIER="YOUR_PROFILE_NAME"

if [ $? -ne 0 ]; then
    echo "${RED}错误: 构建失败${NC}"
    echo "${YELLOW}建议使用 Xcode 图形界面构建:${NC}"
    echo "open ios/BlackBook.xcworkspace"
    exit 1
fi

echo "${GREEN}✓ Archive 构建完成${NC}"
echo "  位置: build/BlackBook.xcarchive"
echo ""

echo "${YELLOW}步骤 7/7: 导出 IPA...${NC}"

cat > build/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
    -archivePath build/BlackBook.xcarchive \
    -exportPath build \
    -exportOptionsPlist build/ExportOptions.plist

if [ $? -ne 0 ]; then
    echo "${RED}错误: 导出 IPA 失败${NC}"
    exit 1
fi

echo "${GREEN}✓ IPA 导出完成${NC}"
echo "  位置: build/BlackBook.ipa"
echo ""

echo "${GREEN}🎉 构建完成!${NC}"
echo ""
echo "构建产物:"
ls -lh build/*.ipa 2>/dev/null || echo "  (请检查 build 目录)"
echo ""
echo "${YELLOW}下一步: 上传到 App Store Connect${NC}"
echo "方式 1: 使用 Transporter 应用手动上传"
echo "方式 2: 使用 altool 命令行上传:"
echo "  xcrun altool --upload-app -f build/BlackBook.ipa -t ios -u \"your-apple-id@example.com\" -p \"app-specific-password\""
echo ""
echo "${YELLOW}提示: 首次上传需要在 App Store Connect 中创建应用${NC}"
echo "  https://appstoreconnect.apple.com"

#!/usr/bin/env node

/**
 * SimRun Logo 生成器
 * 使用 sharp 将 SVG 转换为各种尺寸的 PNG
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_FILE = path.join(__dirname, '..', 'assets', 'images', 'logo.svg');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');

const sizes = [
  { name: 'icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'favicon.png', size: 32 },
];

async function generateLogos() {
  console.log('🎨 SimRun Logo 生成器');
  console.log('======================\n');

  // 检查 SVG 文件是否存在
  if (!fs.existsSync(SVG_FILE)) {
    console.error(`❌ 未找到 SVG 文件: ${SVG_FILE}`);
    process.exit(1);
  }

  console.log('✅ 找到 SVG 文件\n');
  console.log('📐 正在生成图标...\n');

  const svgBuffer = fs.readFileSync(SVG_FILE);

  for (const { name, size } of sizes) {
    const outputPath = path.join(OUTPUT_DIR, name);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366F1
        })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ ${name} (${size}×${size})`);
    } catch (err) {
      console.error(`  ❌ ${name} 生成失败:`, err.message);
    }
  }

  console.log('\n✅ Logo 生成完成！');
  console.log('\n文件位置:');
  sizes.forEach(({ name }) => {
    console.log(`  - assets/images/${name}`);
  });
  
  console.log('\n下一步:');
  console.log('  npx expo prebuild --clean');
  console.log('  # 或重新构建应用');
}

generateLogos().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});

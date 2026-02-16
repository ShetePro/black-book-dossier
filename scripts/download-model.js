#!/usr/bin/env node

/**
 * 下载 Whisper 模型文件
 * 用法: node scripts/download-model.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';
const MODEL_FILE_NAME = 'ggml-tiny.bin';
const TARGET_DIR = path.join(__dirname, '..', 'assets', 'models');
const TARGET_PATH = path.join(TARGET_DIR, MODEL_FILE_NAME);

// 文件大小：约 39MB
const EXPECTED_SIZE = 39 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    let downloadedBytes = 0;
    let startTime = Date.now();

    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 重定向
        console.log('Following redirect...');
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'], 10);
      console.log(`Total size: ${formatBytes(totalBytes)}`);
      console.log('');

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        file.write(chunk);

        // 显示进度
        const progress = (downloadedBytes / totalBytes * 100).toFixed(1);
        const speed = downloadedBytes / ((Date.now() - startTime) / 1000);
        const eta = (totalBytes - downloadedBytes) / speed;

        process.stdout.write(
          `\rProgress: ${progress}% | ${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)} | ETA: ${Math.ceil(eta)}s`
        );
      });

      response.on('end', () => {
        file.end();
        console.log('\n\nDownload completed!');
        resolve();
      });

      response.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🎙️  Whisper Model Downloader');
  console.log('============================\n');

  // 检查目录是否存在
  if (!fs.existsSync(TARGET_DIR)) {
    console.log('Creating models directory...');
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // 检查文件是否已存在
  if (fs.existsSync(TARGET_PATH)) {
    const stats = fs.statSync(TARGET_PATH);
    console.log(`Model file already exists: ${formatBytes(stats.size)}`);
    console.log(`Location: ${TARGET_PATH}`);

    // 检查文件大小是否正确
    if (stats.size < EXPECTED_SIZE * 0.9) {
      console.log('\n⚠️  File size seems incorrect. Re-downloading...');
      fs.unlinkSync(TARGET_PATH);
    } else {
      console.log('\n✅ Model is ready to use!');
      process.exit(0);
    }
  }

  console.log('Downloading Whisper tiny model...');
  console.log(`From: ${MODEL_URL}`);
  console.log(`To: ${TARGET_PATH}\n`);

  try {
    await downloadFile(MODEL_URL, TARGET_PATH);
    console.log(`\n✅ Model saved to: ${TARGET_PATH}`);
    console.log('\nNote: The model will be bundled with your app (39MB).');
    console.log('Make sure to run "npx expo prebuild" after downloading.');
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

main();

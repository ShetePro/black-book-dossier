# Vosk 中文语音识别模型

此目录用于存放 Vosk 中文语音识别模型文件。

## 模型下载

请下载 `vosk-model-small-cn-0.22` 模型：

```bash
cd assets/model-cn-cn
wget https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip
unzip vosk-model-small-cn-0.22.zip
mv vosk-model-small-cn-0.22/* .
rm -rf vosk-model-small-cn-0.22 vosk-model-small-cn-0.22.zip
```

## 模型文件结构

解压后应包含以下文件：

```
assets/model-cn-cn/
├── am/
│   └── final.mdl
├── conf/
│   ├── mfcc.conf
│   └── model.conf
├── graph/
│   ├── HCLr.fst
│   ├── Gr.fst
│   ├── phones.txt
│   └── words.txt
├── ivector/
│   ├── final.dubm
│   ├── final.ie
│   ├── final.mat
│   ├── global_cmvn.stats
│   ├── online_cmvn.conf
│   └── splice.conf
└── README
```

## 注意事项

- 模型文件约 42MB，已添加到 .gitignore，不会提交到 Git
- 运行 `npx expo prebuild` 时会自动复制到原生项目
- 首次构建时请确保模型文件已放置在此目录

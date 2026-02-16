import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Paths } from 'expo-file-system';
import { initializeWhisper, transcribeAudio, waitForAllTranscriptions } from '@/services/voice/whisper';

// 流式录音配置 - 延长到 3 秒，给转录更多时间
const CHUNK_DURATION_MS = 3000;
const AUDIO_SAMPLE_RATE = 16000;
const AUDIO_CHANNELS = 1;

export type RecordingStatus = 
  | 'idle' 
  | 'initializing' 
  | 'recording' 
  | 'transcribing' 
  | 'stopping' 
  | 'error';

export interface UseStreamingRecorderReturn {
  status: RecordingStatus;
  isRecording: boolean;
  liveTranscription: string;
  duration: number;
  error: string | null;
  audioLevel: number; // 当前音频电平 (-160 到 0)
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  cancelRecording: () => Promise<void>;
  initialize: () => Promise<void>;
  isModelLoaded: boolean;
}

/**
 * 获取缓存目录（使用新的 FileSystem API）
 */
const getCacheDirectory = (): string => {
  const dir = Paths.cache?.uri;
  if (!dir) {
    throw new Error('Cache directory not available');
  }
  return dir;
};

// 注意：Whisper 层已经实现了队列机制，这里不需要额外的锁

/**
 * 生成唯一文件名（使用时间戳 + 随机数）
 */
const generateUniqueFileName = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `chunk_${timestamp}_${random}.wav`;
};

/**
 * 带重试的文件复制
 */
const copyFileWithRetry = async (from: string, to: string, maxRetries = 3): Promise<void> => {
  const FileSystemLegacy = await import('expo-file-system/legacy');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await FileSystemLegacy.copyAsync({ from, to });
      return;
    } catch (error) {
      console.log(`Copy attempt ${i + 1} failed, retrying...`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms后重试
    }
  }
};

export const useStreamingRecorder = (): UseStreamingRecorderReturn => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [liveTranscription, setLiveTranscription] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(-160); // 音频电平状态

  const recordingRef = useRef<Audio.Recording | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcribeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptionBufferRef = useRef('');
  const tempFilesRef = useRef<string[]>([]); // 记录所有临时文件路径
  const transcribeCurrentChunkRef = useRef<(() => Promise<void>) | null>(null); // 保存最新的函数引用
  const isTranscribingRef = useRef(false); // 防止并发转录

  const initialize = useCallback(async () => {
    try {
      setStatus('initializing');
      await initializeWhisper();
      setIsModelLoaded(true);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to initialize Whisper:', err);
      setError('模型加载失败，请检查网络连接');
      setStatus('error');
    }
  }, []);

  const processChunk = useCallback(async (chunkPath: string, chunkIndex: number) => {
    try {
      console.log(`[Transcribe] =========================================`);
      console.log(`[Transcribe] Processing chunk ${chunkIndex}: ${chunkPath}`);
      const text = await transcribeAudio(chunkPath);
      
      console.log(`[Transcribe] Raw result for chunk ${chunkIndex}: "${text}"`);
      
      if (text && text.trim()) {
        chunksRef.current[chunkIndex] = text.trim();
        
        const fullText = chunksRef.current
          .filter(Boolean)
          .join('，');
        
        console.log(`[Transcribe] Updating liveTranscription with: "${fullText}"`);
        
        setLiveTranscription(fullText);
        transcriptionBufferRef.current = fullText;
        console.log(`[Transcribe] Chunk ${chunkIndex} completed successfully`);
        console.log(`[Transcribe] Full text so far: "${fullText}"`);
      } else {
        console.log(`[Transcribe] Chunk ${chunkIndex} returned empty or whitespace`);
      }
      console.log(`[Transcribe] =========================================`);
    } catch (err) {
      console.error(`[Transcribe] ERROR on chunk ${chunkIndex}:`, err);
    }
    // 注意：文件不在此处删除，统一在录音结束时清理
  }, []);

  const transcribeCurrentChunk = useCallback(async () => {
    console.log('[Transcribe] transcribeCurrentChunk called, isTranscribing:', isTranscribingRef.current);
    
    // 防止并发调用
    if (isTranscribingRef.current) {
      console.log('[Transcribe] SKIP: Already transcribing, scheduling next check');
      // 重新安排下一次检查
      if (recordingRef.current) {
        transcribeTimeoutRef.current = setTimeout(() => {
          transcribeCurrentChunkRef.current?.();
        }, CHUNK_DURATION_MS);
      }
      return;
    }
    
    if (!recordingRef.current) {
      console.log('[Transcribe] No recording available, skipping');
      return;
    }

    isTranscribingRef.current = true;

    try {
      await recordingRef.current.pauseAsync();
      
      const uri = recordingRef.current.getURI();
      if (!uri) {
        await recordingRef.current.startAsync();
        return;
      }

      const cacheDir = getCacheDirectory();
      const chunkDir = `${cacheDir}audio_chunks`;
      
      // 使用唯一文件名避免冲突
      const fileName = generateUniqueFileName();
      const chunkPath = `${chunkDir}/${fileName}`;
      
      // 记录文件路径用于后续清理
      tempFilesRef.current.push(chunkPath);
      console.log(`[Recording] Created temp file: ${chunkPath}`);
      
      // 使用新的 FileSystem API 创建目录
      const { Directory } = await import('expo-file-system');
      const dir = new Directory(chunkDir);
      if (!dir.exists) {
        dir.create();
      }

      // 等待一小段时间确保文件写入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 复制文件使用带重试的函数
      await copyFileWithRetry(uri, chunkPath);

      const currentIndex = chunkIndexRef.current;
      chunkIndexRef.current += 1;

      await recordingRef.current.startAsync();

      // 转录（Whisper 层已处理队列）
      console.log(`[Transcribe] Starting transcription for chunk ${currentIndex}`);
      await processChunk(chunkPath, currentIndex);
      console.log(`[Transcribe] Chunk ${currentIndex} transcription completed`);

    } catch (err) {
      console.error('[Transcribe] Chunk transcription error:', err);
      // 确保录音恢复
      try {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (!status.isRecording) {
            await recordingRef.current.startAsync();
          }
        }
      } catch (resumeErr) {
        console.error('[Transcribe] Failed to resume recording:', resumeErr);
      }
    } finally {
      isTranscribingRef.current = false;
      
      // 安排下一次（在 finally 中确保总是执行）
      if (recordingRef.current) {
        transcribeTimeoutRef.current = setTimeout(() => {
          transcribeCurrentChunkRef.current?.();
        }, CHUNK_DURATION_MS);
      }
    }
  }, [processChunk]);

  // 保存最新的 transcribeCurrentChunk 函数引用，避免 setTimeout 闭包问题
  transcribeCurrentChunkRef.current = transcribeCurrentChunk;

  const startRecording = useCallback(async () => {
    try {
      // 清理之前的录音实例
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
        } catch (e) {
          // 忽略清理错误
        }
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('需要麦克风权限才能录音');
        setStatus('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      chunksRef.current = [];
      chunkIndexRef.current = 0;
      tempFilesRef.current = []; // 清空临时文件记录
      startTimeRef.current = Date.now();
      setLiveTranscription('');
      setDuration(0);
      setAudioLevel(-160);
      setError(null);

      console.log('[Recording] Creating recording instance...');
      const { recording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true, // 启用音频电平监测（iOS 必需）
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: AUDIO_SAMPLE_RATE,
            numberOfChannels: AUDIO_CHANNELS,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: AUDIO_SAMPLE_RATE,
            numberOfChannels: AUDIO_CHANNELS,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        }
      );
      console.log('[Recording] Recording instance created successfully');

      recordingRef.current = recording;
      setStatus('recording');
      
      // 启动音频电平监测（使用轮询方式，兼容 iOS）
      console.log('[Recording] Starting metering polling...');
      let callCount = 0;
      let meteringInterval = setInterval(async () => {
        if (recordingRef.current) {
          try {
            callCount++;
            const status = await recordingRef.current.getStatusAsync();
            
            // 详细诊断日志（前10次调用）
            if (callCount <= 10) {
              console.log(`[Recording-DEBUG] Call #${callCount}:`, {
                isRecording: status.isRecording,
                metering: status.metering,
                meteringType: typeof status.metering,
                durationMillis: status.durationMillis,
                canRecord: status.canRecord,
                isDoneRecording: status.isDoneRecording,
                hasMetering: 'metering' in status,
                fullStatus: JSON.stringify(status).substring(0, 200)
              });
            }
            
            // 每100次调用记录一次（约5秒一次）
            if (callCount % 100 === 0) {
              console.log(`[Recording] Call #${callCount}: metering=${status.metering}, isRecording=${status.isRecording}`);
            }
            
            // 检查 metering 是否存在
            if (status.metering === undefined) {
              if (callCount === 1) {
                console.error('[Recording-ERROR] metering field is undefined! iOS may not support audio metering with current config');
              }
            } else if (status.isRecording) {
              const level = status.metering;
              setAudioLevel(level);
              // 每20次调用记录一次（约1秒一次）
              if (callCount % 20 === 0) {
                console.log(`[Recording] Metering: ${level}dB, Duration: ${status.durationMillis}ms`);
              }
            }
          } catch (e) {
            console.error('[Recording-ERROR] getStatusAsync failed:', e);
          }
        } else {
          console.log('[Recording-DEBUG] No recording ref available');
        }
      }, 50);
      
      // 保存 interval 引用以便清理
      (recordingRef as any).meteringInterval = meteringInterval;

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);

      console.log('[Recording] Scheduling initial transcription');
      transcribeTimeoutRef.current = setTimeout(() => {
        transcribeCurrentChunkRef.current?.();
      }, CHUNK_DURATION_MS);

    } catch (err) {
      console.error('Start recording error:', err);
      setError('启动录音失败');
      setStatus('error');
    }
  }, [transcribeCurrentChunk]);

  const stopRecording = useCallback(async (): Promise<string> => {
    console.log('[Recording] Stopping recording...');
    setStatus('stopping');

    // 清理所有定时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (transcribeTimeoutRef.current) {
      clearTimeout(transcribeTimeoutRef.current);
      transcribeTimeoutRef.current = null;
    }
    
    // 清理音频电平监测
    if ((recordingRef as any).meteringInterval) {
      clearInterval((recordingRef as any).meteringInterval);
      (recordingRef as any).meteringInterval = null;
    }

    try {
      // 等待所有转录任务完成
      console.log('[Recording] Waiting for transcription queue to complete...');
      await waitForAllTranscriptions(10000);

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        console.log('[Recording] Recording stopped and unloaded');
        
        // 等待一小段时间让 iOS 释放文件句柄
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const uri = recordingRef.current.getURI();
        if (uri) {
          const cacheDir = getCacheDirectory();
          const chunkDir = `${cacheDir}audio_chunks`;
          
          // 使用唯一文件名
          const finalFileName = generateUniqueFileName();
          const finalChunkPath = `${chunkDir}/${finalFileName}`;
          tempFilesRef.current.push(finalChunkPath);
          
          // 确保目录存在
          const { Directory } = await import('expo-file-system');
          const dir = new Directory(chunkDir);
          if (!dir.exists) {
            dir.create();
          }
          
          // 使用带重试的文件复制
          console.log('[Recording] Copying final audio file...');
          await copyFileWithRetry(uri, finalChunkPath);
          
          // 转录最终音频（Whisper 层已处理队列）
          console.log('[Recording] Transcribing final chunk...');
          try {
            const finalText = await transcribeAudio(finalChunkPath);
            if (finalText && finalText.trim()) {
              chunksRef.current.push(finalText.trim());
              console.log('[Recording] Final transcription completed');
            } else {
              console.log('[Recording] Final transcription returned empty');
            }
          } catch (transcribeErr) {
            console.error('[Recording] Final transcription error:', transcribeErr);
          }
        }
        
        recordingRef.current = null;
      }

      // 再次等待，确保所有转录任务都已完成
      console.log('[Recording] Final wait for all transcriptions...');
      await waitForAllTranscriptions(5000);

      // 统一清理所有临时文件
      console.log(`[Recording] Cleaning up ${tempFilesRef.current.length} temp files...`);
      const { File } = await import('expo-file-system');
      for (const filePath of tempFilesRef.current) {
        try {
          const file = new File(filePath);
          if (file.exists) {
            file.delete();
            console.log(`[Recording] Deleted: ${filePath}`);
          }
        } catch (cleanupErr) {
          console.log(`[Recording] Failed to delete ${filePath}:`, cleanupErr);
        }
      }
      tempFilesRef.current = [];

      const fullTranscription = chunksRef.current
        .filter(Boolean)
        .join('，');

      setLiveTranscription(fullTranscription);
      setStatus('idle');
      console.log('[Recording] Recording stopped successfully');

      return fullTranscription;

    } catch (err) {
      console.error('[Recording] Stop recording error:', err);
      setError('停止录音失败');
      setStatus('error');
      return transcriptionBufferRef.current;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    // 清理所有定时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (transcribeTimeoutRef.current) {
      clearTimeout(transcribeTimeoutRef.current);
      transcribeTimeoutRef.current = null;
    }
    
    // 清理音频电平监测
    if ((recordingRef as any).meteringInterval) {
      clearInterval((recordingRef as any).meteringInterval);
      (recordingRef as any).meteringInterval = null;
    }

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // 统一清理所有临时文件
      console.log(`[Recording] Canceling - cleaning up ${tempFilesRef.current.length} temp files...`);
      const { File } = await import('expo-file-system');
      for (const filePath of tempFilesRef.current) {
        try {
          const file = new File(filePath);
          if (file.exists) {
            file.delete();
            console.log(`[Recording] Deleted: ${filePath}`);
          }
        } catch (cleanupErr) {
          console.log(`[Recording] Failed to delete ${filePath}:`, cleanupErr);
        }
      }

      chunksRef.current = [];
      chunkIndexRef.current = 0;
      tempFilesRef.current = [];
      setLiveTranscription('');
      setDuration(0);
      setAudioLevel(-160);
      setStatus('idle');
      setError(null);

    } catch (err) {
      console.error('Cancel recording error:', err);
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (transcribeTimeoutRef.current) {
        clearTimeout(transcribeTimeoutRef.current);
      }
      if ((recordingRef as any).meteringInterval) {
        clearInterval((recordingRef as any).meteringInterval);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    status,
    isRecording: status === 'recording' || status === 'transcribing',
    liveTranscription,
    duration,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    initialize,
    isModelLoaded,
  };
};
import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { initializeWhisper, transcribeAudio } from '@/services/voice/whisper';
import { useSettingsStore } from '@/store/settingsStore';
import { useContactStore } from '@/store';
import { getTranscriptionEnhancer } from '@/services/transcription/postProcessor';

/**
 * 将应用语言设置映射到 Whisper 语言代码
 */
const mapLanguageToWhisper = (appLanguage: string): string => {
  const languageMap: Record<string, string> = {
    'cn': 'zh',  // 中文 -> 中文
    'en': 'en',  // 英文 -> 英文
    'auto': 'auto', // 自动检测
  };
  return languageMap[appLanguage] || 'zh';
};

export type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error';

export interface RecordingResult {
  text: string;
  audioUri: string;
}

export interface UseRecorderReturn {
  status: RecordingStatus;
  isRecording: boolean;
  isTranscribing: boolean;
  duration: number;
  error: string | null;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingResult | null>;
  cancelRecording: () => Promise<void>;
}

/**
 * 获取当前录音的电平
 */
const getAudioLevel = async (recording: Audio.Recording): Promise<number> => {
  try {
    const status = await recording.getStatusAsync();
    if (status.isRecording && 'metering' in status && status.metering !== undefined) {
      return status.metering;
    }
    return -160;
  } catch (e) {
    return -160;
  }
};

export const useRecorder = (): UseRecorderReturn => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(-160);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStartingRef = useRef(false);

  const startRecording = useCallback(async () => {
    // 防止重复调用
    if (isStartingRef.current) {
      console.log('[Recorder] Already starting, ignoring duplicate call');
      return;
    }
    
    // 如果已经在录音中，先停止
    if (status === 'recording') {
      console.log('[Recorder] Already recording, stopping first');
      return;
    }
    
    isStartingRef.current = true;
    
    try {
      // 清理之前的录音实例
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // 忽略清理错误
        }
        recordingRef.current = null;
      }

      const { status: permissionStatus } = await Audio.requestPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setError('需要麦克风权限才能录音');
        setStatus('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // 重置状态
      startTimeRef.current = Date.now();
      setDuration(0);
      setAudioLevel(-160);
      setError(null);

      console.log('[Recorder] Creating recording instance...');
      const { recording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
          },
          ios: {
            extension: '.wav',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/wav',
            bitsPerSecond: 256000,
          },
        }
      );

      recordingRef.current = recording;
      setStatus('recording');

      // 启动时长计时
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);

      // 启动音频电平监测（用于波形可视化）
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const level = await getAudioLevel(recordingRef.current);
          setAudioLevel(level);
        }
      }, 50);

    } catch (err) {
      console.error('Start recording error:', err);
      setError('启动录音失败');
      setStatus('error');
    } finally {
      isStartingRef.current = false;
    }
  }, [status]);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    console.log('[Recorder] Stopping recording...');

    // 清理定时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    try {
      if (!recordingRef.current) {
        throw new Error('No recording in progress');
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      recordingRef.current = null;
      
      // 获取当前语言设置
      const { settings } = useSettingsStore.getState();
      const language = mapLanguageToWhisper(settings.language);
      console.log('[Recorder] Using language:', settings.language, '->', language);
      
      // 开始转录
      console.log('[Recorder] Starting transcription...');
      setStatus('transcribing');
      
      const result = await transcribeAudio(uri, language);

      if (!result.success || !result.text) {
        // 转录失败，删除音频文件
        try {
          await FileSystem.deleteAsync(uri);
        } catch (e) {
          console.warn('[Recorder] Failed to delete temp file:', e);
        }
        throw new Error(result.error || 'Transcription failed');
      }

      // 转录后处理：纠正联系人姓名和常用词
      console.log('[Recorder] Enhancing transcription with contact names...');
      const enhancer = getTranscriptionEnhancer();
      
      // 确保联系人数据已加载（方案 A：录音前检查并加载）
      const { contacts, loadContacts } = useContactStore.getState();
      let currentContacts = contacts;
      if (currentContacts.length === 0) {
        console.log('[Recorder] Contacts not loaded, loading now...');
        await loadContacts();
        currentContacts = useContactStore.getState().contacts;
        console.log(`[Recorder] Loaded ${currentContacts.length} contacts`);
      }
      
      const enhancedText = enhancer.quickEnhance(result.text, currentContacts);
      
      if (enhancedText !== result.text) {
        console.log('[Recorder] Enhanced transcription:', {
          original: result.text,
          enhanced: enhancedText,
        });
      }

      setStatus('idle');
      console.log('[Recorder] Transcription complete:', enhancedText);
      return {
        text: enhancedText,
        audioUri: uri,
      };

    } catch (err) {
      console.error('[Recorder] Error:', err);
      setError('转录失败，请重试');
      setStatus('error');
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    // 清理定时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // 重置所有状态
      setDuration(0);
      setAudioLevel(-160);
      setStatus('idle');
      setError(null);
      isStartingRef.current = false;

    } catch (err) {
      console.error('Cancel recording error:', err);
      setStatus('idle');
      isStartingRef.current = false;
    }
  }, []);

  return {
    status,
    isRecording: status === 'recording',
    isTranscribing: status === 'transcribing',
    duration,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};

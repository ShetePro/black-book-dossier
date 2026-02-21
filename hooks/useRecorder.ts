import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { initializeWhisper, transcribeAudio } from '@/services/voice/whisper';

export type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error';

export interface UseRecorderReturn {
  status: RecordingStatus;
  isRecording: boolean;
  isTranscribing: boolean;
  duration: number;
  error: string | null;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
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
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
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
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
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
      
      // 开始转录
      console.log('[Recorder] Starting transcription...');
      setStatus('transcribing');
      
      const result = await transcribeAudio(uri);
      
      // 删除临时录音文件
      try {
        await FileSystem.deleteAsync(uri);
      } catch (e) {
        console.warn('[Recorder] Failed to delete temp file:', e);
      }

      if (!result.success || !result.text) {
        throw new Error(result.error || 'Transcription failed');
      }

      setStatus('idle');
      console.log('[Recorder] Transcription complete:', result.text);
      return result.text;

    } catch (err) {
      console.error('[Recorder] Error:', err);
      setError('转录失败，请重试');
      setStatus('error');
      return '';
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

    } catch (err) {
      console.error('Cancel recording error:', err);
      setStatus('idle');
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

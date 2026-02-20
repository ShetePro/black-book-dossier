import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { 
  initializeVosk, 
  startRecognition, 
  stopRecognition, 
  releaseVosk,
  isVoskLoaded,
} from '@/services/voice/vosk';

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
 * 获取当前录音的电平（用于波形可视化）
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

export const useStreamingRecorder = (): UseStreamingRecorderReturn => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [liveTranscription, setLiveTranscription] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(-160);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptionRef = useRef('');
  const isRecognizingRef = useRef(false);

  const initialize = useCallback(async () => {
    try {
      setStatus('initializing');
      await initializeVosk();
      setIsModelLoaded(true);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to initialize Vosk:', err);
      setError('模型加载失败，请检查网络连接');
      setStatus('error');
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!isVoskLoaded()) {
        setError('语音识别模型未加载');
        setStatus('error');
        return;
      }

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

      // 重置状态
      startTimeRef.current = Date.now();
      setLiveTranscription('');
      setDuration(0);
      setAudioLevel(-160);
      setError(null);
      finalTranscriptionRef.current = '';
      isRecognizingRef.current = false;

      console.log('[Recording] Creating recording instance for metering...');
      const { recording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
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

      // 启动音频电平监测（用于波形可视化）
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const level = await getAudioLevel(recordingRef.current);
          setAudioLevel(level);
        }
      }, 50);

      // 启动时长计时
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);

      // 启动 Vosk 流式识别
      console.log('[Recording] Starting Vosk recognition...');
      isRecognizingRef.current = true;
      
      await startRecognition(
        // onPartialResult - 实时部分结果
        (partialText) => {
          if (partialText && partialText.trim()) {
            console.log('[Streaming] Partial:', partialText);
            setLiveTranscription(prev => {
              // 如果之前已经有最终结果，拼接新的部分结果
              if (finalTranscriptionRef.current) {
                return finalTranscriptionRef.current + '，' + partialText;
              }
              return partialText;
            });
          }
        },
        // onResult - 完整结果（检测到停顿时）
        (resultText) => {
          if (resultText && resultText.trim()) {
            console.log('[Streaming] Result:', resultText);
            finalTranscriptionRef.current = resultText;
            setLiveTranscription(resultText);
          }
        },
        // onError
        (err) => {
          console.error('[Streaming] Error:', err);
          setError('语音识别出错: ' + err);
        },
        // onFinalResult
        (finalText) => {
          if (finalText && finalText.trim()) {
            console.log('[Streaming] Final:', finalText);
            finalTranscriptionRef.current = finalText;
            setLiveTranscription(finalText);
          }
        }
      );

    } catch (err) {
      console.error('Start recording error:', err);
      setError('启动录音失败: ' + (err instanceof Error ? err.message : String(err)));
      setStatus('error');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    console.log('[Recording] Stopping recording...');
    setStatus('stopping');

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
      // 停止 Vosk 识别
      if (isRecognizingRef.current) {
        stopRecognition();
        isRecognizingRef.current = false;
      }

      // 停止录音（仅用于电平监测）
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      const finalText = finalTranscriptionRef.current || liveTranscription;
      
      setStatus('idle');
      console.log('[Recording] Recording stopped. Final text:', finalText);

      return finalText;

    } catch (err) {
      console.error('[Recording] Stop recording error:', err);
      setError('停止录音失败');
      setStatus('error');
      return finalTranscriptionRef.current || liveTranscription;
    }
  }, [liveTranscription]);

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
      // 停止 Vosk 识别
      if (isRecognizingRef.current) {
        stopRecognition();
        isRecognizingRef.current = false;
      }

      // 停止录音
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // 重置所有状态
      setLiveTranscription('');
      setDuration(0);
      setAudioLevel(-160);
      setStatus('idle');
      setError(null);
      finalTranscriptionRef.current = '';

    } catch (err) {
      console.error('Cancel recording error:', err);
      setStatus('idle');
    }
  }, []);

  // 清理副作用
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (isRecognizingRef.current) {
        stopRecognition();
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

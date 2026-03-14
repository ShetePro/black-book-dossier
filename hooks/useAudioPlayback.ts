import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  position: number;
  duration: number;
  loadAudio: (uri: string) => Promise<void>;
  togglePlayback: () => Promise<void>;
  cleanup: () => Promise<void>;
  formatTime: (ms: number) => string;
}

export const useAudioPlayback = (): UseAudioPlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);

  // 格式化时间
  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 播放状态更新回调
  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;
    
    const currentPosition = status.positionMillis || 0;
    const currentDuration = status.durationMillis || 0;
    const playing = status.isPlaying;
    
    // 更新 React state
    setPosition(currentPosition);
    setIsPlaying(playing);
    
    // 更新时长
    if (currentDuration > 0 && currentDuration !== durationRef.current) {
      setDuration(currentDuration);
      durationRef.current = currentDuration;
    }
    
    // 更新 refs
    positionRef.current = currentPosition;
    isPlayingRef.current = playing;
    
    // 播放完成处理
    if (status.didJustFinish) {
      console.log('[useAudioPlayback] Playback finished');
      positionRef.current = 0;
      isPlayingRef.current = false;
      setPosition(0);
      setIsPlaying(false);
      setTimeout(() => {
        soundRef.current?.setPositionAsync(0);
      }, 100);
    }
  }, []);

  // 加载音频
  const loadAudio = useCallback(async (uri: string): Promise<void> => {
    if (!uri) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      console.log('[useAudioPlayback] Loading audio:', uri);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const audioDuration = status.durationMillis || 0;
        const audioPosition = status.positionMillis || 0;
        
        durationRef.current = audioDuration;
        positionRef.current = audioPosition;
        isPlayingRef.current = status.isPlaying;
        
        setDuration(audioDuration);
        setPosition(audioPosition);
        setIsPlaying(status.isPlaying);
      }
    } catch (error) {
      console.error('[useAudioPlayback] Failed to load audio:', error);
    }
  }, [onPlaybackStatusUpdate]);

  // 播放/暂停切换
  const togglePlayback = useCallback(async (): Promise<void> => {
    console.log('[useAudioPlayback] Toggle playback, current state:', isPlayingRef.current);
    
    if (!soundRef.current) {
      console.log('[useAudioPlayback] No sound loaded');
      return;
    }
    
    try {
      const status = await soundRef.current.getStatusAsync();
      
      if (!status.isLoaded) {
        console.error('[useAudioPlayback] Sound not loaded');
        return;
      }
      
      // 检查是否播放完成或接近完成
      const isFinished = status.didJustFinish || 
                        positionRef.current >= durationRef.current - 100 ||
                        (durationRef.current > 0 && positionRef.current / durationRef.current > 0.99);
      
      if (isFinished) {
        console.log('[useAudioPlayback] Resetting to start...');
        await soundRef.current.setPositionAsync(0);
        positionRef.current = 0;
        setPosition(0);
        await soundRef.current.playAsync();
      } else if (status.isPlaying || isPlayingRef.current) {
        console.log('[useAudioPlayback] Pausing...');
        await soundRef.current.pauseAsync();
      } else {
        console.log('[useAudioPlayback] Playing...');
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('[useAudioPlayback] Toggle playback error:', error);
    }
  }, []);

  // 清理音频资源
  const cleanup = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  return {
    isPlaying,
    position,
    duration,
    loadAudio,
    togglePlayback,
    cleanup,
    formatTime,
  };
};

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

let recording: Audio.Recording | null = null;

export const requestAudioPermissions = async (): Promise<boolean> => {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
};

export const startVoiceRecording = async (): Promise<void> => {
  try {
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      throw new Error('Microphone permission not granted');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    recording = newRecording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
};

export const stopVoiceRecording = async (): Promise<{ uri: string; duration: number }> => {
  try {
    if (!recording) {
      throw new Error('No recording in progress');
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    
    if (!uri) {
      throw new Error('Failed to get recording URI');
    }

    const duration = status.durationMillis || 0;
    recording = null;

    return { uri, duration };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    throw error;
  }
};

export const deleteRecording = async (uri: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(uri);
  } catch (error) {
    console.error('Failed to delete recording:', error);
  }
};

export const transcribeAudio = async (uri: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('刚见了老王，他提到最近痛风犯了，正在找日本的那个特效药。他女儿下个月要去伦敦读研，想找个当地的公寓。');
    }, 2000);
  });
};

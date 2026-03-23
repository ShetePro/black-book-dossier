import { create } from 'zustand';

export interface RecordingState {
  isRecording: boolean;
  recordingUri: string | null;
  transcript: string;
  isProcessing: boolean;
  
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  setTranscript: (transcript: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setRecordingUri: (uri: string | null) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  recordingUri: null,
  transcript: '',
  isProcessing: false,

  startRecording: async () => {
    set({ isRecording: true });
  },

  stopRecording: async () => {
    set({ isRecording: false });
    return null;
  },

  setTranscript: (transcript) => set({ transcript }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setRecordingUri: (recordingUri) => set({ recordingUri }),
  
  reset: () => set({ 
    isRecording: false, 
    recordingUri: null, 
    transcript: '', 
    isProcessing: false 
  }),
}));

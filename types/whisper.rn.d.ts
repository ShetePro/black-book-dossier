declare module 'whisper.rn' {
  export interface WhisperContext {
    transcribe(path: string, options?: TranscribeOptions): Promise<TranscribeResult>;
    release(): Promise<void>;
  }

  export interface TranscribeOptions {
    language?: string;
    maxLen?: number;
    timestamp?: boolean;
  }

  export interface TranscribeResult {
    result: string;
  }

  export interface InitWhisperOptions {
    filePath: string;
    language?: string;
  }

  export function initWhisper(options: InitWhisperOptions): Promise<WhisperContext>;
}

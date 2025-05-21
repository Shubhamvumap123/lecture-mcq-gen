
export interface VideoFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface TranscriptSegment {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface MCQuestion {
  id: string;
  segmentId: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'transcribing' | 'generating' | 'complete' | 'error';

export interface ProcessingProgress {
  status: ProcessingStatus;
  progress: number;
  message?: string;
}

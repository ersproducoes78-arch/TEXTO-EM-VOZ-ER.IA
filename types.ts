export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Masculina' | 'Feminina' | 'Neutra';
  language: string;
  accent: string;
}

export type QueueItemStatus = 'queued' | 'generating' | 'done' | 'error';

export interface QueueItem {
  id: string;
  text: string;
  status: QueueItemStatus;
  generatedAudio?: string | null;
  error?: string | null;
}

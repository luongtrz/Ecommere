export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatToolStep {
  id: string;
  name: string;
  summary: string;
  status: 'running' | 'ok' | 'error';
  resultSummary?: string;
}

export interface ChatConfirmCall {
  id: string;
  name: string;
  summary: string;
  risk: 'WRITE' | 'SENSITIVE' | 'DESTRUCTIVE';
}

export interface ChatSource {
  id: string;
  name: string;
  slug: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  tools: ChatToolStep[];
  confirm?: {
    calls: ChatConfirmCall[];
    decided?: boolean;
  };
  sources?: ChatSource[];
  error?: string;
  createdAt: string;
}

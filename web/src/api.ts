// Cliente de la API. Mismo origen: la cookie de sesión viaja sola.

export interface Me { id: string; login: string; name: string | null; avatarUrl: string | null; isAdmin: boolean }
export interface Repo { repoUrl: string; branch: string; chunksCount: number; updatedAt: string }
export interface ConversationSummary { id: string; title: string; repoUrl: string | null; updatedAt: string; messageCount: number }
export interface Source {
  id?: string;
  source: string;
  repoUrl?: string;
  startLine?: number;
  endLine?: number;
  score: number;
  content: string;
}
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[] | null;
  rating?: number | null;
}
export interface Conversation extends ConversationSummary { messages: Message[] }
export interface IngestResult { message: string; newChunks: number; deletedChunks: number; isFullClone: boolean }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Error ${res.status}`);
  return data as T;
}

export const api = {
  me: () => request<Me>('/api/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  repos: () => request<Repo[]>('/api/repos'),
  conversations: () => request<ConversationSummary[]>('/api/conversations'),
  conversation: (id: string) => request<Conversation>(`/api/conversations/${id}`),
  deleteConversation: (id: string) => request(`/api/conversations/${id}`, { method: 'DELETE' }),
  feedback: (messageId: string, rating: 1 | 2 | null) =>
    request('/api/feedback', { method: 'POST', body: JSON.stringify({ messageId, rating }) }),
  ingest: (repoUrl: string, branch: string, full: boolean) =>
    request<IngestResult>('/api/ingest-repo', { method: 'POST', body: JSON.stringify({ repoUrl, branch, full }) }),
};

export type AskEvent =
  | { type: 'conversation'; conversationId: string }
  | { type: 'sources'; sources: Source[]; fromCache?: boolean }
  | { type: 'token'; content: string }
  | { type: 'done'; conversationId: string; messageId: string }
  | { type: 'error'; message: string };

/** POST /api/ask y lee el stream SSE evento a evento */
export async function ask(
  body: { question: string; conversationId?: string; filters?: Record<string, string> },
  onEvent: (event: AskEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || `Error ${res.status}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const raw of events) {
      const data = raw.replace(/^data: /, '');
      if (data === '[DONE]') return;
      if (data) onEvent(JSON.parse(data));
    }
  }
}

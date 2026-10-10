import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { CircleAlert, CornerDownLeft, Send, Square } from 'lucide-react';
import { api, ask, ApiError, type Message, type Source } from '../api';
import { Answer } from './Answer';
import { Deck, pad2, repoName } from './bits';

interface Pending {
  question: string;
  answer: string;
  sources: Source[] | null;
  fromCache?: boolean;
  tokens: number;
  error?: string;
}

interface ChatProps {
  conversationId: string | null;
  repoUrl: string;
  onConversationCreated: (id: string) => void;
  onActivity: () => void;
}

const SUGGESTIONS = [
  '¿Cuál es la estructura general del proyecto?',
  '¿Cómo se conecta a la base de datos?',
  '¿Qué hace el endpoint principal y qué responde?',
];

export function Chat({ conversationId, repoUrl, onConversationCreated, onActivity }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const createdHere = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = pending !== null && !pending.error;

  // Cargar la conversación al cambiar de cinta (salvo la que acabamos de crear con este envío)
  useEffect(() => {
    if (conversationId && conversationId === createdHere.current) {
      createdHere.current = null; // solo se salta una vez: al volver a esta cinta sí se recarga
      return;
    }
    abortRef.current?.abort();
    setPending(null);
    setLoadError(null);
    if (!conversationId) { setMessages([]); return; }
    let cancelled = false;
    api.conversation(conversationId)
      .then((c) => { if (!cancelled) setMessages(c.messages); })
      .catch((e) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, [conversationId]);

  // Seguir el final mientras llega la respuesta
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 240) el.scrollTop = el.scrollHeight;
  }, [pending?.answer, pending?.sources, messages.length]);

  async function send(question: string) {
    question = question.trim();
    if (!question || busy) return;
    setDraft('');
    const controller = new AbortController();
    abortRef.current = controller;
    setPending({ question, answer: '', sources: null, tokens: 0 });

    let messageId: string | null = null;
    let final: Pending = { question, answer: '', sources: null, tokens: 0 };
    const update = (patch: Partial<Pending>) => { final = { ...final, ...patch }; setPending(final); };

    try {
      await ask(
        { question, conversationId: conversationId ?? undefined, filters: repoUrl ? { repoUrl } : undefined },
        (event) => {
          if (event.type === 'conversation' && event.conversationId !== conversationId) {
            createdHere.current = event.conversationId;
            onConversationCreated(event.conversationId);
          } else if (event.type === 'sources') {
            update({ sources: event.sources, fromCache: event.fromCache });
          } else if (event.type === 'token') {
            update({ answer: final.answer + event.content, tokens: final.tokens + 1 });
          } else if (event.type === 'done') {
            messageId = event.messageId;
          } else if (event.type === 'error') {
            update({ error: event.message });
          }
        },
        controller.signal,
      );
      if (messageId && !final.error) {
        setMessages((m) => [
          ...m,
          { id: `q-${messageId}`, role: 'user', content: question },
          { id: messageId!, role: 'assistant', content: final.answer, sources: final.sources, rating: null },
        ]);
        setPending(null);
      } else if (!final.error) {
        update({ error: 'La respuesta se cortó antes de terminar.' });
      }
    } catch (e) {
      if (controller.signal.aborted) update({ error: 'Detuviste la respuesta.' });
      else update({ error: e instanceof ApiError && e.status === 429 ? 'Demasiadas preguntas seguidas. Espera un minuto.' : (e as Error).message });
    } finally {
      onActivity();
    }
  }

  async function rate(id: string, rating: 1 | 2 | null) {
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, rating } : msg)));
    try { await api.feedback(id, rating); } catch { /* la valoración es opcional; no interrumpe */ }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); void send(draft); }

  // Autoajustar la altura del textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  const turns = pairTurns(messages);
  const isEmpty = turns.length === 0 && !pending && !loadError;

  return (
    <>
      <div className="scroll" ref={scrollRef}>
        <div className="column">
          {loadError && (
            <div className="notice" role="alert"><CircleAlert size={18} /> No se pudo abrir esta cinta: {loadError}</div>
          )}

          {isEmpty && (
            <div className="empty">
              <h2>¿Qué quieres saber del código?</h2>
              <p>
                {repoUrl
                  ? <>Preguntas sobre <strong>{repoName(repoUrl)}</strong>. </>
                  : <>Preguntas sobre todas las cintas grabadas. </>}
                Cada respuesta trae su lado B: los archivos y las líneas exactas de donde sale.
              </p>
              <section className="tracklist" aria-label="Preguntas para empezar">
                <div className="tracklist-head"><h3>Lado A · Para empezar</h3><span className="num">{SUGGESTIONS.length} pistas</span></div>
                <ol className="tracks">
                  {SUGGESTIONS.map((q, i) => (
                    <li key={q} className="track">
                      <button className="track-btn" onClick={() => void send(q)}>
                        <span className="track-no num">{pad2(i + 1)}</span>
                        <span className="track-q">{q}</span>
                        <span className="track-time"><CornerDownLeft size={18} aria-hidden="true" /></span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}

          {turns.map(({ question, answer }) => (
            <article className="turn" key={answer?.id ?? question.id}>
              <h2 className="question">{question.content}</h2>
              {answer && (
                <Answer
                  content={answer.content}
                  sources={answer.sources ?? null}
                  rating={answer.rating}
                  onRate={(r) => rate(answer.id, r)}
                />
              )}
            </article>
          ))}

          {pending && (
            <article className="turn" aria-live="polite" aria-busy={busy}>
              <h2 className="question">{pending.question}</h2>
              {busy && (
                <div className="answer-status">
                  <Deck running />
                  {pending.sources === null
                    ? <span>Buscando en la cinta…</span>
                    : <>
                        <span>Grabando respuesta</span>
                        <span className="counter num" aria-label={`${pending.tokens} fragmentos recibidos`}>{String(pending.tokens).padStart(4, '0')}</span>
                      </>}
                </div>
              )}
              {(pending.answer || pending.sources) && (
                <Answer content={pending.answer} sources={pending.sources} streaming={busy} fromCache={pending.fromCache} />
              )}
              {pending.error && (
                <div className="notice" role="alert" style={{ marginTop: '1rem' }}>
                  <CircleAlert size={18} />
                  <div>
                    No se pudo terminar la respuesta: {pending.error}{' '}
                    <button className="btn btn-quiet" onClick={() => { setPending(null); void send(pending.question); }}>Reintentar</button>
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <div className="composer-inner">
          <label htmlFor="question" className="sr-only">Tu pregunta</label>
          <div className="composer-box">
            <textarea
              id="question"
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={2000}
              placeholder={repoUrl ? 'Pregunta sobre esta cinta…' : 'Pregunta sobre el código…'}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {busy ? (
              <button type="button" className="btn" onClick={() => abortRef.current?.abort()}>
                <Square size={16} /> Detener
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
                <Send size={16} /> Enviar
              </button>
            )}
          </div>
          <p className="composer-hint">Enter envía · Shift+Enter salta de línea</p>
        </div>
      </form>
    </>
  );
}

/** Agrupa mensajes en pares pregunta → respuesta */
function pairTurns(messages: Message[]) {
  const turns: { question: Message; answer?: Message }[] = [];
  for (const m of messages) {
    if (m.role === 'user') turns.push({ question: m });
    else if (turns.length && !turns[turns.length - 1].answer) turns[turns.length - 1].answer = m;
  }
  return turns;
}

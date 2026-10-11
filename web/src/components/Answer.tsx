import { useId, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Source } from '../api';
import { lineRange, pad2, repoName } from './bits';

// "[Fuente 2]" o "[Fuentes 1, 3]" → enlaces #fuente-N que se pintan como citas
function linkCitations(text: string): string {
  return text.replace(/\[Fuentes? ([\d,\sy]+)\]/gi, (_, list: string) =>
    (list.match(/\d+/g) ?? []).map((n) => `[${n}](#fuente-${n})`).join(' '),
  );
}

// Frase exacta que el backend pide al LLM cuando el contexto no alcanza
const NO_INFO = /^\s*No tengo información suficiente\.?\s*$/i;

interface AnswerProps {
  content: string;
  sources: Source[] | null;
  streaming?: boolean;
  fromCache?: boolean;
  rating?: number | null;
  onRate?: (rating: 1 | 2 | null) => void;
}

export function Answer({ content, sources, streaming, fromCache, rating, onRate }: AnswerProps) {
  // Pista activa compartida entre las citas del texto y la tracklist
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  // Sufijo estable por respuesta para que los ids no choquen entre turnos
  const idSuffix = useId().replace(/:/g, '');

  const focusTrack = (n: number) => {
    setOpen(n);
    document.getElementById(`track-${n}-${idSuffix}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <>
      <div className={`answer${streaming ? ' streaming-caret' : ''}`}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({ href, children }) {
              const n = href?.startsWith('#fuente-') ? Number(href.slice(8)) : null;
              if (n === null) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
              return (
                <a
                  href={`#track-${n}-${idSuffix}`}
                  className="cite num"
                  data-active={active === n}
                  aria-label={`Ver fuente ${n}`}
                  onMouseEnter={() => setActive(n)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(n)}
                  onBlur={() => setActive(null)}
                  onClick={(e) => { e.preventDefault(); focusTrack(n); }}
                >
                  {pad2(n)}
                </a>
              );
            },
          }}
        >
          {linkCitations(content)}
        </Markdown>
      </div>

      {sources && !streaming && NO_INFO.test(content) ? (
        // Sin respuesta, las pistas no respaldan nada: solo se dice cuánto se revisó
        <p className="tracklist-empty">
          Se revisaron {sources.length} fragmentos de la cinta y ninguno responde a esta pregunta.
        </p>
      ) : sources && (
        <Tracklist
          sources={sources}
          active={active}
          open={open}
          idSuffix={idSuffix}
          onHover={setActive}
          onToggle={(n) => setOpen(open === n ? null : n)}
        />
      )}

      {!streaming && onRate && (
        <div className="answer-actions">
          <button
            className="icon-btn"
            aria-label="Respuesta útil"
            aria-pressed={rating === 2}
            onClick={() => onRate(rating === 2 ? null : 2)}
          >
            <ThumbsUp size={18} />
          </button>
          <button
            className="icon-btn"
            aria-label="Respuesta no útil"
            aria-pressed={rating === 1}
            onClick={() => onRate(rating === 1 ? null : 1)}
          >
            <ThumbsDown size={18} />
          </button>
          <span className="spacer" />
          {fromCache && <span>Repetida desde caché</span>}
        </div>
      )}
    </>
  );
}

interface TracklistProps {
  sources: Source[];
  active: number | null;
  open: number | null;
  idSuffix: string;
  onHover: (n: number | null) => void;
  onToggle: (n: number) => void;
}

function Tracklist({ sources, active, open, idSuffix, onHover, onToggle }: TracklistProps) {
  // El repo solo se nombra cuando las fuentes vienen de más de uno
  const showRepo = new Set(sources.map((s) => s.repoUrl)).size > 1;
  return (
    <section className="tracklist" aria-label="Fuentes de la respuesta">
      <div className="tracklist-head">
        <h3>Lado B · Fuentes</h3>
        <span className="num">{sources.length} {sources.length === 1 ? 'pista' : 'pistas'}</span>
      </div>
      {sources.length === 0 ? (
        <p className="tracklist-empty">No se encontró ningún fragmento relevante en la cinta.</p>
      ) : (
        <ol className="tracks">
          {sources.map((s, i) => {
            const n = i + 1;
            const slash = s.source.lastIndexOf('/');
            const dir = slash >= 0 ? s.source.slice(0, slash + 1) : '';
            const file = s.source.slice(slash + 1);
            return (
              <li key={s.id ?? i} id={`track-${n}-${idSuffix}`} className="track" data-active={active === n || open === n}>
                <button
                  className="track-btn"
                  aria-expanded={open === n}
                  onMouseEnter={() => onHover(n)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onToggle(n)}
                >
                  <span className="track-no num">{pad2(n)}</span>
                  <span className="track-path">
                    <span className="dir">{dir}</span>
                    <span className="file">{file}</span>
                  </span>
                  <span className="track-time num">
                    L {lineRange(s.startLine, s.endLine)}
                    <small>
                      {showRepo && <>{repoName(s.repoUrl)} · </>}rel. {s.score.toLocaleString('es', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </small>
                  </span>
                </button>
                {open === n && <CodeFragment source={s} />}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function CodeFragment({ source }: { source: Source }) {
  const first = source.startLine ?? 1;
  return (
    <pre className="track-code" tabIndex={0} aria-label={`Fragmento de ${source.source}`}>
      {source.content.split('\n').map((line, i) => (
        <span key={i}>
          <span className="ln num">{first + i}</span>
          {line}
          {'\n'}
        </span>
      ))}
    </pre>
  );
}

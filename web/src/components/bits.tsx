// Piezas pequeñas compartidas: la grabadora, el logo de GitHub y formateadores.

/** Cassette dibujado a tinta; los carretes giran mientras se graba (se escribe la respuesta). */
export function Deck({ running = false, size = 40 }: { running?: boolean; size?: number }) {
  const reel = (cx: number) => (
    <g className="reel">
      <circle cx={cx} cy="15" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d={`M${cx} 10.5v9M${cx - 4.5} 15h9`} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
  return (
    <svg className="deck" data-running={running} width={size} height={(size * 26) / 40} viewBox="0 0 40 26" aria-hidden="true">
      <rect x="1" y="1" width="38" height="24" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="22" height="12" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 4.5h28" stroke="var(--red)" strokeWidth="1.5" />
      {reel(14)}
      {reel(26)}
    </svg>
  );
}

export function GitHubMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** "https://github.com/owner/repo" → "owner/repo" */
export const repoName = (url?: string | null) => (url ? url.replace(/^https:\/\/github\.com\//, '') : '');

export const pad2 = (n: number) => String(n).padStart(2, '0');

const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
export const shortDate = (iso: string) => dateFmt.format(new Date(iso)).replace('.', '');

export const lineRange = (start?: number, end?: number) =>
  start ? (end && end !== start ? `${start}–${end}` : `${start}`) : '—';

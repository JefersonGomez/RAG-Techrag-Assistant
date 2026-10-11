import { useState, type FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import { api, type Repo } from '../api';
import { Deck, pad2, repoName, shortDate } from './bits';

// Panel de admin: "grabar una cinta" = indexar un repo de GitHub
export function Record({ repos, onRecorded }: { repos: Repo[]; onRecorded: () => void }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [full, setFull] = useState(false);
  const [state, setState] = useState<{ status: 'idle' | 'recording' | 'done' | 'error'; text?: string }>({ status: 'idle' });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ status: 'recording' });
    try {
      const r = await api.ingest(repoUrl.trim(), branch.trim() || 'main', full);
      setState({
        status: 'done',
        text: `${r.message}: ${r.newChunks} fragmentos nuevos, ${r.deletedChunks} reemplazados.`,
      });
      onRecorded();
    } catch (err) {
      setState({ status: 'error', text: (err as Error).message });
    }
  }

  const recording = state.status === 'recording';

  return (
    <div className="scroll">
      <div className="column">
        <div className="empty" style={{ paddingTop: 0 }}>
          <h2>Grabar una cinta</h2>
          <p>
            Indexa un repositorio público de GitHub. La primera vez se graba completo; las siguientes solo
            se regraban los archivos que cambiaron desde el último commit.
          </p>
        </div>

        <form className="record-form" onSubmit={onSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="repo-url">Repositorio</label>
            <input id="repo-url" className="input" type="url" required placeholder="https://github.com/usuario/repo"
              pattern="https://github\.com/[\w.\-]+/[\w.\-]+/?(\.git)?" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} disabled={recording} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="repo-branch">Rama</label>
            <input id="repo-branch" className="input" required value={branch} onChange={(e) => setBranch(e.target.value)} disabled={recording} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={recording || !repoUrl.trim()}>
            {recording ? 'Grabando…' : 'Grabar'}
          </button>
          <label className="record-full">
            <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} disabled={recording} />
            Regrabar desde cero (borra lo indexado de este repo y lo vuelve a leer entero)
          </label>
        </form>

        {recording && (
          <div className="record-status" aria-live="polite">
            <Deck running /> Grabando la cinta. Un repo grande puede tardar varios minutos; no cierres esta pestaña.
          </div>
        )}
        {state.status === 'done' && <div className="record-result" role="status">{state.text}</div>}
        {state.status === 'error' && (
          <div className="notice" role="alert"><CircleAlert size={18} /> No se pudo grabar: {state.text}</div>
        )}

        <section className="tracklist" aria-label="Cintas grabadas" style={{ marginTop: '2.5rem' }}>
          <div className="tracklist-head"><h3>Cintas grabadas</h3><span className="num">{repos.length}</span></div>
          {repos.length === 0 ? (
            <p className="tracklist-empty">Todavía no hay ningún repositorio indexado.</p>
          ) : (
            <ol className="tracks">
              {repos.map((r, i) => (
                <li key={r.repoUrl} className="track">
                  <div className="track-btn track-static">
                    <span className="track-no num">{pad2(i + 1)}</span>
                    <span className="track-path">
                      <span className="file">{repoName(r.repoUrl)}</span> <span className="dir">@{r.branch}</span>
                    </span>
                    <span className="track-time num">
                      {r.chunksCount} frag.
                      <small>{shortDate(r.updatedAt)}</small>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

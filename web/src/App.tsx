import { useCallback, useEffect, useState } from 'react';
import { LogOut, Menu, PenLine, Plus, Trash } from 'lucide-react';
import { api, ApiError, type ConversationSummary, type Me, type Repo } from './api';
import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { Record } from './components/Record';
import { Deck, repoName, shortDate } from './components/bits';

type View = { kind: 'chat'; id: string | null } | { kind: 'record' };

// Rutas en el hash: #/c/<id> abre una cinta, #/grabar el panel de admin
function viewFromHash(): View {
  const hash = location.hash;
  if (hash === '#/grabar') return { kind: 'record' };
  const m = hash.match(/^#\/c\/([\w-]+)$/);
  return { kind: 'chat', id: m ? m[1] : null };
}
const go = (hash: string) => { if (location.hash !== hash) location.hash = hash; };

export default function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [authError] = useState(() => new URLSearchParams(location.search).get('error') === 'auth');

  useEffect(() => {
    if (location.search) history.replaceState(null, '', location.pathname + location.hash);
    api.me()
      .then(setMe)
      .catch((e) => setMe(e instanceof ApiError && e.status === 401 ? null : null));
  }, []);

  if (me === undefined) return <div className="loading-screen"><Deck running /></div>;
  if (me === null) return <Login error={authError} />;
  return <Shell me={me} />;
}

function Shell({ me }: { me: Me }) {
  const [view, setView] = useState<View>(viewFromHash);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [drawer, setDrawer] = useState(false);

  const loadConversations = useCallback(() => api.conversations().then(setConversations).catch(() => {}), []);
  const loadRepos = useCallback(() => api.repos().then(setRepos).catch(() => {}), []);

  useEffect(() => { void loadConversations(); void loadRepos(); }, [loadConversations, loadRepos]);

  useEffect(() => {
    const onHash = () => { setView(viewFromHash()); setDrawer(false); };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  // Al abrir una cinta existente, el filtro pasa a ser el repo con el que se grabó
  const activeId = view.kind === 'chat' ? view.id : null;
  const active = conversations.find((c) => c.id === activeId);
  useEffect(() => { if (active) setRepoUrl(active.repoUrl ?? ''); }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(id: string) {
    if (!confirm('¿Borrar esta cinta y todos sus mensajes?')) return;
    await api.deleteConversation(id).catch(() => {});
    if (activeId === id) go('#/');
    void loadConversations();
  }

  async function logout() {
    await api.logout().catch(() => {});
    location.reload();
  }

  // La pregunta ya está en la columna: la barra solo rotula la cinta
  const title = view.kind === 'record'
    ? 'Grabar cinta'
    : active
      ? `Lado A · ${shortDate(active.updatedAt)}`
      : 'Cinta nueva';

  return (
    <div className="app" data-drawer={drawer ? 'open' : 'closed'}>
      <div className="spine">
        <span className="spine-mark"><Deck size={34} /></span>
        <div className="stripe" />
        <span className="spine-title" aria-hidden="true">TechRAG</span>
        <div className="spine-user">
          {me.avatarUrl
            ? <img className="avatar" src={me.avatarUrl} alt={`Sesión de ${me.login}`} />
            : <span className="avatar" aria-label={`Sesión de ${me.login}`} />}
          <button className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={logout}><LogOut size={18} /></button>
        </div>
      </div>

      <nav className="flap" aria-label="Cintas">
        <div className="flap-head">
          <h2 className="flap-title">Cintas <small className="num">{conversations.length}</small></h2>
          <button className="btn btn-primary" onClick={() => go('#/')}><Plus size={18} /> Cinta nueva</button>
        </div>
        {conversations.length === 0 ? (
          <p className="flap-empty">Tus conversaciones aparecerán aquí, cada una como una cinta.</p>
        ) : (
          <ul className="flap-list">
            {conversations.map((c) => (
              <li key={c.id} className="tape-row" aria-current={c.id === activeId}>
                <button className="tape-link" onClick={() => go(`#/c/${c.id}`)}>
                  <span className="tape-label">
                    <span><b>A</b>{c.repoUrl ? repoName(c.repoUrl).split('/')[1] : 'Todas las cintas'}</span>
                    <span className="num">{shortDate(c.updatedAt)}</span>
                  </span>
                  <span className="tape-name">{c.title}</span>
                </button>
                <button className="icon-btn tape-delete" aria-label={`Borrar «${c.title}»`} onClick={() => remove(c.id)}>
                  <Trash size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flap-foot">
          {me.isAdmin && (
            <button className="btn" aria-current={view.kind === 'record'} onClick={() => go('#/grabar')}>
              <PenLine size={18} /> Grabar cinta
            </button>
          )}
          <span className="tape-meta"><span>@{me.login}</span>{me.isAdmin && <span>admin</span>}</span>
          <button className="btn btn-quiet menu-only-logout" onClick={logout}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </nav>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Abrir cintas" aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <Menu size={20} />
          </button>
          <h1 className="topbar-title">{title}</h1>
          {view.kind === 'chat' && (
            <>
              <label htmlFor="repo-filter" className="sr-only">Repositorio</label>
              <select id="repo-filter" className="select" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}>
                <option value="">Todas las cintas</option>
                {repos.map((r) => <option key={r.repoUrl} value={r.repoUrl}>{repoName(r.repoUrl)}</option>)}
              </select>
            </>
          )}
        </header>
        <div className="stripe" />

        {view.kind === 'record' && me.isAdmin ? (
          <Record repos={repos} onRecorded={loadRepos} />
        ) : (
          <Chat
            conversationId={activeId}
            repoUrl={repoUrl}
            onConversationCreated={(id) => { go(`#/c/${id}`); void loadConversations(); }}
            onActivity={loadConversations}
          />
        )}
      </main>
    </div>
  );
}

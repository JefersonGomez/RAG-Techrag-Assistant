import { CircleAlert } from 'lucide-react';
import { Deck, GitHubMark } from './bits';

// Ejemplo ilustrativo (rutas y líneas reales de este repo), marcado como ejemplo en pantalla
const SAMPLE = [
  { path: 'src/routes/', file: 'ingest-repo.ts', lines: '96–112' },
  { path: 'src/', file: 'vector-store.ts', lines: '41–49' },
  { path: 'src/', file: 'ingestion.ts', lines: '20–25' },
];

export function Login({ error }: { error: boolean }) {
  return (
    <main className="login">
      <div className="jcard">
        <div className="spine" aria-hidden="true">
          <span className="spine-mark"><Deck size={34} /></span>
          <div className="stripe" />
          <span className="spine-title">TechRAG Assistant</span>
        </div>

        <section className="jcard-front">
          <h1>TechRAG<br />Assistant</h1>
          <div className="rule" />
          <p className="lede">Pregúntale al código. Cada respuesta trae su lado B.</p>
          <p>
            Un asistente que lee repositorios de GitHub y responde citando el archivo y las líneas exactas
            de donde sale cada afirmación. Si la respuesta no está en el código, lo dice.
          </p>
          {error && (
            <div className="notice" role="alert">
              <CircleAlert size={18} /> No se pudo iniciar sesión con GitHub. Inténtalo de nuevo.
            </div>
          )}
          <a className="btn btn-primary github-btn" href="/auth/github">
            <GitHubMark size={22} /> Entrar con GitHub
          </a>
          <p className="sample-tag">Solo leemos tu perfil público (usuario, nombre y avatar).</p>
        </section>

        <aside className="jcard-inside" aria-label="Ejemplo de respuesta">
          <p className="sample-q">Ejemplo: ¿Cómo evita indexar dos veces el mismo archivo?</p>
          <p className="answer sample-answer">
            Antes de regrabar un archivo cambiado borra sus fragmentos viejos <span className="cite num" data-active="true">01</span>,
            filtrando por repo y ruta <span className="cite num">02</span>. Solo entran archivos que pasan{' '}
            <code>isIndexable</code> <span className="cite num">03</span>.
          </p>
          <section className="tracklist">
            <div className="tracklist-head"><h3>Lado B · Fuentes</h3><span className="num">3 pistas</span></div>
            <ol className="tracks">
              {SAMPLE.map((t, i) => (
                <li key={t.file} className="track" data-active={i === 0}>
                  <div className="track-btn track-static">
                    <span className="track-no num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="track-path"><span className="dir">{t.path}</span><span className="file">{t.file}</span></span>
                    <span className="track-time num">L {t.lines}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <div className="ruled-fill" aria-hidden="true" />
        </aside>
      </div>
    </main>
  );
}

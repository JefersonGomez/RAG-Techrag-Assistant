# Despliegue en VPS (Ubuntu 24.04 + nginx + DuckDNS)

TechRAG (API + frontend) corre en el puerto `3001`, solo en localhost, y nginx lo publica en
**`rag.jefersonbustamante.duckdns.org`**, junto al portfolio. DuckDNS ya resuelve cualquier subdominio
de `jefersonbustamante.duckdns.org` a la IP del VPS: no hay que crear nada allí.

Los comandos son para ejecutar como `root` (`ssh root@169.58.105.198`).

## 1. Dependencias del sistema

```bash
node -v   # si no hay Node 22+:
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git redis-server
systemctl enable --now redis-server
```

## 2. App OAuth de GitHub (una sola vez)

En https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**:

- Application name: `TechRAG Assistant`
- Homepage URL: `https://rag.jefersonbustamante.duckdns.org`
- Authorization callback URL: `https://rag.jefersonbustamante.duckdns.org/auth/github/callback`

Copia el **Client ID** y genera un **Client secret** (se usan en el paso 4).

## 3. Código

```bash
useradd --system --create-home --shell /usr/sbin/nologin techrag
git clone https://github.com/JefersonGomez/RAG-Techrag-Assistant.git /opt/techrag-assistant
chown -R techrag:techrag /opt/techrag-assistant
cd /opt/techrag-assistant
sudo -u techrag npm ci --legacy-peer-deps
sudo -u techrag npm run build:web
```

## 4. Variables de entorno

```bash
sudo -u techrag cp .env.example .env
sudo -u techrag nano .env
chmod 600 .env
```

Rellena (ver `.env.example`):

```env
DATABASE_URL="postgresql://..."            # Session Pooler de Supabase
DIRECT_URL="postgresql://..."
GROQ_API_KEY="gsk_..."
REDIS_URL="redis://127.0.0.1:6379"
GITHUB_CLIENT_ID="..."                      # paso 2
GITHUB_CLIENT_SECRET="..."                  # paso 2
APP_URL="https://rag.jefersonbustamante.duckdns.org"
JWT_SECRET="..."                            # pega la salida de: openssl rand -hex 32
ADMIN_GITHUB_LOGIN="JefersonGomez"
```

```bash
sudo -u techrag npx prisma generate
sudo -u techrag npx prisma migrate deploy   # no hace nada si ya están aplicadas
```

## 5. Servicio (arranca solo y se reinicia si falla)

```bash
cp deploy/techrag.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now techrag
journalctl -u techrag -f   # espera "🧠 Modelos locales cargados" (la 1ª vez descarga ~1,1 GB)
```

## 6. nginx + HTTPS

```bash
cp deploy/nginx-techrag.conf /etc/nginx/sites-available/techrag
ln -s /etc/nginx/sites-available/techrag /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d rag.jefersonbustamante.duckdns.org --redirect
```

## 7. Verificar

```bash
curl https://rag.jefersonbustamante.duckdns.org/api/health
```

Abre https://rag.jefersonbustamante.duckdns.org, entra con GitHub y, como admin, ve a **Grabar cinta**
para indexar un repo.

## Actualizar a una nueva versión

```bash
cd /opt/techrag-assistant
sudo -u techrag git pull
sudo -u techrag npm ci --legacy-peer-deps && sudo -u techrag npm run build:web
sudo -u techrag npx prisma generate && sudo -u techrag npx prisma migrate deploy
systemctl restart techrag
```

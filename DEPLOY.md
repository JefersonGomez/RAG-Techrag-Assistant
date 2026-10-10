# Despliegue en VPS (Linux + nginx + DuckDNS)

TechRAG corre en el puerto `3001` (solo localhost) y nginx lo publica en `rag.TU_DOMINIO.duckdns.org`,
junto al portfolio. DuckDNS resuelve cualquier subdominio de tu dominio a la misma IP: no hay que crear nada allí.

Los comandos asumen Ubuntu/Debian. Reemplaza `TU_DOMINIO` por tu dominio de DuckDNS.

## 1. Dependencias del sistema

```bash
node -v   # si no hay Node 22+:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git redis-server
sudo systemctl enable --now redis-server
```

## 2. Código

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin techrag
sudo git clone https://github.com/JefersonGomez/RAG-Techrag-Assistant.git /opt/techrag-assistant
sudo chown -R techrag:techrag /opt/techrag-assistant
cd /opt/techrag-assistant
sudo -u techrag npm ci --legacy-peer-deps
```

## 3. Variables de entorno

```bash
sudo -u techrag nano /opt/techrag-assistant/.env
```

```env
DATABASE_URL="postgresql://..."   # Session Pooler de Supabase
DIRECT_URL="postgresql://..."
GROQ_API_KEY="gsk_..."
REDIS_URL="redis://127.0.0.1:6379"
```

```bash
sudo chmod 600 /opt/techrag-assistant/.env
sudo -u techrag npx prisma generate
sudo -u techrag npx prisma migrate deploy   # no hace nada si ya están aplicadas
```

## 4. Servicio (arranca solo y se reinicia si falla)

```bash
sudo cp deploy/techrag.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now techrag
journalctl -u techrag -f   # espera "🧠 Modelos locales cargados" (la 1ª vez descarga ~1,1 GB)
```

## 5. nginx + HTTPS

```bash
sudo cp deploy/nginx-techrag.conf /etc/nginx/sites-available/techrag
sudo sed -i 's/TU_DOMINIO/tu-dominio-real/' /etc/nginx/sites-available/techrag
sudo ln -s /etc/nginx/sites-available/techrag /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d rag.TU_DOMINIO.duckdns.org   # sudo apt install certbot python3-certbot-nginx si no está
```

## 6. Verificar

```bash
curl https://rag.TU_DOMINIO.duckdns.org/api/health
```

## Actualizar a una nueva versión

```bash
cd /opt/techrag-assistant
sudo -u techrag git pull
sudo -u techrag npm ci --legacy-peer-deps && sudo -u techrag npx prisma generate
sudo -u techrag npx prisma migrate deploy
sudo systemctl restart techrag
```

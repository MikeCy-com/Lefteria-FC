# Lefteria FC — Hostinger Docker Manager Deployment Guide

This guide assumes your VPS uses **Hostinger Docker Manager** with the shared **Traefik** reverse proxy (default setup). Traefik handles SSL automatically via Let's Encrypt.

## 1. Prerequisites on Hostinger VPS

✅ Hostinger Docker Manager is enabled.
✅ Traefik is running (Hostinger sets this up automatically).
✅ A Docker network named **`traefik-proxy`** exists (it does on Hostinger by default).
✅ DNS: `lefteriafc.cy` and `www.lefteriafc.cy` → your VPS public IP (A records).

Verify:
```bash
docker network ls | grep traefik-proxy
```

If missing (rare on Hostinger), create it:
```bash
docker network create traefik-proxy
```

## 2. Pull the latest code

```bash
cd /docker/lefteriafc
git pull origin main
```

## 3. Create `.env` beside `docker-compose.yml`

Copy the example and edit:
```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

Required values:
- `JWT_SECRET` — long random string (`openssl rand -hex 64`)
- `ADMIN_PASSWORD` — your admin login password
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — for push notifications (`npx web-push generate-vapid-keys`)

## 4. Build & deploy

From the **`deploy/`** folder (where docker-compose.yml lives):
```bash
cd /docker/lefteriafc/deploy
docker compose --env-file .env up -d --build
```

> **NOTE:** The compose file builds from `../backend` and `../frontend` (the live source folders in the repo). There are no longer duplicate copies under `deploy/backend` or `deploy/frontend`. Always pull the whole repo.

Watch logs:
```bash
docker compose logs -f
```

Wait until you see `Application startup complete.` (backend) and the frontend nginx ready.

## 5. Verify Traefik routing

```bash
docker network inspect traefik-proxy | grep -A2 lefteriafc-frontend
```

Visit:
- **https://lefteriafc.cy** → public site
- **https://lefteriafc.cy/admin/login** → admin panel

Traefik automatically requests a Let's Encrypt SSL cert the first time (allow ~30 seconds).

## 6. One-time seed (Academy opponents/fields from preview)

```bash
docker compose exec backend python /app/deploy/seed_academy_data.py
```

## 7. Updating later

Whenever code changes:
```bash
cd /docker/lefteriafc
git pull origin main
cd deploy
docker compose --env-file .env up -d --build
```

Mongo data is **preserved** because it lives on the `mongo_data` Docker volume.

## Troubleshooting

### 404 / "default backend"
- Make sure the frontend container is on the **`traefik-proxy`** network: `docker inspect lefteriafc-frontend --format '{{json .NetworkSettings.Networks}}'`
- Check Traefik picks up the labels: `docker logs <traefik-container> 2>&1 | grep lefteriafc`
- DNS must resolve to the VPS IP: `dig lefteriafc.cy`

### SSL cert not issued
- Hostinger's Traefik uses `letsencrypt` as the certresolver name (matches our config).
- Let's Encrypt rate-limits after too many requests — wait 1 hour before retrying.
- Make sure port 80 + 443 are open on the VPS firewall (Hostinger has them open by default).

### Backend not reachable from frontend
- Both containers must share the `lefteriafc-internal` network (they do automatically per the compose file).
- Inside the frontend container, the backend is reachable as `http://backend:8001`.

### Reset Mongo (DESTRUCTIVE)
```bash
docker compose down
docker volume rm deploy_mongo_data    # name = <project>_mongo_data
docker compose --env-file .env up -d --build
```

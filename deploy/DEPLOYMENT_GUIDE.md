# Lefteria FC - Deployment Guide
# Hostinger VPS KVM 1 + Docker + Ubuntu 24.04

## Step 1: Access Your VPS

After setting up your Hostinger VPS with Docker Ubuntu 24.04:

```
ssh root@YOUR_VPS_IP
```

## Step 2: Upload Project Files

From your local machine, upload the deploy folder:

```
scp -r deploy/* root@YOUR_VPS_IP:/root/lefteria-fc/
```

Or use FileZilla/WinSCP to upload all files to `/root/lefteria-fc/`

Your folder structure should be:
```
/root/lefteria-fc/
  docker-compose.yml
  deploy.sh
  .env.example
  backend/
    Dockerfile
    server.py
    models.py
    database.py
    auth.py
    routes/
    requirements.txt
  frontend/
    Dockerfile
    nginx.conf
    src/
    public/
    package.json
    yarn.lock
    tailwind.config.js
```

## Step 3: Configure Environment

```bash
cd /root/lefteria-fc

# Create .env from example
cp .env.example .env

# Edit .env - IMPORTANT: set your domain/IP
nano .env
```

Change `DOMAIN_URL=http://YOUR_VPS_IP` to your actual VPS IP, e.g.:
```
DOMAIN_URL=http://123.45.67.89
```

If you have a domain name later:
```
DOMAIN_URL=https://lefteriafc.com
```

## Step 4: Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

That's it! The script will:
1. Build the backend (Python/FastAPI)
2. Build the frontend (React -> Nginx)
3. Start MongoDB
4. Start everything

## Step 5: Verify

Open your browser:
- Website: `http://YOUR_VPS_IP`
- Admin: `http://YOUR_VPS_IP/admin`
- Mobile App: `http://YOUR_VPS_IP/app`

---

## Adding a Domain Name (Optional)

1. Buy a domain (e.g. lefteriafc.com)
2. In your domain DNS settings, add an A record:
   - Type: A
   - Name: @ 
   - Value: YOUR_VPS_IP
3. Update `.env`:
   ```
   DOMAIN_URL=https://lefteriafc.com
   ```
4. Rebuild: `docker compose up -d --build`

## Adding SSL/HTTPS (Optional, after domain setup)

```bash
# Install certbot
apt install certbot
certbot certonly --standalone -d lefteriafc.com

# Copy certs
mkdir -p /root/lefteria-fc/nginx/ssl
cp /etc/letsencrypt/live/lefteriafc.com/fullchain.pem /root/lefteria-fc/nginx/ssl/
cp /etc/letsencrypt/live/lefteriafc.com/privkey.pem /root/lefteria-fc/nginx/ssl/
```

Then update `frontend/nginx.conf` to add HTTPS server block.

---

## Useful Commands

```bash
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Rebuild and restart (after code changes)
docker compose up -d --build

# Backup MongoDB
docker exec lefteria-mongo mongodump --out /dump
docker cp lefteria-mongo:/dump ./backup_$(date +%Y%m%d)

# Restore MongoDB
docker cp ./backup_folder lefteria-mongo:/dump
docker exec lefteria-mongo mongorestore /dump
```

## Troubleshooting

**Port 80 already in use:**
```bash
sudo systemctl stop apache2   # if Apache is running
sudo systemctl disable apache2
```

**Backend not connecting to MongoDB:**
```bash
docker compose logs backend    # check error
docker compose restart backend
```

**Out of disk space:**
```bash
docker system prune -a    # clean unused images
```

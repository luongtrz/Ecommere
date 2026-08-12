# Deployment

The production stack is the root `compose.yaml`: Caddy, the user frontend/backend, the admin frontend/backend, and Redis. PostgreSQL is external and must be provisioned separately.

## Prerequisites

- Docker Engine with Docker Compose v2 on the target host.
- A PostgreSQL database reachable by both backends.
- Cloudinary credentials for image uploads.
- DNS for the hostnames in `deploy/caddy/Caddyfile`.

## Deploy

From the repository root, provide the target connection details without putting them in the script or in Git:

```bash
REMOTE_USER=deploy \
REMOTE_HOST=your-server.example.com \
SSH_KEY=/path/to/private-key \
REMOTE_PATH=/home/deploy/thaispray \
./deploy-to-azure.sh
```

On the target host:

```bash
cd /home/deploy/thaispray
cp user_ecommere/backend/.env.example user_ecommere/backend/.env
cp admin_ecommere/backend/.env.example admin_ecommere/backend/.env
# Edit both .env files with production values; never commit them.
./setup-azure.sh
```

`setup-azure.sh` validates required secrets and starts the Compose stack. It does not provision PostgreSQL, generate credentials, seed data, or print environment files.

## Local seed data

The Prisma seed is destructive and now requires explicit credentials:

```bash
SEED_DATABASE=true \
SEED_ADMIN_PASSWORD='choose-a-local-admin-password' \
SEED_USER_PASSWORD='choose-a-local-user-password' \
npm run prisma:seed
```

Do not run the seed against production.

## Operations

```bash
docker compose ps
docker compose logs -f backend admin-backend
docker compose restart backend admin-backend
```

Public access is provided through the configured Caddy hostnames. Keep the backend ports private to the Docker network and terminate TLS at Caddy.

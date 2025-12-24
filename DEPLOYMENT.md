# Deployment Scripts for Azure VM

## Quick Deploy

### 1. Deploy from Windows to Azure VM
```bash
./deploy-to-azure.sh
```

This will:
- Sync only necessary files (excludes node_modules, dist, logs, etc.)
- Use rsync for efficient transfer
- Preserve file permissions

### 2. Setup on Azure VM
SSH into the VM and run:
```bash
ssh -i C:/Users/ADMIN/.ssh/id_rsa_azure_luong luongazure@20.2.66.240
cd ~/shopeeThai
chmod +x setup-azure.sh
./setup-azure.sh
```

This will:
- Install Node.js 20.x
- Install PostgreSQL
- Create database and user
- Setup .env files
- Install dependencies
- Run migrations and seed
- Build frontend and backend
- Start services with PM2

## Manual Commands

### Deploy only
```bash
rsync -avz --progress \
  -e "ssh -i C:/Users/ADMIN/.ssh/id_rsa_azure_luong -p 22" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='uploads' \
  --exclude='*.log' \
  ./ luongazure@20.2.66.240:~/shopeeThai/
```

### Quick restart services
```bash
ssh luongazure@20.2.66.240 "cd ~/shopeeThai && pm2 restart all"
```

### View logs
```bash
ssh luongazure@20.2.66.240 "pm2 logs"
```

## Access Points

After deployment:
- **Frontend**: http://20.2.66.240:3000
- **Backend API**: http://20.2.66.240:4000/api
- **Swagger Docs**: http://20.2.66.240:4000/api

## Default Credentials

- **Admin**: admin@shop.local / Admin@123
- **Customer**: user@shop.local / User@123

# Portainer Deployment Guide for TrueNAS

## Quick Deploy in Portainer

### Option 1: Deploy from Git Repository

1. **Go to Portainer** → Stacks → Add Stack
2. **Select "Repository"**
3. **Enter Repository URL**: `https://github.com/hari-craz/smart-classroom-tracker.git`
4. **Compose path**: `docker-compose.prod.yml`
5. **Set Environment Variables** (optional):
   - `DB_PASSWORD`: Your database password
   - `JWT_SECRET_KEY`: Your JWT secret
   - `ADMIN_API_URL`: http://YOUR_TRUENAS_IP:8089
   - `STAFF_API_URL`: http://YOUR_TRUENAS_IP:8089

6. **Click Deploy**

### Option 2: Manual Stack Creation

1. **Go to Portainer** → Stacks → Add Stack
2. **Select "Web editor"**
3. **Paste the contents of `docker-compose.prod.yml`**
4. **Click Deploy**

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Admin Portal | 8090 | Admin dashboard |
| Staff Portal | 8091 | Staff booking portal |
| Backend API | 8089 | REST API server |
| Database | 5432 | PostgreSQL |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_PASSWORD | classroom_secure_password | PostgreSQL password |
| JWT_SECRET_KEY | (auto-generated) | JWT signing key |
| ADMIN_API_URL | http://localhost:8089 | API URL for admin frontend |
| STAFF_API_URL | http://localhost:8089 | API URL for staff frontend |

## Important: Update API URLs

For TrueNAS deployment, you need to set the API URLs to your TrueNAS IP:

```
ADMIN_API_URL=http://192.168.1.100:8089
STAFF_API_URL=http://192.168.1.100:8089
```

Replace `192.168.1.100` with your actual TrueNAS IP address.

## Default Login Credentials

After first deployment, create users via the API:

```bash
# Create admin user
curl -X POST http://YOUR_IP:8089/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@local","password":"admin123","role":"admin"}'

# Create staff user  
curl -X POST http://YOUR_IP:8089/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"staff","email":"staff@local","password":"pass123","role":"staff"}'
```

## Persistent Data

The PostgreSQL data is stored in a Docker volume named `postgres_data`. This ensures data persists across container restarts.

## Troubleshooting

### Containers not starting
- Check Portainer logs for each container
- Ensure ports 8089, 8090, 8091, 5432 are not in use

### Cannot connect to API
- Verify the API URL matches your TrueNAS IP
- Check if the backend container is healthy
- Review backend logs in Portainer

### Database connection issues
- Wait for the database health check to pass
- Check if postgres_data volume is properly mounted

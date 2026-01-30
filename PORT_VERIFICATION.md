# Portainer Deployment - Port Configuration Verification

## ✅ Container Port Mappings

### 1. Database Container (classroom_db)
- **Image**: `postgres:15-alpine`
- **Internal Port**: `5432`
- **Exposed**: `expose: - "5432"` (internal only, not published to host)
- **Network**: `classroom_network`
- **Status**: ✅ CORRECT - Database only needs internal access from backend

### 2. Backend API Container (classroom_api)
- **Image**: `smartclassroomutilizationtrackerwithpowermanagement-backend:latest`
- **Internal Port**: `5000` (gunicorn binds to 0.0.0.0:5000)
- **Published Port**: `8089:5000` (Host:Container)
- **Network**: `classroom_network`
- **Dockerfile Expose**: `EXPOSE 5000`
- **Status**: ✅ CORRECT - API accessible at port 8089

### 3. Admin Frontend Container (classroom_admin_ui)
- **Image**: `smartclassroomutilizationtrackerwithpowermanagement-admin-frontend:latest`
- **Internal Port**: `80` (nginx)
- **Published Port**: `8090:80` (Host:Container)
- **Network**: `classroom_network`
- **Dockerfile Expose**: `EXPOSE 80`
- **Environment**: `REACT_APP_API_URL=${ADMIN_API_URL:-http://localhost:8089}`
- **Status**: ✅ CORRECT - Admin UI accessible at port 8090

### 4. Staff Frontend Container (classroom_staff_ui)
- **Image**: `smartclassroomutilizationtrackerwithpowermanagement-staff-frontend:latest`
- **Internal Port**: `80` (nginx)
- **Published Port**: `8091:80` (Host:Container)
- **Network**: `classroom_network`
- **Dockerfile Expose**: `EXPOSE 80`
- **Environment**: `REACT_APP_API_URL=${STAFF_API_URL:-http://localhost:8089}`
- **Status**: ✅ CORRECT - Staff UI accessible at port 8091

---

## 🔧 Port Consistency Check

| Service | Dockerfile EXPOSE | Container Internal | Host Published | Status |
|---------|------------------|-------------------|----------------|--------|
| Database | N/A (postgres:15) | 5432 | None (internal) | ✅ |
| Backend | 5000 | 5000 | 8089 | ✅ |
| Admin UI | 80 | 80 | 8090 | ✅ |
| Staff UI | 80 | 80 | 8091 | ✅ |

---

## 🌐 Network Configuration

- **Network Name**: `classroom_network`
- **Driver**: `bridge`
- **All containers**: Connected to same network for internal communication
- **DNS Resolution**: Services can reach each other by service name (e.g., `db:5432`)

---

## 📋 Environment Variables Required for Portainer

```env
DB_PASSWORD=classroom_secure_password
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this
ADMIN_API_URL=http://YOUR_TRUENAS_IP:8089
STAFF_API_URL=http://YOUR_TRUENAS_IP:8089
```

Replace `YOUR_TRUENAS_IP` with actual TrueNAS IP address (e.g., `192.168.1.100`)

---

## 🚀 Access URLs After Deployment

Once deployed on TrueNAS (example IP: 192.168.1.100):
- **Admin Portal**: http://192.168.1.100:8090
- **Staff Portal**: http://192.168.1.100:8091
- **Backend API**: http://192.168.1.100:8089
- **Database**: Internal only (not accessible from outside)

---

## ✅ Verification Summary

**All port configurations are CORRECT:**
1. ✅ No port conflicts between containers
2. ✅ Backend exposes 5000, published on 8089
3. ✅ Admin frontend exposes 80, published on 8090
4. ✅ Staff frontend exposes 80, published on 8091
5. ✅ Database exposed internally only (secure)
6. ✅ All services on same bridge network
7. ✅ Environment variables properly configured
8. ✅ Dockerfiles match compose configuration

**Ready for Portainer deployment! 🎯**

---

## 📝 Deployment Files

- **For Portainer Repository Method**: Use `docker-compose.prod.yml`
- **For Portainer Web Editor**: Use `docker-compose.prod.portainer.yml`
- Both files have identical port configurations

---

## ⚠️ Important Notes

1. **Images must exist** before deployment:
   - Either build locally first, OR
   - Use Web Editor method in Portainer
   
2. **Database initialization**:
   - Schema files should be in `./database/` folder
   - `schema.sql` runs first (01-schema.sql)
   - `init-users.sql` runs second (02-init-users.sql)

3. **Health checks**:
   - Database: `pg_isready` check every 10s
   - Backend: Waits for DB to be healthy before starting

4. **Restart policy**: All containers set to `restart: unless-stopped`

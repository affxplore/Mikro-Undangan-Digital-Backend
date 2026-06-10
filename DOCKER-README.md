# 🐳 Docker Setup untuk Mikro Undangan API

## 🚀 Cara Menjalankan Aplikasi dengan Docker

### 1. Build Docker Image
```bash
docker build -t mikro-undangan-api .
```

### 2. Jalankan Container
```bash
# Dengan environment variables dari file .env
docker run -p 2222:2222 --env-file .env mikro-undangan-api

# Atau dengan environment variables manual
docker run -p 2222:2222 \
  -e NODE_ENV=production \
  -e PORT=2222 \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASS=your_db_password \
  -e DB_NAME=your_db_name \
  -e DB_PORT=5432 \
  -e DB_DIALECT=postgres \
  mikro-undangan-api
```

### 3. Jalankan Container di Background
```bash
docker run -d -p 2222:2222 --name mikro-undangan-container --env-file .env mikro-undangan-api
```

### 4. Monitoring Container
```bash
# Lihat logs
docker logs mikro-undangan-container

# Lihat logs secara real-time
docker logs -f mikro-undangan-container

# Cek status container
docker ps

# Masuk ke dalam container
docker exec -it mikro-undangan-container sh
```

### 5. Stop dan Remove Container
```bash
# Stop container
docker stop mikro-undangan-container

# Remove container
docker rm mikro-undangan-container

# Remove image
docker rmi mikro-undangan-api
```

## 📋 Menggunakan NPM Scripts

```bash
# Build image
npm run docker:build

# Run container dengan .env file
npm run docker:run
```

## 🔧 Environment Variables

Pastikan file `.env` sudah dikonfigurasi dengan benar:

```env
NODE_ENV=production
PORT=2222
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name
DB_PORT=5432
DB_DIALECT=postgres
# ... other environment variables
```

## 📱 Akses Aplikasi

Setelah container berjalan, aplikasi dapat diakses di:
- **Local**: http://localhost:2222
- **Health Check**: http://localhost:2222/api

## 🔍 Troubleshooting

1. **Port sudah digunakan**:
   ```bash
   # Cek port yang digunakan
   netstat -tulpn | grep 2222
   
   # Gunakan port lain
   docker run -p 3000:2222 --env-file .env mikro-undangan-api
   ```

2. **Database connection error**:
   - Pastikan database host dapat diakses dari container
   - Periksa kredential database di file `.env`
   - Untuk database lokal, gunakan host `host.docker.internal` instead of `localhost`

3. **File permission error**:
   ```bash
   # Pastikan direktori uploads dapat ditulis
   docker run -v $(pwd)/public/uploads:/usr/src/app/public/uploads --env-file .env mikro-undangan-api
   ```

## 💡 Tips

- Gunakan volume untuk direktori uploads: `-v ./public/uploads:/usr/src/app/public/uploads`
- Untuk development, mount source code: `-v ./:/usr/src/app`
- Gunakan Docker networks untuk menghubungkan dengan database container
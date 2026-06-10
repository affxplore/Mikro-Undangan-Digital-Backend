# Gunakan base image Node.js versi LTS Alpine (lebih kecil dan aman)
FROM node:20-alpine

# Install dumb-init untuk proper signal handling
RUN apk add --no-cache dumb-init

# Buat user non-root untuk keamanan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Buat direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json untuk layer caching yang optimal
COPY package*.json ./

# Install dependensi dengan npm ci untuk production (lebih cepat dan konsisten)
RUN npm ci --omit=dev && npm cache clean --force

# Salin seluruh kode aplikasi
COPY . .

# Buat direktori uploads dan set ownership
RUN mkdir -p /usr/src/app/public/uploads && \
    chown -R nodeuser:nodejs /usr/src/app

# Set environment ke production
ENV NODE_ENV=production

# Expose port yang digunakan aplikasi (dari .env PORT=2222)
EXPOSE 2222

# Switch ke user non-root
USER nodeuser

# Health check untuk monitoring (simple check tanpa database)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:2222', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Gunakan dumb-init untuk proper signal handling dan graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Perintah untuk menjalankan aplikasi
CMD ["node", "app.js"]
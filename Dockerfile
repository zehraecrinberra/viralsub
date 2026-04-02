FROM node:20-alpine

RUN apk add --no-cache ffmpeg font-noto font-noto-arabic fontconfig

WORKDIR /app

# Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Install backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend/ ./backend/

# Ensure writable directories exist with correct permissions
RUN mkdir -p /app/backend/uploads /app/backend/outputs /app/backend/temp /app/backend/data \
    && chmod -R 777 /app/backend/uploads /app/backend/outputs /app/backend/temp /app/backend/data

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "index.js"]

FROM node:20-alpine

RUN apk add --no-cache ffmpeg

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

RUN mkdir -p backend/uploads backend/outputs backend/temp backend/data

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "index.js"]

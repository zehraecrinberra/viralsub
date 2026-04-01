# ViralSub - Go Viral Globally

AI-powered subtitle generator for short-form video content creators.

## Features
- Video upload (up to 60 seconds)
- Whisper AI transcription
- Multi-language translation (EN, ES, AR)
- Viral hook generation with GPT
- TikTok-style subtitle styles
- 9:16 MP4 export
- Free / Premium plans

## Quick Start

### 1. Setup backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm install
npm run dev
```

### 2. Setup frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker (Production)
```bash
cp backend/.env.example backend/.env
# Set OPENAI_API_KEY in backend/.env
docker-compose up --build
```
Open http://localhost:3000

## Environment Variables
- `OPENAI_API_KEY` — Required for real Whisper + GPT (works without it in demo mode)
- `JWT_SECRET` — Secret for JWT tokens
- `PORT` — Backend port (default 5000)

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express
- **AI**: OpenAI Whisper (transcription) + GPT-4o-mini (translation & hooks)
- **Video**: FFmpeg (subtitle burn-in, 9:16 conversion)
- **Auth**: JWT (email/password)

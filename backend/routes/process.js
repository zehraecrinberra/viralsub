import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcribeAudio } from '../services/whisper.js';
import { translateText, generateHooks } from '../services/gpt.js';
import { extractAudio } from '../services/ffmpeg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.post('/transcribe', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename required' });
    
    const videoPath = path.join(__dirname, '../uploads', filename);
    const audioPath = path.join(__dirname, '../temp', `${Date.now()}.mp3`);
    
    await extractAudio(videoPath, audioPath);
    const transcription = await transcribeAudio(audioPath);
    
    res.json({ transcription });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Transcription failed' });
  }
});

router.post('/translate', async (req, res) => {
  try {
    const { text, languages } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    
    const targetLangs = languages || ['en', 'es', 'ar'];
    const translations = {};
    
    for (const lang of targetLangs) {
      translations[lang] = await translateText(text, lang);
    }
    
    res.json({ translations });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
});

router.post('/hooks', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    
    const hooks = await generateHooks(text, language || 'en');
    res.json({ hooks });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Hook generation failed' });
  }
});

export default router;

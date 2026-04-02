import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { optionalAuth } from '../middleware/auth.js';
import { burnSubtitles } from '../services/ffmpeg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.post('/render', optionalAuth, async (req, res) => {
  try {
    const { filename, subtitles, hook, style, plan } = req.body;
    if (!filename || !subtitles) return res.status(400).json({ error: 'Missing required fields' });
    
    const inputPath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found. It may have expired. Please re-upload your video.' });
    }
    const outputDir = path.join(__dirname, '../outputs');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputId = uuidv4();
    const outputPath = path.join(outputDir, `${outputId}.mp4`);
    
    const isPremium = plan === 'premium' || (req.user?.plan === 'premium');
    const quality = isPremium ? 'hd' : '720p';
    const watermark = !isPremium;
    
    await burnSubtitles({ inputPath, outputPath, subtitles, hook, style, watermark, quality });
    
    res.json({
      outputId,
      downloadUrl: `/outputs/${outputId}.mp4`,
      watermark,
      quality
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

export default router;

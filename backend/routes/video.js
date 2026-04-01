import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { optionalAuth } from '../middleware/auth.js';
import { getVideoMetadata } from '../services/ffmpeg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mov|avi|webm|mkv/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  }
});

router.post('/upload', optionalAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    // Try to get metadata via ffprobe; gracefully skip if ffprobe is unavailable
    let metadata = { duration: null, width: null, height: null };
    try {
      metadata = await getVideoMetadata(req.file.path);
      if (metadata.duration > 60) {
        return res.status(400).json({ error: 'Video must be 60 seconds or less' });
      }
    } catch (ffErr) {
      // ffprobe not installed or unreadable file — skip duration check, allow upload
      console.warn('FFprobe unavailable, skipping duration check:', ffErr.message);
    }

    res.json({
      id: path.basename(req.file.filename, path.extname(req.file.filename)),
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      ffprobeAvailable: metadata.duration !== null
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export default router;

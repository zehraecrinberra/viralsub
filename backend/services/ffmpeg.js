import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
  // Derive ffprobe path from ffmpeg path (same bin directory)
  const ffprobePath = process.env.FFMPEG_PATH.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  ffmpeg.setFfprobePath(ffprobePath);
}

export function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        duration: metadata.format.duration,
        width: videoStream?.width,
        height: videoStream?.height,
        format: metadata.format.format_name
      });
    });
  });
}

export function extractAudio(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

export function burnSubtitles({ inputPath, outputPath, subtitles, hook, style, watermark, quality }) {
  return new Promise((resolve, reject) => {
    const subtitleStyle = getSubtitleStyle(style || 'tiktok');

    // Create SRT file in temp directory (guaranteed writable)
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const srtPath = path.join(tempDir, path.basename(outputPath).replace('.mp4', '.srt'));
    fs.writeFileSync(srtPath, generateSRT(subtitles));

    // Escape text for FFmpeg drawtext (single-quotes + special chars)
    const escapeDrawtext = (t) => t.replace(/\\/g, '\\\\').replace(/'/g, "\u2019").replace(/:/g, '\\:');

    const targetWidth  = quality === 'hd' ? 1080 : 720;
    const targetHeight = quality === 'hd' ? 1920 : 1280;
    const hookSize     = quality === 'hd' ? 52   : 36;

    // Build filter chain as a single -vf string (comma-separated)
    // NOTE: drawtext does NOT support fontweight= ; bold is via a bold font file.
    //       We use box+boxcolor for the hook to make it visually prominent instead.
    const filterParts = [
      `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
      `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`,
    ];

    if (hook) {
      const ht = escapeDrawtext(hook);
      filterParts.push(
        `drawtext=text='${ht}':fontsize=${hookSize}:fontcolor=white` +
        `:bordercolor=black:borderw=4:x=(w-text_w)/2:y=h*0.08:font=Arial`
      );
    }

    if (watermark) {
      filterParts.push(
        `drawtext=text='Translated with ViralSub':fontsize=22:fontcolor=white` +
        `:bordercolor=black:borderw=2:x=w-text_w-16:y=h-50:font=Arial`
      );
    }

    // Subtitle style config
    const srtEscaped = srtPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1\\:');
    const subStyle = subtitleStyle === 'tiktok'
      ? `FontName=Arial,FontSize=22,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=80`
      : subtitleStyle === 'bold'
        ? `FontName=Arial,FontSize=24,Bold=1,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,MarginV=60`
        : `FontName=Arial,FontSize=20,Bold=0,PrimaryColour=&H00F3F4F6,OutlineColour=&H00000000,BorderStyle=1,Outline=1,MarginV=60`;

    filterParts.push(`subtitles='${srtEscaped}':force_style='${subStyle}'`);

    const vfString = filterParts.join(',');

    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-crf 23', '-preset fast', '-movflags +faststart'])
      .outputOptions([`-vf`, vfString])
      .output(outputPath)
      .on('end', () => {
        if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
        resolve();
      })
      .on('error', (err) => {
        if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
        reject(err);
      })
      .run();
  });
}

function getSubtitleStyle(style) {
  const styles = { tiktok: 'tiktok', minimal: 'minimal', bold: 'bold' };
  return styles[style] || 'tiktok';
}

function generateSRT(subtitles) {
  if (!Array.isArray(subtitles)) return '';
  return subtitles.map((sub, i) => {
    const start = formatSRTTime(sub.start || 0);
    const end = formatSRTTime(sub.end || (sub.start + 3));
    return `${i + 1}\n${start} --> ${end}\n${sub.text}\n`;
  }).join('\n');
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

import OpenAI from 'openai';
import fs from 'fs';

// Lazy client — reads env at call time, not at module load time
const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const isMockMode = () =>
  !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
  process.env.OPENAI_API_KEY === 'placeholder';

export async function transcribeAudio(audioPath) {
  try {
    if (isMockMode()) {
      return {
        text: "This is a mock transcription. Add your OpenAI API key to enable real transcription.",
        segments: [
          { start: 0, end: 3, text: "This is a mock transcription." },
          { start: 3, end: 7, text: "Add your OpenAI API key to enable real transcription." }
        ],
        words: [
          { word: "This", start: 0, end: 0.3 },
          { word: "is", start: 0.3, end: 0.5 },
          { word: "a", start: 0.5, end: 0.6 },
          { word: "mock", start: 0.6, end: 0.9 },
          { word: "transcription.", start: 0.9, end: 1.5 },
          { word: "Add", start: 3, end: 3.3 },
          { word: "your", start: 3.3, end: 3.5 },
          { word: "OpenAI", start: 3.5, end: 3.9 },
          { word: "API", start: 3.9, end: 4.2 },
          { word: "key", start: 4.2, end: 4.5 },
          { word: "to", start: 4.5, end: 4.6 },
          { word: "enable", start: 4.6, end: 5.0 },
          { word: "real", start: 5.0, end: 5.3 },
          { word: "transcription.", start: 5.3, end: 5.8 }
        ]
      };
    }

    const audioStream = fs.createReadStream(audioPath);
    const response = await getClient().audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word']
    });

    return {
      text: response.text,
      segments: response.segments || [],
      words: response.words || []
    };
  } finally {
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
}

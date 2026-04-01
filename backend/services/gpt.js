import OpenAI from 'openai';

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const isMockMode = () =>
  !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
  process.env.OPENAI_API_KEY === 'placeholder';

const LANGUAGE_NAMES = { en: 'English', es: 'Spanish', ar: 'Arabic', tr: 'Turkish' };

export async function translateText(text, targetLang) {
  if (isMockMode()) {
    return `[${LANGUAGE_NAMES[targetLang] || targetLang} translation of: ${text}]`;
  }

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the given text to ${LANGUAGE_NAMES[targetLang] || targetLang}. Return only the translated text, no explanations.`
      },
      { role: 'user', content: text }
    ],
    temperature: 0.3
  });

  return response.choices[0].message.content.trim();
}

export async function generateHooks(text, language) {
  if (isMockMode()) {
    return [
      "Nobody will tell you this...",
      "This changed everything...",
      "Before you watch this..."
    ];
  }

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a viral content expert. Based on the video content, generate exactly 3 viral hook phrases in ${LANGUAGE_NAMES[language] || 'English'}.

Format your response as a JSON object with a "hooks" array containing exactly 3 strings.
Make them compelling, curiosity-driven, and suitable for TikTok/Reels/Shorts.
Examples:
- "Nobody will tell you this..."
- "This changed everything..."
- "Before you watch this..."
- "I wish I knew this earlier..."
- "Stop what you're doing and watch this..."`
      },
      { role: 'user', content: `Video content: ${text}` }
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' }
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed.hooks || parsed.options || Object.values(parsed).flat().slice(0, 3);
  } catch {
    return ["Nobody will tell you this...", "This changed everything...", "Before you watch this..."];
  }
}

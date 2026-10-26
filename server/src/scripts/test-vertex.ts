import { GoogleGenAI } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
  });

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const m of models) {
    try {
      console.log(`Testing with API Key - Model: ${m}...`);
      const resp = await ai.models.generateContent({
        model: m,
        contents: 'Say hello in 2 words'
      });
      console.log(`SUCCESS [${m}]:`, resp.text);
      break;
    } catch (e: any) {
      console.log(`FAIL [${m}]:`, e.message?.slice(0, 150));
    }
  }
}

test();

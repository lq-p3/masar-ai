import { GoogleAuth } from 'google-auth-library';

async function test() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const client = await auth.getClient();
  const projectId = 'masar-ai-504916';
  const location = 'us-central1';

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash:generateContent`;

  console.log(`Calling Vertex AI URL: ${url}`);
  try {
    const res = await client.request({
      url,
      method: 'POST',
      data: {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello! Respond with: Vertex AI is working perfectly!' }]
          }
        ]
      }
    });

    console.log('RESPONSE:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error('ERROR STATUS:', err.response?.status);
    console.error('ERROR DATA:', err.response?.data);
  }
}

test();

import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeFood = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { foodName } = req.body;

    if (!foodName || typeof foodName !== 'string') {
      res.status(400).json({ error: 'Food name is required' });
      return;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this food: "${foodName}"

Please provide the following information in JSON format:
{
  "emoji": "appropriate emoji for this food (single emoji)",
  "servingSize": "typical serving size (e.g., '1 medium', '100g', '1 cup')",
  "calories": number (approximate calories per serving),
  "nutrition": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams)
  }
}

Return ONLY valid JSON, no additional text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const foodData = JSON.parse(jsonText);

    res.status(200).json(foodData);
  } catch (error) {
    console.error('Error analyzing food:', error);
    res.status(500).json({ 
      error: 'Failed to analyze food',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


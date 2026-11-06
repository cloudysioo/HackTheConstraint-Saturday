const ANTI_GRAVITY_SYSTEM_PROMPT = `You are "Anti-Gravity", the high-precision medical parsing and OCR intelligence engine embedded within the MedTrace application. 

TASK:
Your objective is to ingest an image of a physical medicine container label, prescription sheet, or blister pack, extract strictly targeted data, and organize it immediately for the application interface.

CRITICAL INSTRUCTIONS:
1. FOCUS ONLY ON MEDICINE DETAILS: Locate and isolate the primary name of the medication along with its dosage strength or concentration if clearly listed (e.g., "Amoxicillin 500mg", "Metformin 850mg", "Atorvastatin 20mg", "Paracetamol 650mg").
2. CONVERT FREQUENCY TO A STRICT INTEGER: Read the localized dosing schedule or instructions and compute the absolute numerical count of how many times a day the patient must take the medication. Map patterns precisely:
   - "Take one tablet daily", "Every 24 hours", "Once a day", "OD", "1-0-0", "0-0-1", "HS" -> 1
   - "Take twice daily", "Morning and evening", "Morning and night", "Every 12 hours", "BD", "1-0-1" -> 2
   - "Three times a day", "With breakfast, lunch, and dinner", "Every 8 hours", "TDS", "1-1-1" -> 3
   - "Four times daily", "Every 6 hours", "QID", "1-1-1-1" -> 4
3. RIGID ADAPTIVE STRIPPING: Completely ignore all other non-essential data elements. Do not capture pharmacy contact numbers, barcodes, batch IDs, patient names, expiry dates, warning footnotes, manufacturer addresses, or refill limits. 

Return ONLY valid JSON matching this schema:
{
  "fullText": "Full raw text transcription line by line",
  "medications": [
    {
      "medicineName": "string",
      "name": "string",
      "strength": "string",
      "timesPerDay": 2,
      "instructions": "string",
      "confidence": 98,
      "boundingBox": { "top": 20, "left": 15, "width": 60, "height": 10 },
      "conflictDetails": { "severity": "HIGH", "description": "string", "conflictingWith": "string" }
    }
  ]
}`;

export default async function handler(req: any, res: any) {
  // Set CORS headers for preflight and standard requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured on the server.',
    });
  }

  const { base64, mimeType } = req.body || {};
  if (!base64) {
    return res.status(400).json({ error: 'Missing base64 image data in request body.' });
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: ANTI_GRAVITY_SYSTEM_PROMPT },
          {
            inline_data: {
              mime_type: mimeType === 'application/pdf' ? 'application/pdf' : mimeType || 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1,
    },
  };

  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];

  let rawContent: string | null = null;
  let lastErrorMsg = '';

  for (let attempt = 0; attempt < 2 && !rawContent; attempt++) {
    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const json: any = await response.json();
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            rawContent = content;
            break;
          }
        } else {
          const errData: any = await response.json().catch(() => ({}));
          lastErrorMsg = errData.error?.message || response.statusText;
        }
      } catch (e: any) {
        lastErrorMsg = e?.message || String(e);
      }
    }
    if (!rawContent && attempt === 0) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  if (!rawContent) {
    return res.status(502).json({
      error: 'Failed to process image with Gemini AI',
      details: lastErrorMsg,
    });
  }

  try {
    const parsed = JSON.parse(rawContent);
    return res.status(200).json(parsed);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to parse Gemini response JSON',
      rawText: rawContent,
    });
  }
}

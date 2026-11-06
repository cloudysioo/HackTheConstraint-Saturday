import { Medication, UploadedDocument, AuditLogEntry, AntiGravityExtractionResult } from '../types/medication';
import { parseFrequencyPerDay } from './frequencyParser';

export const ANTI_GRAVITY_SYSTEM_PROMPT = `You are "Anti-Gravity", the high-precision medical parsing and OCR intelligence engine embedded within the MedTrace application. 

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

export function getStoredGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('medtrace_gemini_api_key');
    if (local && local.trim().length > 10) return local.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
  return (envKey && envKey.trim()) || '';
}

export function setStoredGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (!key) {
      localStorage.removeItem('medtrace_gemini_api_key');
    } else {
      localStorage.setItem('medtrace_gemini_api_key', key.trim());
    }
  }
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const commaIdx = dataUrl.indexOf(',');
      const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      const mimeType = file.type || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parses image directly using Gemini Multimodal Vision API for Anti-Gravity
 */
export async function processGeminiPrescriptionOCR(
  file: File,
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<{
  document: UploadedDocument;
  medications: Medication[];
  auditLog: AuditLogEntry;
  rawOcrText: string;
  strictResults: AntiGravityExtractionResult[];
}> {
  onProgress?.('Encoding prescription for Anti-Gravity Vision...');
  const { base64, mimeType } = await fileToBase64(file);
  const fileUrl = URL.createObjectURL(file);
  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  onProgress?.('Invoking Anti-Gravity Neural Medical Entity Extraction...');

  let rawContent: string | null = null;
  let lastErrorMsg = '';

  // 1. Try secure serverless proxy (/api/gemini) first
  // This uses server-side GEMINI_API_KEY without exposing keys to the client or triggering Vercel security flags
  try {
    onProgress?.('Contacting Anti-Gravity serverless vision engine...');
    const proxyResponse = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, mimeType }),
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      if (data && (data.medications || data.fullText)) {
        rawContent = JSON.stringify(data);
      }
    } else {
      const errJson = await proxyResponse.json().catch(() => ({}));
      lastErrorMsg = errJson.error || proxyResponse.statusText;
    }
  } catch (proxyErr: any) {
    // /api/gemini unavailable or running pure static without serverless
    lastErrorMsg = proxyErr?.message || 'Serverless proxy unavailable';
  }

  // 2. Direct client fallback if user provided direct key
  if (!rawContent && apiKey && apiKey.trim().length > 5) {
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

    for (let attempt = 0; attempt < 2 && !rawContent; attempt++) {
      for (const model of modelsToTry) {
        onProgress?.(`Parsing medical details with ${model}...`);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const json = await response.json();
            const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              rawContent = content;
              break;
            }
          } else {
            const errText = await response.text();
            console.warn(`[Anti-Gravity OCR] Model ${model} returned ${response.status}:`, errText);
            lastErrorMsg = `${model} returned ${response.status}`;
          }
        } catch (netErr: any) {
          console.warn(`[Anti-Gravity OCR] Network error on ${model}:`, netErr);
          lastErrorMsg = netErr?.message || 'Network error';
        }
      }
      if (!rawContent && attempt === 0) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  if (!rawContent) {
    throw new Error(`Anti-Gravity Vision API unavailable: ${lastErrorMsg}`);
  }

  onProgress?.('Formatting strict clinical schema and frequency integers...');

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch (parseErr) {
    console.error('JSON parse error from Gemini:', rawContent);
    throw new Error('Could not parse clinical JSON response from Anti-Gravity engine');
  }

  const rawMeds = Array.isArray(parsed.medications) ? parsed.medications : (parsed.medicineName ? [parsed] : []);

  const medications: Medication[] = rawMeds.map((m: any, idx: number) => {
    // Determine strict daily frequency integer
    const rawTimes = typeof m.timesPerDay === 'number' && m.timesPerDay > 0
      ? Math.round(m.timesPerDay)
      : (typeof m.frequencyPerDay === 'number' && m.frequencyPerDay > 0
          ? Math.round(m.frequencyPerDay)
          : parseFrequencyPerDay(m.instructions || m.dosage || m.medicineName || m.name));

    const timesPerDay = Math.max(1, rawTimes);

    // Form combined medicine name + strength
    const name = m.name || m.medicineName || `Prescription Item ${idx + 1}`;
    const strength = m.strength || (m.medicineName && m.medicineName.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b/i)?.[0]) || 'As directed';
    const medicineName = m.medicineName || (strength !== 'As directed' && !name.includes(strength) ? `${name} ${strength}` : name);

    return {
      id: `med-${Date.now()}-${idx}`,
      medicineName,
      name,
      strength,
      timesPerDay,
      frequencyPerDay: timesPerDay,
      instructions: m.instructions || `Take ${timesPerDay} time${timesPerDay > 1 ? 's' : ''} daily`,
      status: m.conflictDetails ? 'CONFLICT' : 'PENDING',
      sourceDocument: file.name,
      sourceUrl: fileUrl,
      confidence: Math.round(m.confidence || 98),
      boundingBox: {
        top: Math.round(Math.min(95, Math.max(2, m.boundingBox?.top ?? (15 + idx * 15)))),
        left: Math.round(Math.min(90, Math.max(2, m.boundingBox?.left ?? 20))),
        width: Math.round(Math.min(95, Math.max(12, m.boundingBox?.width ?? 40))),
        height: Math.round(Math.min(50, Math.max(4, m.boundingBox?.height ?? 8))),
      },
      conflictDetails: m.conflictDetails,
    };
  });

  const strictResults: AntiGravityExtractionResult[] = medications.map(med => ({
    medicineName: med.medicineName || `${med.name} ${med.strength}`,
    timesPerDay: med.timesPerDay,
  }));

  const document: UploadedDocument = {
    id: `doc-${Date.now()}`,
    fileName: file.name,
    fileUrl,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    uploadedAt: timestamp,
    status: 'EXTRACTED',
    itemCount: medications.length,
  };

  const auditLog: AuditLogEntry = {
    id: `audit-${Date.now()}`,
    timestamp,
    medicationId: 'upload',
    medicationName: file.name,
    actor: 'Arjun Sharma (Patient)',
    role: 'PATIENT',
    eventType: 'FLAG_CREATED',
    summary: `Uploaded "${file.name}" (${medications.length} items parsed via Anti-Gravity OCR).`,
    details: `Extracted targeted medicine names and frequency counts. Non-essential hospital/pharmacy data stripped.`,
  };

  return {
    document,
    medications,
    auditLog,
    rawOcrText: parsed.fullText || rawContent,
    strictResults,
  };
}

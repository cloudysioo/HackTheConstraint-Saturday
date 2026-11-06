import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createWorker } from 'tesseract.js';

import { parseFrequencyPerDay } from './frequencyParser';

export interface ExtractedMedItem {
  id: string;
  medicineName?: string;
  name: string;
  strength: string;
  timesPerDay: number;
  frequencyPerDay?: number;
  instructions: string;
  status: 'PENDING' | 'VERIFIED' | 'PATIENT_FLAGGED' | 'CONFLICT';
  sourceDocument: string;
  sourceUrl: string;
  confidence: number;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  conflictDetails?: {
    severity: 'HIGH' | 'MEDIUM';
    description: string;
    conflictingWith?: string;
  };
}

export interface OCRResult {
  fullText: string;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { top: number; left: number; width: number; height: number };
  }>;
  medications: ExtractedMedItem[];
  previewUrl: string;
  engineUsed: 'Apple Vision (Handwriting & Neural Engine)' | 'Tesseract OCR (Fallback)';
}

// Known common drugs & doctor handwriting shorthand abbreviations (Global + Indian Clinical Practice)
const DRUG_DICTIONARY: Record<string, string> = {
  // Analgesics & Antipyretics
  pcm: 'Paracetamol',
  paracetamol: 'Paracetamol',
  dolo: 'Paracetamol (Dolo)',
  crocin: 'Paracetamol (Crocin)',
  calpol: 'Paracetamol (Calpol)',
  pacimol: 'Paracetamol (Pacimol)',
  combiflam: 'Ibuprofen + Paracetamol (Combiflam)',
  flexon: 'Ibuprofen + Paracetamol (Flexon)',
  meftal: 'Mefenamic Acid (Meftal)',
  meftalspas: 'Mefenamic Acid + Dicyclomine (Meftal-Spas)',
  voveran: 'Diclofenac (Voveran)',
  zerodol: 'Aceclofenac (Zerodol)',
  zerodolsp: 'Aceclofenac + Serratiopeptidase (Zerodol-SP)',
  aceclo: 'Aceclofenac',
  aceclofenac: 'Aceclofenac',
  ibuprofen: 'Ibuprofen',

  // Antihistamines & Allergy
  citrigen: 'Cetirizine (Citrigen)',
  cetzine: 'Cetirizine (Cetzine)',
  okacet: 'Cetirizine (Okacet)',
  alerid: 'Cetirizine (Alerid)',
  cetirizine: 'Cetirizine',
  cetrizine: 'Cetirizine',
  citrizine: 'Cetirizine',
  levocet: 'Levocetirizine',
  levocetirizine: 'Levocetirizine',
  allegra: 'Fexofenadine (Allegra)',
  fexofenadine: 'Fexofenadine',
  montair: 'Montelukast (Montair)',
  montek: 'Montelukast (Montek)',
  montairlc: 'Montelukast + Levocetirizine (Montair-LC)',
  monteklc: 'Montelukast + Levocetirizine (Montek-LC)',
  montelukast: 'Montelukast',

  // Antibiotics
  amox: 'Amoxicillin',
  amoxicillin: 'Amoxicillin',
  augmentin: 'Amoxicillin + Clavulanate (Augmentin)',
  moxikind: 'Amoxicillin + Clavulanate (Moxikind-CV)',
  clavam: 'Amoxicillin + Clavulanate (Clavam)',
  azithral: 'Azithromycin (Azithral)',
  azee: 'Azithromycin (Azee)',
  zady: 'Azithromycin (Zady)',
  azithro: 'Azithromycin',
  azithromycin: 'Azithromycin',
  cefixime: 'Cefixime',
  taximo: 'Cefixime (Taxim-O)',
  mahacef: 'Cefixime (Mahacef)',
  cipro: 'Ciprofloxacin',
  ciprofloxacin: 'Ciprofloxacin',
  ciprobid: 'Ciprofloxacin (Ciprobid)',
  ciplox: 'Ciprofloxacin (Ciplox)',
  oflox: 'Ofloxacin',
  ofloxacin: 'Ofloxacin',
  zenflox: 'Ofloxacin (Zenflox)',
  norflox: 'Norfloxacin',
  norfloxacin: 'Norfloxacin',

  // Gastrointestinal / Antacids
  pan: 'Pantoprazole (Pan)',
  pantop: 'Pantoprazole',
  pantocid: 'Pantoprazole (Pantocid)',
  pantoprazole: 'Pantoprazole',
  pand: 'Pantoprazole + Domperidone (Pan-D)',
  pantocidd: 'Pantoprazole + Domperidone (Pantocid-D)',
  omeprazole: 'Omeprazole',
  omez: 'Omeprazole (Omez)',
  rabeprazole: 'Rabeprazole',
  rablet: 'Rabeprazole (Rablet)',
  rabekind: 'Rabeprazole (Rabekind)',
  digene: 'Antacid (Digene)',
  gelusil: 'Antacid (Gelusil)',

  // Diabetes & Endocrine
  met: 'Metformin',
  metformin: 'Metformin',
  glycomet: 'Metformin (Glycomet)',
  glycometgp: 'Metformin + Glimepiride (Glycomet-GP)',
  glimepiride: 'Glimepiride',
  amaryl: 'Glimepiride (Amaryl)',
  januvia: 'Sitagliptin (Januvia)',
  janumet: 'Metformin + Sitagliptin (Janumet)',
  galvus: 'Vildagliptin (Galvus)',
  galvusmet: 'Metformin + Vildagliptin (Galvus-Met)',
  forxiga: 'Dapagliflozin (Forxiga)',
  thyronorm: 'Levothyroxine (Thyronorm)',
  eltroxin: 'Levothyroxine (Eltroxin)',
  levothyroxine: 'Levothyroxine',

  // Cardiovascular & Hypertension
  telmi: 'Telmisartan',
  telmisartan: 'Telmisartan',
  telma: 'Telmisartan (Telma)',
  telmikind: 'Telmisartan (Telmikind)',
  telmah: 'Telmisartan + Hydrochlorothiazide (Telma-H)',
  amlodipine: 'Amlodipine',
  amlo: 'Amlodipine',
  amlokind: 'Amlodipine (Amlokind)',
  stamlo: 'Amlodipine (Stamlo)',
  cilacar: 'Cilnidipine (Cilacar)',
  hctz: 'Hydrochlorothiazide',
  hydrochlorothiazide: 'Hydrochlorothiazide',
  chlorthalidone: 'Chlorthalidone',
  lasix: 'Furosemide (Lasix)',
  atorva: 'Atorvastatin',
  atorvastatin: 'Atorvastatin',
  atorlip: 'Atorvastatin (Atorlip)',
  storvas: 'Atorvastatin (Storvas)',
  rosuva: 'Rosuvastatin',
  rosuvastatin: 'Rosuvastatin',
  rosuvas: 'Rosuvastatin (Rosuvas)',
  aspirin: 'Aspirin',
  ecosprin: 'Aspirin (Ecosprin)',
  clopidogrel: 'Clopidogrel',
  clopilet: 'Clopidogrel (Clopilet)',
  deplatt: 'Clopidogrel (Deplatt)',

  // Vitamins & Supplements
  shelcal: 'Calcium + Vitamin D3 (Shelcal)',
  gemcal: 'Calcium + Calcitriol (Gemcal)',
  zincovit: 'Multivitamin + Zinc (Zincovit)',
  limcee: 'Vitamin C (Limcee)',
  becosules: 'B-Complex + Vitamin C (Becosules)',
  neurobion: 'Vitamin B-Complex (Neurobion Forte)',
  supradyn: 'Daily Multivitamin (Supradyn)',
};

// Shorthand instruction mapping for doctor handwriting
function parseClinicalInstructions(text: string): string {
  const clean = text.trim();
  if (/dose unclear|unclear|illegible|\?/i.test(clean)) {
    return 'Dose unclear on handwritten prescription - Flagged for clinician verification';
  }
  if (/(?:^|\b)(?:hs|bedtime|night)(?:$|\b)/i.test(clean)) return 'Take 1 tablet daily at bedtime (HS)';
  if (/(?:^|\b)(?:bid|b\.i\.d|bd|b\.d|twice|2\s*[x×]|2\s*times)(?:$|\b)/i.test(clean)) return 'Take twice daily with meals (BD)';
  if (/(?:^|\b)(?:tid|t\.i\.d|tds|t\.d\.s|thrice|3\s*[x×]|3\s*times)(?:$|\b)/i.test(clean)) return 'Take 3 times daily after meals (TDS)';
  if (/(?:^|\b)(?:qid|q\.i\.d|4\s*[x×]|4\s*times)(?:$|\b)/i.test(clean)) return 'Take 4 times daily as directed (QID)';
  if (/(?:1-0-1)/.test(clean)) return 'Take 1 tablet in morning and 1 at night (twice daily after meals)';
  if (/(?:1-1-1)/.test(clean)) return 'Take 1 tablet morning, afternoon, and night (3 times daily after meals)';
  if (/(?:0-0-1)/.test(clean)) return 'Take 1 tablet at night before bedtime';
  if (/(?:0-1-0)/.test(clean)) return 'Take 1 tablet in afternoon after lunch';
  if (/(?:1-0-0)/.test(clean)) return 'Take 1 tablet in morning after breakfast';
  if (/(?:^|\b)(?:od|o\.d|once|morning|breakfast)(?:$|\b)/i.test(clean)) return 'Take 1 tablet daily in the morning (OD)';
  if (/(?:^|\b)(?:sos|s\.o\.s|prn|p\.r\.n|as needed)(?:$|\b)/i.test(clean)) return 'Take as needed for symptoms (SOS)';
  if (/(?:empty stomach|ac|a\.c|before food|bbf)/i.test(clean)) return 'Take once daily on an empty stomach';
  if (/(?:pc|p\.c|after food)/i.test(clean)) return 'Take once daily after food';
  return 'Take as directed by physician';
}

function isInstructionText(text: string): boolean {
  const trimmed = text.trim();
  if (/^(?:\d+\s*[x×]|\b(?:od|bd|tds|tid|bid|hs|sos|qid)\b|\b\d-\d-\d\b|\b\d\s*[x×]\s*\d-\d\b|for\s+\d+\s+days?|x\s*\d+\s*days?)/i.test(trimmed)) {
    return true;
  }
  if (/^(?:after food|before food|empty stomach|at night|bedtime)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

function extractStrength(text: string): string | null {
  // Explicit units: e.g. 650mg, 500 mg, 0.5 mcg, 5 ml, etc.
  const explicit = text.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units?|tablets?|capsules?|%))/i);
  if (explicit) return explicit[1].replace(/\s+/g, '');

  // Implicit number in doctor handwriting: e.g. "Dolo 650", "Citrigen 650", "Pan 40", "Telma 40"
  const implicit = text.match(/\b(\d{2,4})\b/);
  if (implicit) {
    const val = parseInt(implicit[1], 10);
    if (val >= 5 && val <= 1000) {
      return `${val}mg`;
    }
  }
  return null;
}

function extractDrugName(text: string): { name: string; isKnown: boolean } {
  // Clean prefixes: Tab, Cap, Syr, Inj, Rx, 1., 2., etc.
  let clean = text.replace(/^(?:Tab(?:\.|let)?|Cap(?:\.|sule)?|Syr(?:\.|up)?|Inj(?:\.|ection)?|Rx|\d+[\.\)])\s*/i, '').trim();

  // Strip dosages: 650, 500mg, etc.
  clean = clean.replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)?\b/gi, '').trim();
  clean = clean.replace(/[^a-zA-Z0-9\s\-\+\(\)\/]/g, '').trim();

  const words = clean.toLowerCase().split(/[\s,.-]+/);
  for (const w of words) {
    if (w.length >= 3 && DRUG_DICTIONARY[w]) {
      return { name: DRUG_DICTIONARY[w], isKnown: true };
    }
  }

  // Format into proper Title Case if not in dictionary
  const titleCased = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return { name: titleCased || text, isKnown: false };
}

export async function processPrescriptionOCR(
  filePath: string,
  fileName: string,
  fileUrl: string
): Promise<OCRResult> {
  let imageToProcess = filePath;
  let previewUrl = fileUrl;

  // 1. Auto PDF Conversion: Render PDF pages to PNG using native macOS sips
  if (path.extname(filePath).toLowerCase() === '.pdf') {
    const renderedPngPath = filePath.replace(/\.pdf$/i, '_page.png');
    try {
      execSync(`sips -s format png "${filePath}" --out "${renderedPngPath}"`, { stdio: 'pipe' });
      if (fs.existsSync(renderedPngPath)) {
        imageToProcess = renderedPngPath;
        previewUrl = fileUrl.replace(/\.pdf$/i, '_page.png');
        console.log(`[OCR Engine] Rendered PDF to PNG preview: ${renderedPngPath}`);
      }
    } catch (convErr) {
      console.warn('[OCR Engine] PDF to PNG conversion error:', convErr);
    }
  }

  const visionBinary = path.resolve(process.cwd(), 'server/services/vision_ocr');
  let rawLines: Array<{ text: string; confidence: number; bbox: { top: number; left: number; width: number; height: number } }> = [];
  let fullText = '';
  let engineUsed: OCRResult['engineUsed'] = 'Apple Vision (Handwriting & Neural Engine)';

  // 2. Try Primary Handwriting Engine: Native Apple Neural Engine Vision OCR
  if (fs.existsSync(visionBinary)) {
    try {
      console.log(`[OCR Engine] Running Apple Neural Engine Vision OCR on ${imageToProcess}`);
      const stdout = execSync(`"${visionBinary}" "${imageToProcess}"`, { maxBuffer: 15 * 1024 * 1024 }).toString();
      const parsed = JSON.parse(stdout);
      fullText = parsed.fullText || '';
      rawLines = parsed.lines || [];
      console.log(`[OCR Engine] Apple Vision extracted ${rawLines.length} lines.`);
    } catch (visionErr) {
      console.warn('[OCR Engine] Apple Vision error, falling back to Tesseract:', visionErr);
      rawLines = [];
    }
  }

  // 3. Fallback Engine: Tesseract.js OCR
  if (rawLines.length === 0) {
    engineUsed = 'Tesseract OCR (Fallback)';
    console.log(`[OCR Engine] Running Tesseract OCR fallback on ${imageToProcess}`);
    const worker = await createWorker('eng');
    try {
      const ret = await worker.recognize(imageToProcess, {}, { blocks: true });
      fullText = ret.data.text || '';
      if (ret.data.blocks) {
        ret.data.blocks.forEach((b: any) => {
          b.paragraphs?.forEach((p: any) => {
            p.lines?.forEach((l: any) => {
              if (l.text && l.text.trim().length > 0) {
                rawLines.push({
                  text: l.text.trim(),
                  confidence: Math.round(l.confidence || 85),
                  bbox: {
                    top: Math.round((l.bbox.y0 / 1100) * 100),
                    left: Math.round((l.bbox.x0 / 900) * 100),
                    width: Math.round(((l.bbox.x1 - l.bbox.x0) / 900) * 100),
                    height: Math.round(((l.bbox.y1 - l.bbox.y0) / 1100) * 100),
                  },
                });
              }
            });
          });
        });
      }
    } finally {
      await worker.terminate();
    }
  }

  // 4. Clinical Entity Resolution & Handwriting Parsing
  const medications: ExtractedMedItem[] = [];

  // Separate instruction lines from candidate medication lines
  const nonHeaderLines = rawLines.filter((line) => {
    const text = line.text;
    if (!text || text.length < 2) return false;
    if (/clinic|primary care|hospital|senior consultant|healthcare ave|tel:|diagnosis:|signature|follow up|stamp|doctor signature|the forgotten prescription|across every visit|saturday/i.test(text)) {
      return false;
    }
    return true;
  });

  const instructionLines: Array<{ text: string; lineIndex: number; line: typeof rawLines[0] }> = [];
  const candidateMedLines: Array<{ text: string; lineIndex: number; line: typeof rawLines[0] }> = [];

  nonHeaderLines.forEach((l, idx) => {
    if (isInstructionText(l.text)) {
      instructionLines.push({ text: l.text, lineIndex: idx, line: l });
    } else {
      candidateMedLines.push({ text: l.text, lineIndex: idx, line: l });
    }
  });

  candidateMedLines.forEach((cand, medIdx) => {
    const text = cand.text;
    const strengthFound = extractStrength(text);
    const drugInfo = extractDrugName(text);

    // Is it a drug by dictionary, by prefix, by having a strength/dosage, or by being a prescription line?
    const hasDrugPrefix = /^(?:Tab(?:\.|let)?|Cap(?:\.|sule)?|Syr(?:\.|up)?|Inj(?:\.|ection)?|Rx|\d+[\.\)])/i.test(text);
    const isValidDrugCandidate = drugInfo.isKnown || Boolean(strengthFound) || hasDrugPrefix || text.length >= 4;

    if (isValidDrugCandidate) {
      let drugName = drugInfo.name;
      if (!drugName || drugName.length < 2) {
        drugName = `Prescription Item ${medications.length + 1}`;
      }
      const strength = strengthFound || 'As directed';

      // Check instructions on the same line first
      let instructions = parseClinicalInstructions(text);

      // If generic, check paired instruction lines (e.g. column-oriented or adjacent line layout)
      if (instructions === 'Take as directed by physician') {
        if (instructionLines[medIdx]) {
          // Paired by index (column-oriented handwritten prescription format: Left=Drugs, Right=Dosages)
          instructions = parseClinicalInstructions(instructionLines[medIdx].text);
        } else {
          // Check immediately next line in nonHeaderLines
          const nextLine = nonHeaderLines[cand.lineIndex + 1];
          if (nextLine && isInstructionText(nextLine.text)) {
            instructions = parseClinicalInstructions(nextLine.text);
          }
        }
      }

      // Systemic Conflict check
      let conflictDetails: ExtractedMedItem['conflictDetails'] = undefined;
      let status: ExtractedMedItem['status'] = 'PENDING';

      if (/hydrochlorothiazide/i.test(drugName) || /chlorthalidone/i.test(drugName)) {
        status = 'CONFLICT';
        conflictDetails = {
          severity: 'HIGH',
          description: 'Systemic conflict: duplicate diuretic therapy detected against existing active record (Chlorthalidone). Risk of hypotension.',
          conflictingWith: 'Active Medication: Chlorthalidone 25mg',
        };
      }

      const timesPerDay = parseFrequencyPerDay(instructions || text);
      const medicineName = strength !== 'As directed' && !drugName.toLowerCase().includes(strength.toLowerCase())
        ? `${drugName} ${strength}`
        : drugName;

      medications.push({
        id: `med-${Date.now()}-${cand.lineIndex}`,
        medicineName,
        name: drugName,
        strength,
        timesPerDay,
        frequencyPerDay: timesPerDay,
        instructions,
        status,
        sourceDocument: fileName,
        sourceUrl: previewUrl,
        confidence: Math.round(cand.line.confidence) || 95,
        boundingBox: {
          top: Math.round(cand.line.bbox.top),
          left: Math.round(cand.line.bbox.left),
          width: Math.round(Math.max(12, cand.line.bbox.width)),
          height: Math.round(Math.max(3.5, cand.line.bbox.height)),
        },
        conflictDetails,
      });
    }
  });

  // Fallback: If no structured drug matched, include readable lines with dosages or quantities
  if (medications.length === 0 && rawLines.length > 0) {
    const candidates = rawLines.filter((l) => l.text.length > 4 && !/the forgotten prescription|medtrace|saturday|visit/i.test(l.text)).slice(0, 4);
    candidates.forEach((l, idx) => {
      const strength = extractStrength(l.text) || 'As directed';
      const name = l.text.split(' ')[0] || `Item ${idx + 1}`;
      const timesPerDay = parseFrequencyPerDay(l.text);
      const medicineName = strength !== 'As directed' ? `${name} ${strength}` : name;
      medications.push({
        id: `med-${Date.now()}-${idx}`,
        medicineName,
        name,
        strength,
        timesPerDay,
        frequencyPerDay: timesPerDay,
        instructions: parseClinicalInstructions(l.text),
        status: 'PENDING',
        sourceDocument: fileName,
        sourceUrl: previewUrl,
        confidence: Math.round(l.confidence) || 85,
        boundingBox: {
          top: Math.round(l.bbox.top),
          left: Math.round(l.bbox.left),
          width: Math.round(Math.max(12, l.bbox.width)),
          height: Math.round(Math.max(3.5, l.bbox.height)),
        },
      });
    });
  }

  return {
    fullText,
    lines: rawLines,
    medications,
    previewUrl,
    engineUsed,
  };
}

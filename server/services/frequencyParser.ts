/**
 * Anti-Gravity Assistive Health Engine - Core Medical Frequency & Entity Parser
 * 
 * Strictly extracts:
 * 1. The brand or generic name of the medicine.
 * 2. The specific number of times per day it needs to be taken (as a strict integer count).
 * 
 * Converts colloquial phrases (e.g. "morning and night" -> 2) into strict integer counts.
 */

// Known mapping of common phrases to daily integer counts
const PHRASE_TO_FREQUENCY_MAP: Array<{ regex: RegExp; frequency: number; description: string }> = [
  // 4 times daily
  { regex: /\b(?:four|4)\s*(?:times|x)\s*(?:a|per|\/)?\s*(?:day|daily)\b/i, frequency: 4, description: '4 times per day' },
  { regex: /\b(?:qid|q\.i\.d)\b/i, frequency: 4, description: '4 times per day (QID)' },
  { regex: /\b1-1-1-1\b/, frequency: 4, description: '4 times per day (1-1-1-1)' },
  { regex: /\bevery\s*6\s*(?:hours|hrs|hr)\b/i, frequency: 4, description: 'Every 6 hours (4 times per day)' },
  { regex: /\bq6h\b/i, frequency: 4, description: 'Every 6 hours (4 times per day)' },
  { regex: /\bmorning(?:,|\s+and)?\s+(?:noon|afternoon)(?:,|\s+and)?\s+evening(?:,|\s+and)?\s+(?:night|bedtime)\b/i, frequency: 4, description: 'Morning, afternoon, evening, and night' },

  // 3 times daily
  { regex: /\b(?:three|3)\s*(?:times|x)\s*(?:a|per|\/)?\s*(?:day|daily)\b/i, frequency: 3, description: '3 times per day' },
  { regex: /\b(?:thrice|3\s*times|3\s*[x×])\s*daily\b/i, frequency: 3, description: '3 times per day' },
  { regex: /\b(?:tid|t\.i\.d|tds|t\.d\.s)\b/i, frequency: 3, description: '3 times per day (TDS)' },
  { regex: /\b1-1-1\b|\b1-I-1\b/, frequency: 3, description: '3 times per day (1-1-1)' },
  { regex: /\b2-2-2\b/, frequency: 3, description: '3 times per day (2-2-2)' },
  { regex: /\bevery\s*8\s*(?:hours|hrs|hr)\b/i, frequency: 3, description: 'Every 8 hours (3 times per day)' },
  { regex: /\bq8h\b/i, frequency: 3, description: 'Every 8 hours (3 times per day)' },
  { regex: /\bmorning(?:,|\s+and|\s*,\s*and)?\s+(?:afternoon|noon)(?:,|\s+and|\s*,\s*and)?\s+(?:night|evening|bedtime)\b/i, frequency: 3, description: 'Morning, afternoon, and night' },
  { regex: /\bbreakfast\b.*\blunch\b.*\bdinner\b/i, frequency: 3, description: 'Breakfast, lunch, and dinner' },

  // 2 times daily
  { regex: /\b(?:twice|two|2)\s*(?:times|x)\s*(?:a|per|\/)?\s*(?:day|daily)\b/i, frequency: 2, description: '2 times per day' },
  { regex: /\b(?:twice|2\s*times|2\s*[x×])\s*daily\b/i, frequency: 2, description: '2 times per day' },
  { regex: /\b(?:bid|b\.i\.d|bd|b\.d)\b/i, frequency: 2, description: 'Twice daily (BD)' },
  { regex: /\b1-0-1\b|\b1-O-1\b|\bl-0-l\b/, frequency: 2, description: 'Morning and night (1-0-1)' },
  { regex: /\b2-0-2\b/, frequency: 2, description: 'Morning and night (2-0-2)' },
  { regex: /\b0\.5-0-0\.5\b/, frequency: 2, description: 'Morning and night (half tablet twice daily)' },
  { regex: /\bmorning\s+(?:and|&)\s+(?:night|evening|bedtime)\b/i, frequency: 2, description: 'Morning and night' },
  { regex: /\bday\s+(?:and|&)\s+night\b/i, frequency: 2, description: 'Day and night' },
  { regex: /\bevery\s*12\s*(?:hours|hrs|hr)\b/i, frequency: 2, description: 'Every 12 hours (2 times per day)' },
  { regex: /\bq12h\b/i, frequency: 2, description: 'Every 12 hours (2 times per day)' },

  // 1 time daily
  { regex: /\b(?:once|one|1)\s*(?:time|x)?\s*(?:a|per|\/)?\s*(?:day|daily)\b/i, frequency: 1, description: 'Once per day' },
  { regex: /\b(?:once|1\s*time|1\s*[x×])\s*daily\b/i, frequency: 1, description: 'Once daily' },
  { regex: /\b(?:od|o\.d|qd|q\.d)\b/i, frequency: 1, description: 'Once daily (OD)' },
  { regex: /\b(?:hs|h\.s|bedtime|nocte)\b/i, frequency: 1, description: 'Once daily at bedtime (HS)' },
  { regex: /\b1-0-0\b|\b1-O-O\b/, frequency: 1, description: 'Once daily in morning (1-0-0)' },
  { regex: /\b0-0-1\b|\bO-O-1\b/, frequency: 1, description: 'Once daily at night (0-0-1)' },
  { regex: /\b0-1-0\b|\bO-1-O\b/, frequency: 1, description: 'Once daily in afternoon (0-1-0)' },
  { regex: /\bevery\s*24\s*(?:hours|hrs|hr)\b/i, frequency: 1, description: 'Every 24 hours (1 time per day)' },
  { regex: /\bq24h\b/i, frequency: 1, description: 'Every 24 hours (1 time per day)' },
  { regex: /\b(?:every\s+morning|in\s+the\s+morning|with\s+breakfast|each\s+morning)\b/i, frequency: 1, description: 'Every morning' },
  { regex: /\b(?:every\s+night|at\s+night|before\s+bed(?:time)?|in\s+the\s+evening)\b/i, frequency: 1, description: 'Every night' },
  { regex: /\bdaily\b/i, frequency: 1, description: 'Daily' },

  // 6 times daily
  { regex: /\bevery\s*4\s*(?:hours|hrs|hr)\b/i, frequency: 6, description: 'Every 4 hours (6 times per day)' },
  { regex: /\bq4h\b/i, frequency: 6, description: 'Every 4 hours (6 times per day)' },
];

/**
 * Strictly parses any dosage instruction text or phrase and returns
 * the exact integer number of times per day the medicine should be taken.
 * 
 * Example:
 * - "morning and night" -> 2
 * - "Take 1 tablet twice daily" -> 2
 * - "1-0-1" -> 2
 * - "Take 3 times a day with meals" -> 3
 * - "Once daily in the morning" -> 1
 */
export function parseFrequencyPerDay(instructionText: string | undefined | null): number {
  if (!instructionText || typeof instructionText !== 'string') {
    return 1; // Default minimum daily dosage count
  }

  const clean = instructionText.trim();
  if (!clean) return 1;

  // Check known phrase and clinical abbreviation patterns
  for (const item of PHRASE_TO_FREQUENCY_MAP) {
    if (item.regex.test(clean)) {
      return item.frequency;
    }
  }

  // Generic regex match: "[N] times/x a day" or "[N] times daily"
  const countMatch = clean.match(/\b(\d+)\s*(?:times|x|pills?|tablets?|caps?|doses?)\s*(?:a|per|\/)\s*day\b/i) ||
                     clean.match(/\b(\d+)\s*(?:times|x)\s*daily\b/i) ||
                     clean.match(/\btake\s*(\d+)\s*(?:tablet|tab|pill|capsule|dose)?s?\s*(?:per|\/|a)\s*day\b/i);

  if (countMatch && countMatch[1]) {
    const parsed = parseInt(countMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 24) {
      return parsed;
    }
  }

  // Count doctor dosage pattern digits e.g. "1-0-1" -> count non-zero elements
  const dashPattern = clean.match(/\b([0-9])-([0-9])-([0-9])(?:-([0-9]))?\b/);
  if (dashPattern) {
    const parts = [dashPattern[1], dashPattern[2], dashPattern[3], dashPattern[4]].filter(Boolean);
    const nonZeroDoses = parts.filter(p => parseInt(p, 10) > 0).length;
    if (nonZeroDoses > 0) return nonZeroDoses;
  }

  // If SOS / PRN / As needed without specific daily count, return 1 as needed
  if (/\b(?:sos|prn|as needed)\b/i.test(clean)) {
    return 1;
  }

  return 1;
}

/**
 * Extracts the clean brand or generic name of the medicine,
 * ignoring strengths, packaging terms, directions, and extraneous details.
 */
export function extractBrandOrGenericName(rawText: string): string {
  if (!rawText) return 'Unknown Medication';

  // Strip prefixes like Tab, Cap, Syr, Inj, Rx, numbers
  let clean = rawText
    .replace(/^(?:Tab(?:\.|let)?|Cap(?:\.|sule)?|Syr(?:\.|up)?|Inj(?:\.|ection)?|Rx|\d+[\.\)])\s*/i, '')
    .trim();

  // Strip dosages: 650mg, 500 mg, etc.
  clean = clean.replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%)\b/gi, '').trim();

  // Strip frequency shorthand words if attached to the name line
  clean = clean.replace(/\b(?:1-0-1|1-1-1|0-0-1|1-0-0|od|bd|bid|tds|tid|qid|hs|sos)\b/gi, '').trim();

  // Strip trailing punctuation
  clean = clean.replace(/[,\-:;.]+$/, '').trim();

  return clean || rawText.trim();
}

/**
 * Strict Anti-Gravity Result Model
 */
export interface AntiGravityStrictExtraction {
  /** The brand or generic name of the medicine */
  medicineName: string;
  /** The specific number of times per day it needs to be taken (strict integer) */
  timesPerDay: number;
  /** Explanatory conversion note (e.g. Converted from 'morning and night') */
  conversionSource?: string;
}

/**
 * Anti-Gravity Core Extraction Engine for single items
 */
export function parseAntiGravityPrescriptionItem(
  nameText: string,
  dosageText: string
): AntiGravityStrictExtraction {
  const medicineName = extractBrandOrGenericName(nameText);
  const timesPerDay = parseFrequencyPerDay(dosageText || nameText);

  return {
    medicineName,
    timesPerDay,
    conversionSource: dosageText.trim(),
  };
}

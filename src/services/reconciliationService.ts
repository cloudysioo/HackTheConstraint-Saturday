import { Medication, ComparisonDiscrepancy, PrescriptionComparisonReport } from '../types/medication';

// Comprehensive Brand <-> Generic Drug Mapping Dictionary
export const BRAND_TO_GENERIC: Record<string, string> = {
  glucophage: 'Metformin',
  glycomet: 'Metformin',
  fortamet: 'Metformin',
  norvasc: 'Amlodipine',
  amlodac: 'Amlodipine',
  stamlo: 'Amlodipine',
  lipitor: 'Atorvastatin',
  atorva: 'Atorvastatin',
  storvas: 'Atorvastatin',
  zestril: 'Lisinopril',
  prinivil: 'Lisinopril',
  cozaar: 'Losartan',
  losar: 'Losartan',
  lopressor: 'Metoprolol',
  toprol: 'Metoprolol',
  betaloc: 'Metoprolol',
  plavix: 'Clopidogrel',
  clopilet: 'Clopidogrel',
  deplatt: 'Clopidogrel',
  augmentin: 'Amoxicillin + Clavulanate',
  moxikind: 'Amoxicillin + Clavulanate',
  clavam: 'Amoxicillin + Clavulanate',
  amoxil: 'Amoxicillin',
  azithral: 'Azithromycin',
  zithromax: 'Azithromycin',
  azee: 'Azithromycin',
  cipro: 'Ciprofloxacin',
  ciprobid: 'Ciprofloxacin',
  ciplox: 'Ciprofloxacin',
  lasix: 'Furosemide',
  synthroid: 'Levothyroxine',
  elthroyx: 'Levothyroxine',
  dolo: 'Paracetamol',
  crocin: 'Paracetamol',
  calpol: 'Paracetamol',
  tylenol: 'Paracetamol',
  advil: 'Ibuprofen',
  motrin: 'Ibuprofen',
  combiflam: 'Ibuprofen + Paracetamol',
  flexon: 'Ibuprofen + Paracetamol',
  allegra: 'Fexofenadine',
  cetzine: 'Cetirizine',
  okacet: 'Cetirizine',
  alerid: 'Cetirizine',
  montair: 'Montelukast',
  montek: 'Montelukast',
};

// Recognized Chronic Maintenance Therapies (Must not disappear silently)
export const CHRONIC_DRUG_ROOTS = [
  'metformin',
  'amlodipine',
  'lisinopril',
  'losartan',
  'atorvastatin',
  'rosuvastatin',
  'metoprolol',
  'telmisartan',
  'levothyroxine',
  'clopidogrel',
  'apixaban',
  'warfarin',
  'glimepiride',
  'empagliflozin',
  'dapagliflozin',
];

// Time-Limited / Acute Therapies (Must not remain active indefinitely)
export const ACUTE_DRUG_ROOTS = [
  'amoxicillin',
  'azithromycin',
  'ciprofloxacin',
  'cefixime',
  'doxycycline',
  'clarithromycin',
  'prednisone',
  'methylprednisolone',
  'dexamethasone',
];

export function getCanonicalDrugName(name: string): { canonical: string; brandName?: string; genericName: string } {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (clean.includes(brand)) {
      return { canonical: generic, brandName: name, genericName: generic };
    }
  }

  // Check known generics
  for (const generic of Object.values(BRAND_TO_GENERIC)) {
    const genClean = generic.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.includes(genClean) || genClean.includes(clean)) {
      return { canonical: generic, genericName: generic };
    }
  }

  return { canonical: name.trim(), genericName: name.trim() };
}

export function isChronicDrug(name: string): boolean {
  const clean = name.toLowerCase();
  const canonical = getCanonicalDrugName(name).canonical.toLowerCase();
  return CHRONIC_DRUG_ROOTS.some((c) => clean.includes(c) || canonical.includes(c));
}

export function isTimeLimitedDrug(name: string, instructions?: string): boolean {
  const clean = name.toLowerCase();
  const canonical = getCanonicalDrugName(name).canonical.toLowerCase();
  const instClean = (instructions || '').toLowerCase();

  const isAcuteName = ACUTE_DRUG_ROOTS.some((a) => clean.includes(a) || canonical.includes(a));
  const hasCourseDuration = /day|course|week|x\s*\d+\s*d/i.test(instClean);

  return isAcuteName || hasCourseDuration;
}

export function extractNormalizedStrength(strength: string): string {
  if (!strength) return '';
  return strength.toLowerCase().replace(/\s+/g, '').replace('milligram', 'mg');
}

/**
 * Runs longitudinal reconciliation comparison between a newly added prescription
 * and existing medications stored in the patient's database.
 */
export function comparePrescriptionMedications(
  existingMeds: Medication[],
  newMeds: Medication[],
  metadata: {
    patientId: string;
    documentId: string;
    documentName: string;
    doctorName?: string;
  }
): {
  discrepancies: ComparisonDiscrepancy[];
  annotatedNewMeds: Medication[];
  report: PrescriptionComparisonReport;
} {
  const discrepancies: ComparisonDiscrepancy[] = [];
  const now = new Date();
  const timestamp = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const annotatedNewMeds: Medication[] = newMeds.map((med) => ({ ...med }));

  // ── 1. Check for HIGH: Conflict & LOW: Name Variant ──────────────────────────
  annotatedNewMeds.forEach((newMed) => {
    const newCanonical = getCanonicalDrugName(newMed.name);

    // Look for matching drug in existing medications
    const match = existingMeds.find((prev) => {
      const prevCanonical = getCanonicalDrugName(prev.name);
      return (
        prevCanonical.canonical.toLowerCase() === newCanonical.canonical.toLowerCase() ||
        (prev.name && newMed.name && prev.name.toLowerCase().includes(newMed.name.toLowerCase()))
      );
    });

    if (match) {
      const prevStrength = extractNormalizedStrength(match.strength);
      const newStrength = extractNormalizedStrength(newMed.strength);

      const prevFreq = match.timesPerDay || match.frequencyPerDay || 1;
      const newFreq = newMed.timesPerDay || newMed.frequencyPerDay || 1;

      const strengthMismatch = prevStrength && newStrength && prevStrength !== newStrength;
      const freqMismatch = prevFreq !== newFreq;

      // RULE 1: HIGH - Conflict (Differing strengths, doses, or frequencies across visits)
      if (strengthMismatch || freqMismatch) {
        const conflictDesc = strengthMismatch && freqMismatch
          ? `Differing strengths (${match.strength} vs ${newMed.strength}) and frequencies (${prevFreq}x vs ${newFreq}x daily) across visits`
          : strengthMismatch
          ? `Differing strengths across visits: ${match.strength} vs ${newMed.strength}`
          : `Differing intake frequencies across visits: ${prevFreq} time(s)/day vs ${newFreq} time(s)/day`;

        const prevDoc = match.prescribedBy || 'Previous Doctor';
        const currentDoc = newMed.prescribedBy || metadata.doctorName || 'Current Visit';

        const discrepancy: ComparisonDiscrepancy = {
          id: `disc-conflict-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          patientId: metadata.patientId,
          drugName: newCanonical.canonical,
          genericName: newCanonical.genericName,
          severity: 'HIGH',
          type: 'Conflict',
          description: 'Differing strengths, doses, or frequencies across visits',
          example: `${newCanonical.canonical}: ${match.strength || 'Dose 1'} (${prevDoc}) vs ${newMed.strength || 'Dose 2'} (${currentDoc})`,
          detectedAt: timestamp,
          status: 'PENDING_REVIEW',
          previousRecord: {
            medicineName: `${match.name} ${match.strength}`,
            strength: match.strength,
            frequency: `${prevFreq}x daily`,
            prescribedBy: match.prescribedBy,
            prescribedDate: match.prescribedDate,
            sourceDocument: match.sourceDocument,
          },
          currentRecord: {
            medicineName: `${newMed.name} ${newMed.strength}`,
            strength: newMed.strength,
            frequency: `${newFreq}x daily`,
            prescribedBy: newMed.prescribedBy || metadata.doctorName,
            prescribedDate: newMed.prescribedDate || new Date().toISOString().split('T')[0],
            sourceDocument: metadata.documentName,
          },
        };

        discrepancies.push(discrepancy);
        newMed.status = 'CONFLICT';
        newMed.comparisonDiscrepancy = discrepancy;
        newMed.conflictDetails = {
          severity: 'HIGH',
          type: 'Conflict',
          description: conflictDesc,
          conflictingWith: `${match.name} ${match.strength}`,
          prescribedByOtherDoctor: match.prescribedBy,
          previousValue: `${match.strength} (${prevFreq}x daily)`,
          currentValue: `${newMed.strength} (${newFreq}x daily)`,
          example: discrepancy.example,
        };
      }

      // RULE 4: LOW - Name Variant (Brand vs. Generic name alignment needing quick confirmation)
      const prevIsBrand = Boolean(match.name.toLowerCase().match(/glucophage|norvasc|lipitor|augmentin|dolo|plavix|zestril/));
      const newIsBrand = Boolean(newMed.name.toLowerCase().match(/glucophage|norvasc|lipitor|augmentin|dolo|plavix|zestril/));
      const isDifferentNaming = match.name.toLowerCase().trim() !== newMed.name.toLowerCase().trim();

      if (isDifferentNaming && (prevIsBrand || newIsBrand)) {
        const brand = prevIsBrand ? match.name : newMed.name;
        const generic = newCanonical.genericName;

        const discrepancy: ComparisonDiscrepancy = {
          id: `disc-variant-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          patientId: metadata.patientId,
          drugName: newCanonical.canonical,
          genericName: newCanonical.genericName,
          severity: 'LOW',
          type: 'Name Variant',
          description: 'Brand vs. Generic name alignment needing quick confirmation',
          example: `${brand} matched with ${generic}`,
          detectedAt: timestamp,
          status: 'PENDING_REVIEW',
          previousRecord: {
            medicineName: match.name,
            strength: match.strength,
            prescribedBy: match.prescribedBy,
          },
          currentRecord: {
            medicineName: newMed.name,
            strength: newMed.strength,
            prescribedBy: newMed.prescribedBy || metadata.doctorName,
          },
        };

        discrepancies.push(discrepancy);
        if (!newMed.comparisonDiscrepancy) {
          newMed.comparisonDiscrepancy = discrepancy;
        }
      }
    }
  });

  // ── 2. Check for MEDIUM: Missing Entry ──────────────────────────────────────
  // Chronic medications in existing records that disappeared without explicit stop order
  existingMeds.forEach((prevMed) => {
    if (!isChronicDrug(prevMed.name)) return;

    const prevCanonical = getCanonicalDrugName(prevMed.name);
    const presentInNew = newMeds.some((newMed) => {
      const newCanonical = getCanonicalDrugName(newMed.name);
      return newCanonical.canonical.toLowerCase() === prevCanonical.canonical.toLowerCase();
    });

    if (!presentInNew) {
      const discrepancy: ComparisonDiscrepancy = {
        id: `disc-missing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patientId: metadata.patientId,
        drugName: prevCanonical.canonical,
        genericName: prevCanonical.genericName,
        severity: 'MEDIUM',
        type: 'Missing Entry',
        description: 'A drug listed in previous visits disappears without an explicit stop order',
        example: `${prevMed.name} present in ${prevMed.prescribedBy || 'GP & Pharmacy'} records, omitted at discharge`,
        detectedAt: timestamp,
        status: 'PENDING_REVIEW',
        previousRecord: {
          medicineName: `${prevMed.name} ${prevMed.strength}`,
          strength: prevMed.strength,
          prescribedBy: prevMed.prescribedBy,
          prescribedDate: prevMed.prescribedDate,
          sourceDocument: prevMed.sourceDocument,
        },
      };

      discrepancies.push(discrepancy);
    }
  });

  // ── 3. Check for MEDIUM: Outdated ──────────────────────────────────────────
  // Time-limited therapy still shown as active after the intended end date
  existingMeds.forEach((prevMed) => {
    if (!isTimeLimitedDrug(prevMed.name, prevMed.instructions)) return;

    // Check if the medication was prescribed more than 14 days ago or has acute duration
    let isExpired = true;
    if (prevMed.prescribedDate) {
      const prescribedTime = new Date(prevMed.prescribedDate).getTime();
      const diffDays = (now.getTime() - prescribedTime) / (1000 * 60 * 60 * 24);
      isExpired = diffDays > 14;
    }

    if (isExpired && prevMed.status !== 'VERIFIED') {
      const discrepancy: ComparisonDiscrepancy = {
        id: `disc-outdated-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patientId: metadata.patientId,
        drugName: prevMed.name,
        severity: 'MEDIUM',
        type: 'Outdated',
        description: 'Time-limited therapy still shown as active after the intended end date',
        example: `7-day ${prevMed.name} course active past intended end date`,
        detectedAt: timestamp,
        status: 'PENDING_REVIEW',
        previousRecord: {
          medicineName: `${prevMed.name} ${prevMed.strength}`,
          strength: prevMed.strength,
          prescribedBy: prevMed.prescribedBy,
          prescribedDate: prevMed.prescribedDate || '2 months ago',
          sourceDocument: prevMed.sourceDocument,
        },
      };

      discrepancies.push(discrepancy);
    }
  });

  const high = discrepancies.filter((d) => d.severity === 'HIGH').length;
  const medium = discrepancies.filter((d) => d.severity === 'MEDIUM').length;
  const low = discrepancies.filter((d) => d.severity === 'LOW').length;

  const report: PrescriptionComparisonReport = {
    id: `comp-report-${Date.now()}`,
    patientId: metadata.patientId,
    documentId: metadata.documentId,
    documentName: metadata.documentName,
    comparedAt: timestamp,
    prescribingDoctor: metadata.doctorName,
    discrepancies,
    stats: {
      high,
      medium,
      low,
      total: discrepancies.length,
    },
  };

  return { discrepancies, annotatedNewMeds, report };
}

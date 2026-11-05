import React from 'react';
import { useMedications } from '../../context/MedicationContext';
import { History, ShieldCheck, User, Stethoscope } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

export const ClinicianAuditLog: React.FC = () => {
  const { auditLogs } = useMedications();

  const getActorBadge = (role: 'PATIENT' | 'CLINICIAN' | 'SYSTEM') => {
    switch (role) {
      case 'CLINICIAN':
        return (
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold">
            <Stethoscope className="h-3 w-3" />
            Clinician
          </span>
        );
      case 'PATIENT':
        return (
          <span className="inline-flex items-center gap-1 bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded text-[10px] font-bold">
            <User className="h-3 w-3" />
            Patient
          </span>
        );
      case 'SYSTEM':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 border border-neutral-300 px-2 py-0.5 rounded text-[10px] font-bold">
            <ShieldCheck className="h-3 w-3 text-secondary-dark" />
            System / OCR
          </span>
        );
    }
  };

  return (
    <Card className="border border-neutral-200 shadow-card">
      <CardHeader className="bg-neutral-50/70 border-b border-neutral-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-neutral-900">
                Closed-Loop Medication Continuity Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Immutable, timestamped ledger of OCR extractions, patient discrepancies, and clinical decisions
              </CardDescription>
            </div>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {auditLogs.length} Events Logged
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-3">
          {auditLogs.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getActorBadge(entry.role)}
                  <span className="font-bold text-neutral-900">{entry.actor}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="font-mono text-neutral-500 text-[11px]">{entry.timestamp}</span>
                </div>
                <p className="text-neutral-800 font-medium pl-1">{entry.summary}</p>
                {entry.details && entry.details !== entry.summary && (
                  <p className="text-neutral-500 text-[11px] pl-1 italic">
                    Note: "{entry.details}"
                  </p>
                )}
              </div>

              <div className="self-end sm:self-center shrink-0">
                <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                  {entry.medicationName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

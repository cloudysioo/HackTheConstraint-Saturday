import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Filter,
  History,
  Flag,
  Check,
} from 'lucide-react';
import {
  ComparisonDiscrepancy,
  PrescriptionComparisonReport,
  ComparisonDiscrepancySeverity,
} from '../../types/medication';
import { Button } from '../ui/button';

interface PrescriptionComparisonViewProps {
  reports: PrescriptionComparisonReport[];
  activeReport: PrescriptionComparisonReport | null;
  onSelectReport?: (reportId: string) => void;
  onUpdateStatus?: (reportId: string, discrepancyId: string, status: ComparisonDiscrepancy['status']) => void;
  onOpenFlagModal?: (medicationName: string, discrepancyType: string) => void;
}

export const PrescriptionComparisonView: React.FC<PrescriptionComparisonViewProps> = ({
  reports,
  activeReport,
  onSelectReport,
  onUpdateStatus,
  onOpenFlagModal,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | ComparisonDiscrepancySeverity>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!activeReport && reports.length === 0) {
    return null;
  }

  const currentReport = activeReport || reports[0];
  const discrepancies = currentReport ? currentReport.discrepancies : [];

  const filteredDiscrepancies =
    filterSeverity === 'ALL'
      ? discrepancies
      : discrepancies.filter((d) => d.severity === filterSeverity);

  // Styled strictly with MedTrace brand palette: Critical (#922B2B), Warning (#FF5A5F), Primary (#1F4E5B), Secondary (#2BC4C6)
  const getSeverityBadge = (severity: ComparisonDiscrepancySeverity) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="font-extrabold text-[11px] px-2.5 py-1 rounded-md bg-critical-light text-critical border border-critical-border uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="font-extrabold text-[11px] px-2.5 py-1 rounded-md bg-warning-light text-warning-hover border border-warning-border uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="font-extrabold text-[11px] px-2.5 py-1 rounded-md bg-secondary-light text-primary border border-secondary/40 uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
            LOW
          </span>
        );
    }
  };

  const getTypeIndicator = (type: ComparisonDiscrepancy['type']) => {
    switch (type) {
      case 'Conflict':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-critical">
            <span className="w-2.5 h-2.5 rounded-full bg-critical shrink-0 shadow-xs" />
            <span>Conflict</span>
          </span>
        );
      case 'Missing Entry':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-warning-hover">
            <span className="w-2.5 h-2.5 rounded-full bg-warning shrink-0 shadow-xs" />
            <span>Missing Entry</span>
          </span>
        );
      case 'Outdated':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-warning-hover">
            <span className="w-2.5 h-2.5 rounded-full bg-warning shrink-0 shadow-xs" />
            <span>Outdated</span>
          </span>
        );
      case 'Name Variant':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-primary">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-dark shrink-0 shadow-xs" />
            <span>Name Variant</span>
          </span>
        );
    }
  };

  return (
    <section
      aria-labelledby="reconciliation-heading"
      className="bg-surface rounded-2xl border border-neutral-200/90 shadow-card overflow-hidden transition-all"
    >
      {/* Header bar matching website's brand aesthetic */}
      <div className="bg-gradient-to-r from-primary-subtle via-white to-secondary-light/40 p-5 sm:p-6 border-b border-neutral-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-secondary-dark animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Cross-Visit Reconciliation & Safety Audit
              </span>
            </div>
            <h2 id="reconciliation-heading" className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Medication Reconciliation & Comparison Flags</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-3xl leading-relaxed">
              Every newly added prescription is compared against your previous visits in the database to detect dose discrepancies, omitted maintenance therapies, expired courses, and brand/generic variants.
            </p>
          </div>

          {/* Report switcher if multiple documents */}
          {reports.length > 1 && (
            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs shadow-xs">
              <History className="h-4 w-4 text-primary shrink-0" />
              <span className="text-neutral-500 font-semibold">Report:</span>
              <select
                value={currentReport?.id}
                onChange={(e) => onSelectReport?.(e.target.value)}
                className="bg-transparent text-neutral-900 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.documentName} ({r.comparedAt})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats & Filters Bar */}
        <div className="mt-5 pt-4 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-neutral-400" /> Filter by:
            </span>
            <button
              type="button"
              onClick={() => setFilterSeverity('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                filterSeverity === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              All ({discrepancies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('HIGH')}
              className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                filterSeverity === 'HIGH'
                  ? 'bg-critical text-white shadow-xs'
                  : 'bg-critical-light text-critical border border-critical-border hover:bg-critical-light/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-critical" />
              HIGH ({currentReport?.stats.high || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('MEDIUM')}
              className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                filterSeverity === 'MEDIUM'
                  ? 'bg-warning text-white shadow-xs'
                  : 'bg-warning-light text-warning-hover border border-warning-border hover:bg-warning-light/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-warning" />
              MEDIUM ({currentReport?.stats.medium || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('LOW')}
              className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                filterSeverity === 'LOW'
                  ? 'bg-secondary-dark text-white shadow-xs'
                  : 'bg-secondary-light text-primary border border-secondary/40 hover:bg-secondary-light/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-secondary-dark" />
              LOW ({currentReport?.stats.low || 0})
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center gap-2">
            <span className="font-medium">Document:</span>
            <span className="font-mono text-primary font-bold">{currentReport?.documentName}</span>
            <span className="text-neutral-300">·</span>
            <span>{currentReport?.comparedAt}</span>
          </div>
        </div>
      </div>

      {/* Discrepancy Table directly mirroring user specification in website light colors */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-700 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[12%]">Severity</th>
              <th className="py-3.5 px-4 w-[16%]">Type</th>
              <th className="py-3.5 px-4 w-[34%]">Description</th>
              <th className="py-3.5 px-4 w-[28%]">Comparison & Example</th>
              <th className="py-3.5 px-4 w-[10%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/80 bg-white">
            {filteredDiscrepancies.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-neutral-500">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="font-bold text-neutral-800">No discrepancies found for selected filter</p>
                  <p className="text-xs text-neutral-500 mt-0.5">All prescription records align with patient database history.</p>
                </td>
              </tr>
            ) : (
              filteredDiscrepancies.map((disc) => {
                const isExpanded = expandedId === disc.id;
                const isResolved = disc.status === 'CONFIRMED' || disc.status === 'DISMISSED';

                return (
                  <React.Fragment key={disc.id}>
                    <tr
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        disc.severity === 'HIGH'
                          ? 'bg-critical-light/30'
                          : disc.severity === 'MEDIUM'
                          ? 'bg-warning-light/30'
                          : 'bg-secondary-light/20'
                      }`}
                    >
                      {/* Severity */}
                      <td className="py-3.5 px-4 font-mono align-middle">
                        {getSeverityBadge(disc.severity)}
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 font-semibold align-middle">
                        {getTypeIndicator(disc.type)}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 align-middle text-neutral-800 leading-relaxed font-medium">
                        {disc.description}
                      </td>

                      {/* Example / Comparison Diff */}
                      <td className="py-3.5 px-4 align-middle font-mono text-[11px]">
                        <div className="bg-neutral-50 text-neutral-900 font-semibold rounded-lg px-2.5 py-1.5 border border-neutral-200 inline-block max-w-full truncate shadow-2xs">
                          {disc.example}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-primary hover:bg-neutral-100 transition-colors"
                            title="Expand comparison details"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Comparison Drill-Down */}
                    {isExpanded && (
                      <tr className="bg-neutral-50/50 border-b border-neutral-200 animate-in fade-in duration-150">
                        <td colSpan={5} className="p-4 sm:p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-xl p-4 border border-neutral-200 shadow-xs">
                            {/* Previous Visit Record */}
                            <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-neutral-200 pb-3 md:pb-0 md:pr-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-neutral-400" />
                                Previous Stored Database Record
                              </span>
                              {disc.previousRecord ? (
                                <>
                                  <p className="text-sm font-bold text-neutral-900">{disc.previousRecord.medicineName}</p>
                                  {disc.previousRecord.strength && (
                                    <p className="text-xs text-neutral-700">
                                      Strength: <strong className="text-primary font-mono">{disc.previousRecord.strength}</strong>
                                    </p>
                                  )}
                                  {disc.previousRecord.frequency && (
                                    <p className="text-xs text-neutral-600">Intake: {disc.previousRecord.frequency}</p>
                                  )}
                                  <p className="text-[11px] text-neutral-500">
                                    Prescribed by: {disc.previousRecord.prescribedBy || 'General Practitioner'} ({disc.previousRecord.prescribedDate || 'Previous Visit'})
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-neutral-400 italic">No prior record found for this drug in the database.</p>
                              )}
                            </div>

                            {/* Current New Prescription Record */}
                            <div className="space-y-1.5 bg-secondary-light/30 p-3 rounded-lg border border-secondary/20">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-dark flex items-center gap-1.5">
                                <FileText className="h-3 w-3 text-secondary-dark" />
                                Newly Added Prescription Record
                              </span>
                              {disc.currentRecord ? (
                                <>
                                  <p className="text-sm font-bold text-neutral-900">{disc.currentRecord.medicineName}</p>
                                  {disc.currentRecord.strength && (
                                    <p className="text-xs text-neutral-700">
                                      Strength: <strong className="text-critical font-mono">{disc.currentRecord.strength}</strong>
                                    </p>
                                  )}
                                  {disc.currentRecord.frequency && (
                                    <p className="text-xs text-neutral-600">Intake: {disc.currentRecord.frequency}</p>
                                  )}
                                  <p className="text-[11px] text-neutral-500">
                                    Source: {disc.currentRecord.sourceDocument} · {disc.currentRecord.prescribedBy || 'Hospital / Specialist'}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-warning-hover font-medium">
                                  Omitted in this new prescription without an explicit discontinuation order.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Clinical Feedback Buttons for Patient */}
                          <div className="mt-3.5 flex items-center justify-between text-xs pt-1">
                            <span className="text-[11px] text-neutral-500">
                              Detected: {disc.detectedAt}
                            </span>
                            <div className="flex items-center gap-2">
                              {onOpenFlagModal && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenFlagModal(disc.drugName, disc.type)}
                                  className="text-xs h-7 border-warning/50 text-warning hover:bg-warning-light gap-1"
                                >
                                  <Flag className="h-3 w-3" />
                                  <span>Flag to Doctor</span>
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  onUpdateStatus?.(
                                    currentReport.id,
                                    disc.id,
                                    isResolved ? 'PENDING_REVIEW' : 'CONFIRMED'
                                  )
                                }
                                className={`text-xs h-7 gap-1 font-semibold ${
                                  isResolved
                                    ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                                    : 'bg-primary hover:bg-primary-hover text-white shadow-xs'
                                }`}
                              >
                                {isResolved ? (
                                  <span>Mark Unresolved</span>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 text-secondary" />
                                    <span>Acknowledge & Confirm</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Filter,
  History,
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

  const getSeverityBadge = (severity: ComparisonDiscrepancySeverity) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="font-extrabold text-xs px-2.5 py-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-700/60 uppercase tracking-wider">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="font-extrabold text-xs px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-700/60 uppercase tracking-wider">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="font-extrabold text-xs px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-300 border border-blue-700/60 uppercase tracking-wider">
            LOW
          </span>
        );
    }
  };

  const getTypeIndicator = (type: ComparisonDiscrepancy['type']) => {
    switch (type) {
      case 'Conflict':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-sm text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Conflict</span>
          </span>
        );
      case 'Missing Entry':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-sm text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>Missing Entry</span>
          </span>
        );
      case 'Outdated':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-sm text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>Outdated</span>
          </span>
        );
      case 'Name Variant':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-sm text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span>Name Variant</span>
          </span>
        );
    }
  };

  return (
    <section
      aria-labelledby="reconciliation-heading"
      className="bg-neutral-950 text-neutral-100 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden transition-all"
    >
      {/* Header bar matching dark clinical dashboard theme */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-5 sm:p-6 border-b border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Active Prescription Comparison & Safety Audit
              </span>
            </div>
            <h2 id="reconciliation-heading" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Medication Reconciliation & Comparison Flags</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-3xl leading-relaxed">
              Every newly added prescription is compared against your previous database visits to flag dose changes, omitted maintenance therapies, expired courses, and brand/generic variants.
            </p>
          </div>

          {/* Report switcher if multiple documents */}
          {reports.length > 1 && (
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-xs">
              <History className="h-4 w-4 text-neutral-400 shrink-0" />
              <span className="text-neutral-400 font-semibold">Report:</span>
              <select
                value={currentReport?.id}
                onChange={(e) => onSelectReport?.(e.target.value)}
                className="bg-neutral-950 text-white font-bold text-xs rounded px-2 py-1 border border-neutral-700 focus:outline-none cursor-pointer"
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
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter by:
            </span>
            <button
              type="button"
              onClick={() => setFilterSeverity('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                filterSeverity === 'ALL'
                  ? 'bg-white text-neutral-950'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              All ({discrepancies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('HIGH')}
              className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1.5 ${
                filterSeverity === 'HIGH'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              HIGH ({currentReport?.stats.high || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('MEDIUM')}
              className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1.5 ${
                filterSeverity === 'MEDIUM'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-800/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              MEDIUM ({currentReport?.stats.medium || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('LOW')}
              className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1.5 ${
                filterSeverity === 'LOW'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-950/40 text-blue-300 hover:bg-blue-900/60 border border-blue-800/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              LOW ({currentReport?.stats.low || 0})
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 flex items-center gap-2">
            <span className="text-neutral-500">Document:</span>
            <span className="font-mono text-neutral-200">{currentReport?.documentName}</span>
            <span className="text-neutral-600">·</span>
            <span>{currentReport?.comparedAt}</span>
          </div>
        </div>
      </div>

      {/* Discrepancy Table directly mirroring user specification */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-300 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 w-[12%]">Severity</th>
              <th className="py-3 px-4 w-[16%]">Type</th>
              <th className="py-3 px-4 w-[34%]">Description</th>
              <th className="py-3 px-4 w-[28%]">Comparison & Example</th>
              <th className="py-3 px-4 w-[10%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {filteredDiscrepancies.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-neutral-200">No discrepancies found for selected filter</p>
                  <p className="text-[11px] text-neutral-500">All prescription records align with patient database history.</p>
                </td>
              </tr>
            ) : (
              filteredDiscrepancies.map((disc) => {
                const isExpanded = expandedId === disc.id;
                const isResolved = disc.status === 'CONFIRMED' || disc.status === 'DISMISSED';

                return (
                  <React.Fragment key={disc.id}>
                    <tr
                      className={`hover:bg-neutral-900/60 transition-colors ${
                        disc.severity === 'HIGH'
                          ? 'bg-rose-950/10'
                          : disc.severity === 'MEDIUM'
                          ? 'bg-amber-950/10'
                          : 'bg-blue-950/10'
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
                      <td className="py-3.5 px-4 align-middle text-neutral-200 leading-relaxed font-medium">
                        {disc.description}
                      </td>

                      {/* Example / Comparison Diff */}
                      <td className="py-3.5 px-4 align-middle font-mono text-[11px] text-emerald-400">
                        <div className="bg-black/60 rounded-lg px-2.5 py-1.5 border border-neutral-800 inline-block max-w-full truncate">
                          {disc.example}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Expand Details"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Comparison Drill-Down */}
                    {isExpanded && (
                      <tr className="bg-neutral-900/80 border-b border-neutral-800 animate-in fade-in duration-150">
                        <td colSpan={5} className="p-4 sm:p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/60 rounded-xl p-4 border border-neutral-800">
                            {/* Previous Visit Record */}
                            <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-neutral-800 pb-3 md:pb-0 md:pr-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-neutral-500" />
                                Previous Stored Database Record
                              </span>
                              {disc.previousRecord ? (
                                <>
                                  <p className="text-sm font-bold text-white">{disc.previousRecord.medicineName}</p>
                                  {disc.previousRecord.strength && (
                                    <p className="text-xs text-neutral-300">Strength: <strong className="text-amber-300">{disc.previousRecord.strength}</strong></p>
                                  )}
                                  {disc.previousRecord.frequency && (
                                    <p className="text-xs text-neutral-300">Intake: {disc.previousRecord.frequency}</p>
                                  )}
                                  <p className="text-[11px] text-neutral-500">
                                    Prescribed by: {disc.previousRecord.prescribedBy || 'General Practitioner'} ({disc.previousRecord.prescribedDate || 'Previous Visit'})
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-neutral-500 italic">No prior record found for this drug.</p>
                              )}
                            </div>

                            {/* Current New Prescription Record */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                <FileText className="h-3 w-3 text-rose-400" />
                                Newly Added Prescription Record
                              </span>
                              {disc.currentRecord ? (
                                <>
                                  <p className="text-sm font-bold text-white">{disc.currentRecord.medicineName}</p>
                                  {disc.currentRecord.strength && (
                                    <p className="text-xs text-neutral-300">Strength: <strong className="text-rose-300">{disc.currentRecord.strength}</strong></p>
                                  )}
                                  {disc.currentRecord.frequency && (
                                    <p className="text-xs text-neutral-300">Intake: {disc.currentRecord.frequency}</p>
                                  )}
                                  <p className="text-[11px] text-neutral-500">
                                    Source: {disc.currentRecord.sourceDocument} · {disc.currentRecord.prescribedBy || 'Hospital / Specialist'}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-amber-400 italic">
                                  Omitted in this new prescription without an explicit discontinuation note.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Clinical Feedback Buttons for Patient */}
                          <div className="mt-3 flex items-center justify-between text-xs pt-2">
                            <span className="text-[11px] text-neutral-400">
                              Detected: {disc.detectedAt}
                            </span>
                            <div className="flex items-center gap-2">
                              {onOpenFlagModal && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenFlagModal(disc.drugName, disc.type)}
                                  className="text-xs h-7 border-rose-600/50 text-rose-300 hover:bg-rose-950/60"
                                >
                                  Flag to Doctor
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
                                className={`text-xs h-7 ${
                                  isResolved
                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                {isResolved ? 'Mark Unresolved' : 'Acknowledge & Confirm'}
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

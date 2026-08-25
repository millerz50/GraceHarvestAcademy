'use client';

import React from 'react';
import { X, AlertTriangle, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { ConflictItem } from '../types/timetable';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictItem[];
  onAutoResolve?: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onAutoResolve,
}) => {
  if (!isOpen) return null;

  const errors = conflicts.filter((c) => c.severity === 'error');
  const warnings = conflicts.filter((c) => c.severity === 'warning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Timetable Conflict & Quality Inspector
              </h3>
              <p className="text-xs text-slate-400">
                {conflicts.length === 0
                  ? 'All periods are harmonious and conflict-free.'
                  : `${errors.length} severe clashing errors • ${warnings.length} workload warnings`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {conflicts.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                Zero Schedule Conflicts Detected!
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All teacher allocations, laboratory facilities, and class streams are balanced with no overlapping slots.
              </p>
            </div>
          ) : (
            <>
              {/* Errors List */}
              {errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Double-Booking Clashes ({errors.length})
                  </h4>
                  <div className="space-y-2">
                    {errors.map((err) => (
                      <div
                        key={err.id}
                        className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300">
                            {err.title}
                          </span>
                          {err.day && err.periodNumber && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-200">
                              {err.day} • Period {err.periodNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{err.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Workload & Policy Warnings ({warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {warnings.map((warn) => (
                      <div
                        key={warn.id}
                        className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1"
                      >
                        <span className="text-xs font-bold text-amber-300 block">
                          {warn.title}
                        </span>
                        <p className="text-xs text-slate-300">{warn.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Rules strictly adhere to Zimbabwe Ministry of Education standards.
          </p>
          <div className="flex items-center gap-2">
            {onAutoResolve && conflicts.length > 0 && (
              <button
                type="button"
                onClick={onAutoResolve}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Resolve with AI Scheduler
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  Users,
  Award,
  Settings,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { SchoolConfig, SchoolTerm, ConflictItem, PeriodSlot } from '../types/timetable';

interface NavbarProps {
  activeTab: 'class' | 'teacher' | 'sports' | 'calendar' | 'print' | 'admin';
  setActiveTab: (tab: 'class' | 'teacher' | 'sports' | 'calendar' | 'print' | 'admin') => void;
  config: SchoolConfig;
  currentTerm: SchoolTerm;
  conflicts: ConflictItem[];
  periods: PeriodSlot[];
  onOpenConflicts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  currentTerm,
  conflicts,
  periods,
  onOpenConflicts,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active period based on time
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const timeInMinutes = currentHours * 60 + currentMinutes;

  const currentPeriod = periods.find((p) => {
    const [sh, sm] = p.startTime.split(':').map(Number);
    const [eh, em] = p.endTime.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    return timeInMinutes >= startM && timeInMinutes <= endM;
  });

  const errorCount = conflicts.filter((c) => c.severity === 'error').length;
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      {/* Top Bar with School Branding & Live Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* School Name & National Crest */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shadow-inner font-black text-amber-400">
            🇿🇼
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                {config.schoolName}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {config.curriculum}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {config.province} Province • {currentTerm.termName} {currentTerm.year}
            </p>
          </div>
        </div>

        {/* Live Status & Conflict Indicators */}
        <div className="flex items-center gap-3">
          {/* Live School Clock */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-mono font-medium text-slate-200">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {currentPeriod && (
              <span className="text-emerald-400 font-semibold border-l border-slate-700 pl-2">
                {currentPeriod.name}
              </span>
            )}
          </div>

          {/* Conflict Trigger */}
          {conflicts.length > 0 && (
            <button
              id="conflict-alert-btn"
              onClick={onOpenConflicts}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                errorCount > 0
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {errorCount > 0 ? `${errorCount} Clashes` : `${warningCount} Warnings`}
              </span>
            </button>
          )}

          {conflicts.length === 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>No Clashes</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto scrollbar-none border-t border-slate-800/60">
        <nav className="flex space-x-1 sm:space-x-2 py-2">
          <button
            id="tab-class-timetable"
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'class'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Class Timetables (Forms 1-6)
          </button>

          <button
            id="tab-teacher-timetable"
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'teacher'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Teachers Timetable
          </button>

          <button
            id="tab-sports-timetable"
            onClick={() => setActiveTab('sports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'sports'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            Sports & Co-Curricular
          </button>

          <button
            id="tab-calendar-holidays"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'calendar'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Term Calendar & Holidays
          </button>

          <button
            id="tab-print-center"
            onClick={() => setActiveTab('print')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'print'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-4 h-4" />
            Print & Export PDF
          </button>

          <button
            id="tab-admin-hub"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            Admin & AI Generator
          </button>
        </nav>
      </div>
    </header>
  );
};

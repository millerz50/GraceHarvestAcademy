'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SchoolTerm, PublicHoliday, SchoolConfig } from '../types/timetable';
import { downloadICSFile } from '../utils/calendarSync';

interface SchoolCalendarViewProps {
  terms: SchoolTerm[];
  holidays: PublicHoliday[];
  config: SchoolConfig;
  onUpdateTerm: (term: SchoolTerm) => void;
  onAddHoliday: (holiday: PublicHoliday) => void;
  onDeleteHoliday: (holidayId: string) => void;
}

export const SchoolCalendarView: React.FC<SchoolCalendarViewProps> = ({
  terms,
  holidays,
  config,
  onUpdateTerm,
  onAddHoliday,
  onDeleteHoliday,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'holidays'>('terms');
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('2026-06-16');
  const [newHolDesc, setNewHolDesc] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolName.trim() || !newHolDate) return;

    onAddHoliday({
      id: `hol-${Date.now()}`,
      name: newHolName.trim(),
      date: newHolDate,
      description: newHolDesc.trim() || 'School Holiday / Event',
      isOfficialZimbabweHoliday: false,
    });

    setNewHolName('');
    setNewHolDesc('');
    setIsAddHolidayOpen(false);
    setNotice('Added new holiday / event to school calendar!');
    setTimeout(() => setNotice(null), 3500);
  };

  const handleExportHolidaysICS = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ZimSchool//Zimbabwe School Holidays 2026//EN',
      'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:Zimbabwe School Calendar & Public Holidays 2026',
      'X-WR-TIMEZONE:Africa/Harare',
    ];

    holidays.forEach((hol) => {
      const cleanDate = hol.date.replace(/-/g, '');
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:hol-${hol.id}@zimschool.local`);
      lines.push(`DTSTAMP:20260101T000000Z`);
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      lines.push(`SUMMARY:🇿🇼 ${hol.name}`);
      lines.push(`DESCRIPTION:${hol.description}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    const icsString = lines.join('\r\n');

    downloadICSFile('Zimbabwe_School_Holidays_2026.ics', icsString);

    confetti({
      particleCount: 40,
      spread: 50,
    });

    setNotice('Exported Zimbabwe Holidays & Terms (.ics) file!');
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🇿🇼</span>
            <h2 className="text-lg font-bold text-white">
              Zimbabwe Ministry of Education Term Dates & Public Holidays
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic holiday exclusion ensures lessons are not scheduled during national public holidays or school vacations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-holidays-ics"
            onClick={handleExportHolidaysICS}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Export Holidays to Calendar (.ics)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'terms'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3-Term School Calendar (2026)
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'holidays'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Zimbabwe Public Holidays ({holidays.length})
        </button>
      </div>

      {/* Terms View */}
      {activeTab === 'terms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {terms.map((term) => (
            <div
              key={term.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 ${
                term.isCurrent ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Term {term.termNumber} • {term.year}
                </span>
                {term.isCurrent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Term
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{term.termName}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {term.termNumber === 1
                    ? 'First Term of the Academic Year'
                    : term.termNumber === 2
                    ? 'Winter Term & Interschool Sports Season'
                    : 'ZIMSEC & Cambridge National Examinations'}
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Term Begins:</span>
                  <strong className="font-mono text-white">{term.startDate}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Term Ends:</span>
                  <strong className="font-mono text-white">{term.endDate}</strong>
                </div>

                {term.midtermStartDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mid-Term / Exeat:</span>
                    <strong className="font-mono text-amber-300">
                      {term.midtermStartDate} to {term.midtermEndDate}
                    </strong>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = terms.map((t) => ({
                      ...t,
                      isCurrent: t.id === term.id,
                    }));
                    terms.forEach((t) => onUpdateTerm({ ...t, isCurrent: t.id === term.id }));
                    setNotice(`Set active term to ${term.termName}!`);
                    setTimeout(() => setNotice(null), 3000);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition ${
                    term.isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {term.isCurrent ? 'Currently Active Schedule' : 'Switch to This Term'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Public Holidays View */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddHolidayOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom School Holiday / Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map((hol) => (
              <div
                key={hol.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-sm flex items-start justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {hol.isOfficialZimbabweHoliday ? '🇿🇼' : '📅'}
                    </span>
                    <h4 className="text-sm font-bold text-white">{hol.name}</h4>
                  </div>
                  <p className="text-xs text-amber-400 font-mono font-semibold">
                    {new Date(hol.date).toLocaleDateString('en-ZW', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-300">{hol.description}</p>
                </div>

                {!hol.isOfficialZimbabweHoliday && (
                  <button
                    onClick={() => onDeleteHoliday(hol.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                    title="Remove Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAddHolidayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add Custom Holiday or School Closure</h3>
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Holiday / Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Speech & Prize Giving Day, Exeat Break..."
                  value={newHolName}
                  onChange={(e) => setNewHolName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={newHolDate}
                  onChange={(e) => setNewHolDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Reason for closure or holiday details"
                  value={newHolDesc}
                  onChange={(e) => setNewHolDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

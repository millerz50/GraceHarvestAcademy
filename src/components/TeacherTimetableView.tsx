'use client';

import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Download,
  Printer,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  Clock,
  Briefcase,
  Sliders,
  ArrowLeftRight,
  Sun,
  Sunset,
  Layers,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Teacher,
  Subject,
  ClassStream,
  Room,
  PeriodSlot,
  LessonAllocation,
  SchoolTerm,
  PublicHoliday,
  DayOfWeek
} from '../types/timetable';
import { generateTimetableICS, downloadICSFile } from '../utils/calendarSync';
import { TeacherPreferencesModal } from './TeacherPreferencesModal';
import { SwapLessonsModal } from './SwapLessonsModal';

interface TeacherTimetableViewProps {
  teachers: Teacher[];
  subjects: Subject[];
  streams: ClassStream[];
  rooms: Room[];
  periods: PeriodSlot[];
  allocations: LessonAllocation[];
  currentTerm: SchoolTerm;
  holidays: PublicHoliday[];
  schoolName: string;
  onUpdateTeacher?: (updatedTeacher: Teacher) => void;
  onApplyNewAllocations?: (newAllocations: LessonAllocation[]) => void;
  onSwitchToPrint: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({
  teachers,
  subjects,
  streams,
  rooms,
  periods,
  allocations,
  currentTerm,
  holidays,
  schoolName,
  onUpdateTeacher,
  onApplyNewAllocations,
  onSwitchToPrint,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const streamMap = new Map<string, ClassStream>(streams.map((s) => [s.id, s]));
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));

  // Filter teachers by search query
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0];

  // Active teacher's lesson allocations
  const teacherAllocations = allocations.filter((a) => a.teacherId === activeTeacher?.id);

  // Teaching stats
  const totalLessonPeriods = periods.filter((p) => p.type === 'lesson').length * 5;
  const assignedPeriodsCount = teacherAllocations.length;
  const freePeriodsCount = totalLessonPeriods - assignedPeriodsCount;
  const workloadPercent = activeTeacher
    ? Math.round((assignedPeriodsCount / activeTeacher.maxPeriodsPerWeek) * 100)
    : 0;

  const pref = activeTeacher?.preferences;
  const unavailableList = pref?.unavailableSlots || [];

  // Export Teacher's Personal Calendar (.ICS)
  const handleExportTeacherICS = () => {
    if (!activeTeacher) return;

    const icsContent = generateTimetableICS({
      schoolName,
      term: currentTerm,
      holidays,
      allocations: teacherAllocations,
      subjects,
      teachers: [activeTeacher],
      streams,
      rooms,
      periods,
      filterTitle: `${activeTeacher.title} ${activeTeacher.name} Staff Schedule`,
    });

    const safeName = `${activeTeacher.title}_${activeTeacher.name}`.replace(/\s+/g, '_');
    downloadICSFile(`${safeName}_Schedule_Term${currentTerm.termNumber}_2026.ics`, icsContent);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    setExportNotice(`Exported calendar file (.ics) for ${activeTeacher.title} ${activeTeacher.name}!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Teacher Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="select-teacher-staff" className="text-xs font-bold text-slate-300 block mb-1">
                Select Staff Member:
              </label>
              <select
                id="select-teacher-staff"
                value={activeTeacher?.id}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5">
              <input
                id="input-teacher-search"
                type="text"
                placeholder="Search teacher by name/code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Swap Lesson Time</span>
            </button>

            <button
              onClick={() => setIsPreferencesModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Update Preferences</span>
            </button>

            <button
              id="btn-sync-teacher-cal"
              onClick={handleExportTeacherICS}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Sync (.ics)</span>
            </button>

            <button
              id="btn-print-teacher-timetable"
              onClick={onSwitchToPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Teacher Profile & Workload Card */}
      {activeTeacher && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Bio & Contact */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                {activeTeacher.code}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeTeacher.title} {activeTeacher.name}
                </h3>
                <p className="text-xs text-amber-400 font-medium">{activeTeacher.notes || 'Academic Staff'}</p>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-slate-300">{activeTeacher.email}</span>
              </div>
              {activeTeacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{activeTeacher.phone}</span>
                </div>
              )}
            </div>

            {/* Preference Indicators */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              {pref?.preferredTimeOfDay === 'morning' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                  <Sun className="w-3 h-3" /> Prefers Morning
                </span>
              )}
              {pref?.preferredTimeOfDay === 'afternoon' && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
                  <Sunset className="w-3 h-3" /> Prefers Afternoon
                </span>
              )}
              {unavailableList.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold">
                  🚫 {unavailableList.length} Blocked Slot{unavailableList.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Middle: Multiple Subjects Taught */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Acquired Subjects ({activeTeacher.subjectIds?.length || 0})
              </span>
              <button
                onClick={() => setIsPreferencesModalOpen(true)}
                className="text-[10px] text-amber-400 hover:underline"
              >
                + Add Subject
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeTeacher.subjectIds?.map((subjId) => {
                const subj = subjectMap.get(subjId);
                if (!subj) return null;
                const isPrimary = activeTeacher.primarySubjectId === subjId;
                return (
                  <span
                    key={subjId}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1"
                    style={{
                      backgroundColor: `${subj.color}15`,
                      color: subj.color,
                      borderColor: `${subj.color}40`,
                    }}
                  >
                    <BookOpen className="w-3 h-3" />
                    {subj.name} ({subj.code}) {isPrimary && '★'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right: Workload Analysis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                Weekly Teaching Load:
              </span>
              <span className="font-bold text-white">
                {assignedPeriodsCount} / {activeTeacher.maxPeriodsPerWeek} periods ({workloadPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all ${
                  workloadPercent > 100
                    ? 'bg-rose-500'
                    : workloadPercent > 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(workloadPercent, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Teaching: <strong className="text-amber-400">{assignedPeriodsCount}</strong> periods</span>
              <span>Free / Preparation: <strong className="text-emerald-400">{freePeriodsCount}</strong> periods</span>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Timetable Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
              <th className="py-3 px-3.5 font-bold text-slate-400 w-28 uppercase tracking-wider text-[11px] border-r border-slate-800">
                Day / Time
              </th>
              {periods.map((slot) => {
                const isBreak = slot.type === 'break' || slot.type === 'lunch';
                const isAssembly = slot.type === 'assembly';
                const isSports = slot.type === 'sports';

                return (
                  <th
                    key={slot.id}
                    className={`py-3 px-2 font-semibold text-center border-r border-slate-800/60 ${
                      isBreak
                        ? 'bg-amber-950/30 text-amber-300 w-20'
                        : isAssembly
                        ? 'bg-indigo-950/30 text-indigo-300 w-24'
                        : isSports
                        ? 'bg-emerald-950/30 text-emerald-300 w-28'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">{slot.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {DAYS.map((day) => (
              <tr key={day} className="hover:bg-slate-800/20 transition">
                <td className="py-3.5 px-3.5 font-bold text-slate-200 bg-slate-950/60 border-r border-slate-800 align-middle">
                  <div className="text-sm text-amber-400 font-bold">{day}</div>
                </td>

                {periods.map((slot) => {
                  if (slot.type === 'assembly') {
                    return (
                      <td key={slot.id} className="p-1.5 text-center bg-indigo-950/20 border-r border-slate-800/50 align-middle">
                        <div className="text-[10px] text-indigo-300 font-semibold py-2 px-1 rounded border border-indigo-500/20 bg-indigo-500/10">
                          Staff Duty / Assembly
                        </div>
                      </td>
                    );
                  }

                  if (slot.type === 'break') {
                    return (
                      <td key={slot.id} className="p-1.5 text-center bg-amber-950/20 border-r border-slate-800/50 align-middle">
                        <div className="text-[10px] text-amber-300 font-semibold py-2 px-1 rounded border border-amber-500/20 bg-amber-500/10">
                          Tea Break
                        </div>
                      </td>
                    );
                  }

                  if (slot.type === 'lunch') {
                    return (
                      <td key={slot.id} className="p-1.5 text-center bg-amber-950/20 border-r border-slate-800/50 align-middle">
                        <div className="text-[10px] text-amber-300 font-semibold py-2 px-1 rounded border border-amber-500/20 bg-amber-500/10">
                          Staff Lunch
                        </div>
                      </td>
                    );
                  }

                  if (slot.type === 'sports') {
                    return (
                      <td key={slot.id} className="p-1.5 text-center bg-emerald-950/20 border-r border-slate-800/50 align-middle">
                        <div className="text-[10px] text-emerald-300 font-semibold py-2 px-1 rounded border border-emerald-500/20 bg-emerald-500/10">
                          🏆 Coaching / Duties
                        </div>
                      </td>
                    );
                  }

                  // Check if slot is in unavailable slots for this teacher
                  const isBlockedSlot = unavailableList.some(
                    (u) => u.day === day && u.periodNumber === slot.periodNumber
                  );

                  // Find allocation for active teacher
                  const alloc = teacherAllocations.find(
                    (a) => a.day === day && a.periodNumber === slot.periodNumber
                  );

                  const subj = alloc ? subjectMap.get(alloc.subjectId) : undefined;
                  const stream = alloc ? streamMap.get(alloc.streamId) : undefined;
                  const room = alloc ? roomMap.get(alloc.roomId) : undefined;

                  return (
                    <td key={slot.id} className="p-1.5 border-r border-slate-800/60 align-top">
                      {alloc && subj && stream ? (
                        <div
                          className="h-full min-h-[70px] p-2 rounded-xl border flex flex-col justify-between shadow-xs"
                          style={{
                            backgroundColor: `${subj.color}15`,
                            borderColor: `${subj.color}40`,
                          }}
                        >
                          <div>
                            <div className="font-bold text-[11px] truncate text-white">
                              {stream.displayName}
                            </div>
                            <div
                              className="text-[10px] font-semibold truncate mt-0.5"
                              style={{ color: subj.color }}
                            >
                              {subj.name}
                            </div>
                          </div>

                          <div className="mt-1 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate">{room?.name || 'Classroom'}</span>
                            {alloc.isDoublePeriod && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                2x
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isBlockedSlot ? (
                        <div className="h-full min-h-[70px] bg-rose-950/20 border border-rose-500/30 rounded-xl flex flex-col items-center justify-center text-rose-400 p-2">
                          <AlertCircle className="w-3.5 h-3.5 mb-0.5 text-rose-400" />
                          <span className="text-[10px] font-bold">Unavailable</span>
                          <span className="text-[9px] text-rose-300/70">Staff Protected</span>
                        </div>
                      ) : (
                        <div className="h-full min-h-[70px] bg-slate-950/40 border border-slate-800/50 rounded-xl flex flex-col items-center justify-center text-slate-500 p-2">
                          <span className="text-[10px] font-medium text-emerald-400/80">
                            Free Period
                          </span>
                          <span className="text-[9px] text-slate-600">Marking / Prep</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Teacher Preferences Modal */}
      {isPreferencesModalOpen && activeTeacher && (
        <TeacherPreferencesModal
          isOpen={isPreferencesModalOpen}
          onClose={() => setIsPreferencesModalOpen(false)}
          teacher={activeTeacher}
          subjects={subjects}
          rooms={rooms}
          periods={periods}
          onSave={(updatedTeacher) => {
            if (onUpdateTeacher) {
              onUpdateTeacher(updatedTeacher);
            }
            setExportNotice(`Updated qualifications & preferences for ${updatedTeacher.title} ${updatedTeacher.name}`);
            setTimeout(() => setExportNotice(null), 3000);
          }}
        />
      )}

      {/* Swap Lessons Modal */}
      {isSwapModalOpen && (
        <SwapLessonsModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          streams={streams}
          subjects={subjects}
          teachers={teachers}
          rooms={rooms}
          periods={periods}
          allocations={allocations}
          onApplySwap={(newAllocs, msg) => {
            if (onApplyNewAllocations) {
              onApplyNewAllocations(newAllocs);
            }
            setExportNotice(msg);
            setTimeout(() => setExportNotice(null), 4000);
          }}
        />
      )}
    </div>
  );
};

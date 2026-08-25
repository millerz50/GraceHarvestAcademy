'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Printer,
  User,
  MapPin,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  ExternalLink,
  Plus,
  ArrowLeftRight,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ClassStream,
  Subject,
  Teacher,
  Room,
  PeriodSlot,
  LessonAllocation,
  SchoolTerm,
  PublicHoliday,
  DayOfWeek,
  ZimbabweForm
} from '../types/timetable';
import { SlotEditModal } from './SlotEditModal';
import { SwapLessonsModal } from './SwapLessonsModal';
import { generateTimetableICS, downloadICSFile } from '../utils/calendarSync';

interface ClassTimetableViewProps {
  streams: ClassStream[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  periods: PeriodSlot[];
  allocations: LessonAllocation[];
  currentTerm: SchoolTerm;
  holidays: PublicHoliday[];
  schoolName: string;
  onUpdateAllocation: (allocation: LessonAllocation) => void;
  onDeleteAllocation: (allocationId: string) => void;
  onApplyNewAllocations: (newAllocations: LessonAllocation[]) => void;
  onSwitchToPrint: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const FORMS: ZimbabweForm[] = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6'];

export const ClassTimetableView: React.FC<ClassTimetableViewProps> = ({
  streams,
  subjects,
  teachers,
  rooms,
  periods,
  allocations,
  currentTerm,
  holidays,
  schoolName,
  onUpdateAllocation,
  onDeleteAllocation,
  onApplyNewAllocations,
  onSwitchToPrint,
}) => {
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('ALL');
  const [selectedStreamId, setSelectedStreamId] = useState<string>(streams[0]?.id || '');
  const [activeSlotModal, setActiveSlotModal] = useState<{
    day: DayOfWeek;
    period: PeriodSlot;
    allocation?: LessonAllocation;
  } | null>(null);

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapInitialAlloc, setSwapInitialAlloc] = useState<LessonAllocation | undefined>(undefined);
  const [calendarSyncSuccess, setCalendarSyncSuccess] = useState<string | null>(null);

  // Filter streams by selected form
  const filteredStreams = selectedFormFilter === 'ALL'
    ? streams
    : streams.filter((s) => s.form === selectedFormFilter);

  // Current active stream
  const activeStream = streams.find((s) => s.id === selectedStreamId) || filteredStreams[0] || streams[0];

  // Quick lookup maps
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));

  // Active stream's allocations
  const streamAllocations = allocations.filter((a) => a.streamId === activeStream?.id);

  const classTeacher = activeStream?.classTeacherId ? teacherMap.get(activeStream.classTeacherId) : undefined;
  const homeRoom = activeStream?.homeRoomId ? roomMap.get(activeStream.homeRoomId) : undefined;

  // Handle slot click
  const handleSlotClick = (day: DayOfWeek, period: PeriodSlot) => {
    if (period.type === 'break' || period.type === 'lunch' || period.type === 'assembly') return;

    const existing = streamAllocations.find(
      (a) => a.day === day && a.periodNumber === period.periodNumber
    );

    setActiveSlotModal({
      day,
      period,
      allocation: existing,
    });
  };

  // Open swap modal directly from slot
  const handleOpenSwapForSlot = (e: React.MouseEvent, alloc: LessonAllocation) => {
    e.stopPropagation();
    setSwapInitialAlloc(alloc);
    setIsSwapModalOpen(true);
  };

  // Handle slot save
  const handleSaveSlot = (data: {
    subjectId: string;
    teacherId: string;
    roomId: string;
    isDoublePeriod: boolean;
  }) => {
    if (!activeSlotModal || !activeStream) return;

    const newAlloc: LessonAllocation = {
      id: activeSlotModal.allocation?.id || `alloc-${Date.now()}`,
      streamId: activeStream.id,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      roomId: data.roomId,
      day: activeSlotModal.day,
      periodNumber: activeSlotModal.period.periodNumber,
      isDoublePeriod: data.isDoublePeriod,
    };

    onUpdateAllocation(newAlloc);
    setActiveSlotModal(null);
  };

  // Handle slot delete
  const handleDeleteSlot = () => {
    if (activeSlotModal?.allocation) {
      onDeleteAllocation(activeSlotModal.allocation.id);
    }
    setActiveSlotModal(null);
  };

  // Export full stream .ICS calendar file
  const handleExportICS = () => {
    if (!activeStream) return;

    const icsContent = generateTimetableICS({
      schoolName,
      term: currentTerm,
      holidays,
      allocations: streamAllocations,
      subjects,
      teachers,
      streams: [activeStream],
      rooms,
      periods,
      filterTitle: activeStream.displayName,
    });

    const safeName = activeStream.displayName.replace(/\s+/g, '_');
    downloadICSFile(`${safeName}_Timetable_Term${currentTerm.termNumber}_2026.ics`, icsContent);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    setCalendarSyncSuccess(`Exported calendar file (.ics) for ${activeStream.displayName}!`);
    setTimeout(() => setCalendarSyncSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter and Stream Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Form Level Pills Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Level:
          </span>
          <button
            id="filter-level-all"
            onClick={() => {
              setSelectedFormFilter('ALL');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedFormFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Forms (1-6)
          </button>
          {FORMS.map((form) => (
            <button
              key={form}
              id={`filter-level-${form.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => {
                setSelectedFormFilter(form);
                const firstMatching = streams.find((s) => s.form === form);
                if (firstMatching) setSelectedStreamId(firstMatching.id);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedFormFilter === form
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {form}
            </button>
          ))}
        </div>

        {/* Stream Selector Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <label htmlFor="select-class-stream" className="text-xs font-bold text-slate-300">
              Select Class Stream:
            </label>
            <select
              id="select-class-stream"
              value={activeStream?.id}
              onChange={(e) => setSelectedStreamId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
            >
              {filteredStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} ({s.studentCount} Students)
                </option>
              ))}
            </select>
          </div>

          {/* Sync & Export & Swap Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-swap-class-lessons"
              onClick={() => {
                setSwapInitialAlloc(undefined);
                setIsSwapModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition transform hover:scale-[1.02]"
              title="Swap any two lesson periods or times"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Swap Time / Periods</span>
            </button>

            <button
              id="btn-sync-class-calendar"
              onClick={handleExportICS}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              title="Download standard .ICS file for Google Calendar, Apple Calendar, or Outlook"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Sync to Google/Apple Calendar (.ics)</span>
            </button>

            <button
              id="btn-print-class-timetable"
              onClick={onSwitchToPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Timetable</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {calendarSyncSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{calendarSyncSuccess} You can now import this file into Google Calendar, phone, or computer.</span>
          </div>
        )}
      </div>

      {/* Class Meta Card */}
      {activeStream && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-amber-400" />
              <span>
                Class Master/Mistress:{' '}
                <strong className="text-white">
                  {classTeacher ? `${classTeacher.title} ${classTeacher.name} (${classTeacher.code})` : 'Unassigned'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>
                Home Base:{' '}
                <strong className="text-white">{homeRoom?.name || 'Classroom'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>
                Weekly Lessons:{' '}
                <strong className="text-amber-400">{streamAllocations.length} periods</strong>
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            Tip: Click on any period card to edit, or use &quot;Swap Time&quot; to swap slots
          </span>
        </div>
      )}

      {/* Timetable Grid Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left text-xs">
          {/* Table Header: Periods & Bell Schedule */}
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

          {/* Table Body: 5 School Days (Mon-Fri) */}
          <tbody className="divide-y divide-slate-800/60">
            {DAYS.map((day) => (
              <tr key={day} className="hover:bg-slate-800/20 transition">
                {/* Day Header Column */}
                <td className="py-3.5 px-3.5 font-bold text-slate-200 bg-slate-950/60 border-r border-slate-800 align-middle">
                  <div className="text-sm text-amber-400 font-bold">{day}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {day === 'Friday' ? 'Half-Day Sports' : 'Academic'}
                  </div>
                </td>

                {/* Period Columns */}
                {periods.map((slot) => {
                  if (slot.type === 'assembly') {
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 text-center bg-indigo-950/20 border-r border-slate-800/50 align-middle"
                      >
                        <div className="text-[10px] text-indigo-300 font-semibold py-2 px-1 rounded border border-indigo-500/20 bg-indigo-500/10">
                          {day === 'Monday' || day === 'Friday' ? 'Full Assembly' : 'Devotion'}
                        </div>
                      </td>
                    );
                  }

                  if (slot.type === 'break') {
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 text-center bg-amber-950/20 border-r border-slate-800/50 align-middle"
                      >
                        <div className="text-[10px] text-amber-300 font-semibold py-2 px-1 rounded border border-amber-500/20 bg-amber-500/10">
                          Tea Break
                        </div>
                      </td>
                    );
                  }

                  if (slot.type === 'lunch') {
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 text-center bg-amber-950/20 border-r border-slate-800/50 align-middle"
                      >
                        <div className="text-[10px] text-amber-300 font-semibold py-2 px-1 rounded border border-amber-500/20 bg-amber-500/10">
                          Lunch
                        </div>
                      </td>
                    );
                  }

                  if (slot.type === 'sports') {
                    const hasSportsToday = slot.appliesToDays.includes(day);
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 text-center bg-emerald-950/20 border-r border-slate-800/50 align-middle"
                      >
                        {hasSportsToday ? (
                          <div className="text-[10px] text-emerald-300 font-semibold py-2 px-1 rounded border border-emerald-500/20 bg-emerald-500/10">
                            🏆 Sports & Clubs
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 italic">Study Prep</div>
                        )}
                      </td>
                    );
                  }

                  // Normal Lesson Slot
                  const alloc = streamAllocations.find(
                    (a) => a.day === day && a.periodNumber === slot.periodNumber
                  );

                  const subj = alloc ? subjectMap.get(alloc.subjectId) : undefined;
                  const teacher = alloc ? teacherMap.get(alloc.teacherId) : undefined;
                  const room = alloc ? roomMap.get(alloc.roomId) : undefined;

                  return (
                    <td
                      key={slot.id}
                      onClick={() => handleSlotClick(day, slot)}
                      className="p-1.5 border-r border-slate-800/60 align-top cursor-pointer hover:bg-slate-800/50 transition group relative"
                    >
                      {alloc && subj ? (
                        <div
                          className="h-full min-h-[70px] p-2 rounded-xl border flex flex-col justify-between transition-all group-hover:scale-[1.02] shadow-xs relative"
                          style={{
                            backgroundColor: `${subj.color}15`,
                            borderColor: `${subj.color}40`,
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="font-bold text-[11px] truncate leading-tight"
                                style={{ color: subj.color }}
                                title={subj.name}
                              >
                                {subj.name}
                              </span>
                              <div className="flex items-center gap-1">
                                {alloc.isDoublePeriod && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                    2x
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenSwapForSlot(e, alloc)}
                                  title="Quick Swap This Slot"
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {subj.code}
                            </div>
                          </div>

                          <div className="mt-1 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                            <span className="text-slate-300 font-medium truncate" title={teacher?.name}>
                              {teacher ? `${teacher.title} ${teacher.code}` : 'TBA'}
                            </span>
                            <span className="text-slate-400 text-[9px] truncate" title={room?.name}>
                              {room ? room.name.split(' ')[0] : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full min-h-[70px] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 group-hover:border-amber-400/40 group-hover:text-amber-400 transition p-2">
                          <Plus className="w-3.5 h-3.5 mb-0.5 opacity-0 group-hover:opacity-100 transition" />
                          <span className="text-[10px] font-medium">Free Period</span>
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

      {/* Slot Edit Modal */}
      {activeSlotModal && activeStream && (
        <SlotEditModal
          isOpen={true}
          onClose={() => setActiveSlotModal(null)}
          day={activeSlotModal.day}
          period={activeSlotModal.period}
          stream={activeStream}
          allocation={activeSlotModal.allocation}
          subjects={subjects}
          teachers={teachers}
          rooms={rooms}
          currentTerm={currentTerm}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
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
          initialStreamId={activeStream?.id}
          initialAllocationA={swapInitialAlloc}
          onApplySwap={(newAllocs, message) => {
            onApplyNewAllocations(newAllocs);
            setCalendarSyncSuccess(message);
            setTimeout(() => setCalendarSyncSuccess(null), 4000);
          }}
        />
      )}
    </div>
  );
};

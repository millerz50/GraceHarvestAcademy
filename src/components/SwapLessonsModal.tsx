'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  LessonAllocation,
  Subject,
  Teacher,
  ClassStream,
  Room,
  PeriodSlot,
  DayOfWeek
} from '../types/timetable';
import { swapLessonAllocations } from '../utils/timetableGenerator';
import confetti from 'canvas-confetti';

interface SwapLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streams: ClassStream[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  periods: PeriodSlot[];
  allocations: LessonAllocation[];
  initialStreamId?: string;
  initialAllocationA?: LessonAllocation;
  onApplySwap: (newAllocations: LessonAllocation[], message: string) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const SwapLessonsModal: React.FC<SwapLessonsModalProps> = ({
  isOpen,
  onClose,
  streams,
  subjects,
  teachers,
  rooms,
  periods,
  allocations,
  initialStreamId,
  initialAllocationA,
  onApplySwap,
}) => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    initialStreamId || streams[0]?.id || ''
  );
  const [allocAId, setAllocAId] = useState<string>(initialAllocationA?.id || '');
  const [allocBId, setAllocBId] = useState<string>('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));
  const streamMap = new Map<string, ClassStream>(streams.map((s) => [s.id, s]));

  // Stream allocations
  const streamAllocations = allocations.filter((a) => a.streamId === selectedStreamId);

  // Selected allocations
  const allocA = allocations.find((a) => a.id === allocAId);
  const allocB = allocations.find((a) => a.id === allocBId);

  const getSubj = (id?: string) => (id ? subjectMap.get(id) : undefined);
  const getTeacher = (id?: string) => (id ? teacherMap.get(id) : undefined);
  const getRoom = (id?: string) => (id ? roomMap.get(id) : undefined);

  // Check potential conflicts before swap
  const checkSwapConflicts = () => {
    if (!allocA || !allocB) return null;

    const warnings: string[] = [];

    // Check if Teacher A is already busy at Slot B's time
    if (allocA.teacherId) {
      const busyOther = allocations.find(
        (a) =>
          a.id !== allocA.id &&
          a.id !== allocB.id &&
          a.teacherId === allocA.teacherId &&
          a.day === allocB.day &&
          a.periodNumber === allocB.periodNumber
      );
      if (busyOther) {
        const otherStream = streamMap.get(busyOther.streamId);
        const t = getTeacher(allocA.teacherId);
        warnings.push(
          `Teacher ${t?.title} ${t?.name} is already teaching ${otherStream?.displayName || 'another class'} on ${allocB.day} Period ${allocB.periodNumber}.`
        );
      }
    }

    // Check if Teacher B is already busy at Slot A's time
    if (allocB.teacherId) {
      const busyOther = allocations.find(
        (a) =>
          a.id !== allocA.id &&
          a.id !== allocB.id &&
          a.teacherId === allocB.teacherId &&
          a.day === allocA.day &&
          a.periodNumber === allocA.periodNumber
      );
      if (busyOther) {
        const otherStream = streamMap.get(busyOther.streamId);
        const t = getTeacher(allocB.teacherId);
        warnings.push(
          `Teacher ${t?.title} ${t?.name} is already teaching ${otherStream?.displayName || 'another class'} on ${allocA.day} Period ${allocA.periodNumber}.`
        );
      }
    }

    return warnings;
  };

  const conflicts = checkSwapConflicts();

  const handlePerformSwap = () => {
    if (!allocAId || !allocBId) {
      setFeedback({ text: 'Please select both Lesson Slot A and Lesson Slot B to swap.', type: 'error' });
      return;
    }

    if (allocAId === allocBId) {
      setFeedback({ text: 'Cannot swap a lesson slot with itself. Choose a different target slot.', type: 'error' });
      return;
    }

    const result = swapLessonAllocations(allocations, allocAId, allocBId);
    if (result.success) {
      onApplySwap(result.newAllocations, result.message);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      onClose();
    } else {
      setFeedback({ text: result.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Swap Lesson Times & Periods</h3>
              <p className="text-xs text-slate-400">
                Instantly swap two time slots with automatic clash detection and validation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              feedback.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {feedback.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Filter Stream */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Class / Stream
          </label>
          <select
            value={selectedStreamId}
            onChange={(e) => {
              setSelectedStreamId(e.target.value);
              setAllocAId('');
              setAllocBId('');
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {streams.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName} ({st.form})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Dual Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot A */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                First Slot (Slot A)
              </span>
              {allocA && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                  {allocA.day} P{allocA.periodNumber}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Choose Lesson Slot</label>
              <select
                value={allocAId}
                onChange={(e) => setAllocAId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">-- Select Lesson Slot A --</option>
                {streamAllocations.map((a) => {
                  const s = getSubj(a.subjectId);
                  const t = getTeacher(a.teacherId);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.day} P{a.periodNumber}: {s?.name || 'Subject'} ({t?.code || 'TBA'})
                    </option>
                  );
                })}
              </select>
            </div>

            {allocA ? (
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  {getSubj(allocA.subjectId)?.name}
                </div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  {getTeacher(allocA.teacherId)?.title} {getTeacher(allocA.teacherId)?.name} (
                  {getTeacher(allocA.teacherId)?.code})
                </div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {getRoom(allocA.roomId)?.name}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                Select a slot above
              </div>
            )}
          </div>

          {/* Slot B */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Second Slot (Slot B)
              </span>
              {allocB && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono">
                  {allocB.day} P{allocB.periodNumber}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Choose Lesson Slot</label>
              <select
                value={allocBId}
                onChange={(e) => setAllocBId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">-- Select Lesson Slot B --</option>
                {streamAllocations.map((a) => {
                  const s = getSubj(a.subjectId);
                  const t = getTeacher(a.teacherId);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.day} P{a.periodNumber}: {s?.name || 'Subject'} ({t?.code || 'TBA'})
                    </option>
                  );
                })}
              </select>
            </div>

            {allocB ? (
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  {getSubj(allocB.subjectId)?.name}
                </div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  {getTeacher(allocB.teacherId)?.title} {getTeacher(allocB.teacherId)?.name} (
                  {getTeacher(allocB.teacherId)?.code})
                </div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {getRoom(allocB.roomId)?.name}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                Select a slot above
              </div>
            )}
          </div>
        </div>

        {/* Clash & Warnings Report */}
        {conflicts && conflicts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Teacher Schedule Notice
            </div>
            {conflicts.map((c, i) => (
              <p key={i} className="text-slate-300">
                • {c}
              </p>
            ))}
          </div>
        )}

        {conflicts && conflicts.length === 0 && allocA && allocB && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Clean swap: No teacher or venue clashes detected.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePerformSwap}
            disabled={!allocAId || !allocBId}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Perform Swap</span>
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { X, Save, Trash2, Calendar, User, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import {
  LessonAllocation,
  Subject,
  Teacher,
  ClassStream,
  Room,
  PeriodSlot,
  DayOfWeek,
  SchoolTerm
} from '../types/timetable';
import { buildGoogleCalendarUrl } from '../utils/calendarSync';

interface SlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  period: PeriodSlot;
  stream: ClassStream;
  allocation?: LessonAllocation;
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  currentTerm: SchoolTerm;
  onSave: (allocationData: {
    subjectId: string;
    teacherId: string;
    roomId: string;
    isDoublePeriod: boolean;
  }) => void;
  onDelete?: () => void;
}

export const SlotEditModal: React.FC<SlotEditModalProps> = ({
  isOpen,
  onClose,
  day,
  period,
  stream,
  allocation,
  subjects,
  teachers,
  rooms,
  currentTerm,
  onSave,
  onDelete,
}) => {
  const [subjectId, setSubjectId] = useState(allocation?.subjectId || '');
  const [teacherId, setTeacherId] = useState(allocation?.teacherId || '');
  const [roomId, setRoomId] = useState(allocation?.roomId || stream.homeRoomId || rooms[0]?.id || '');
  const [isDoublePeriod, setIsDoublePeriod] = useState(allocation?.isDoublePeriod || false);

  if (!isOpen) return null;

  const handleSubjectChange = (newSubjId: string) => {
    setSubjectId(newSubjId);
    const selectedSubj = subjects.find((s) => s.id === newSubjId);
    
    // Auto-suggest qualified teacher if current teacher not selected or invalid
    if (selectedSubj) {
      const qualified = teachers.find((t) => t.subjectIds.includes(newSubjId));
      if (qualified && (!teacherId || !teachers.find((t) => t.id === teacherId)?.subjectIds.includes(newSubjId))) {
        setTeacherId(qualified.id);
      }

      // Auto-suggest lab if needed
      if (selectedSubj.requiresLab && selectedSubj.labType) {
        const matchingLab = rooms.find((r) => r.type === selectedSubj.labType);
        if (matchingLab) {
          setRoomId(matchingLab.id);
        }
      }
    }
  };

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const selectedTeacher = teachers.find((t) => t.id === teacherId);
  const selectedRoom = rooms.find((r) => r.id === roomId);

  // Generate Google Calendar Link for this slot
  const generateGCalLink = () => {
    if (!selectedSubject) return '#';
    const [sh, sm] = period.startTime.split(':').map(Number);
    const [eh, em] = period.endTime.split(':').map(Number);

    const now = new Date();
    const startD = new Date(now);
    startD.setHours(sh, sm, 0);
    const endD = new Date(now);
    endD.setHours(eh, em, 0);

    return buildGoogleCalendarUrl({
      title: `${selectedSubject.name} (${stream.displayName})`,
      details: `Class: ${stream.displayName}\nTeacher: ${selectedTeacher?.title || ''} ${selectedTeacher?.name || ''}\nDepartment: ${selectedSubject.department}\nZimbabwe School Timetable`,
      location: selectedRoom?.name || stream.displayName,
      startDate: startD,
      endDate: endD,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              {day} • {period.name}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Edit Slot: {stream.displayName}
            </h3>
            <p className="text-xs text-slate-400">
              {period.startTime} - {period.endTime} ({currentTerm.termName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Subject (ZIMSEC / Cambridge)
            </label>
            <select
              id="select-slot-subject"
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name} ({subj.code}) — {subj.department}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Assigned Teacher
            </label>
            <select
              id="select-slot-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Room / Facility */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Room / Laboratory
            </label>
            <select
              id="select-slot-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Double Period Checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="checkbox-double-period"
              checked={isDoublePeriod}
              onChange={(e) => setIsDoublePeriod(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-800"
            />
            <label htmlFor="checkbox-double-period" className="text-xs text-slate-300 cursor-pointer">
              Double Period (Block with adjacent practical session)
            </label>
          </div>

          {/* 1-Click Google Calendar Action */}
          {allocation && selectedSubject && (
            <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Google Calendar Sync</p>
                <p className="text-slate-400">Add this specific lesson to your calendar</p>
              </div>
              <a
                href={generateGCalLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to Google Cal
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between">
          {allocation && onDelete ? (
            <button
              id="btn-delete-slot"
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-lg hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Slot
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-slot"
              type="button"
              disabled={!subjectId || !teacherId}
              onClick={() =>
                onSave({
                  subjectId,
                  teacherId,
                  roomId,
                  isDoublePeriod,
                })
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-50 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

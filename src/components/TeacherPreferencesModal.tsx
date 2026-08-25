'use client';

import React, { useState } from 'react';
import {
  X,
  Save,
  Check,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  MapPin,
  AlertCircle,
  Sun,
  Sunset,
  Layers
} from 'lucide-react';
import {
  Teacher,
  Subject,
  Room,
  PeriodSlot,
  DayOfWeek,
  Department,
  TeacherPreferences,
  UnavailableSlot
} from '../types/timetable';

interface TeacherPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
  subjects: Subject[];
  rooms: Room[];
  periods: PeriodSlot[];
  onSave: (updatedTeacher: Teacher) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TeacherPreferencesModal: React.FC<TeacherPreferencesModalProps> = ({
  isOpen,
  onClose,
  teacher,
  subjects,
  rooms,
  periods,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'preferences' | 'unavailable'>('subjects');

  // Form State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(teacher.subjectIds || []);
  const [primarySubjectId, setPrimarySubjectId] = useState<string>(
    teacher.primarySubjectId || teacher.subjectIds[0] || ''
  );
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<'morning' | 'afternoon' | 'any'>(
    teacher.preferences?.preferredTimeOfDay || 'any'
  );
  const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>(
    teacher.preferences?.preferredDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  );
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>(
    teacher.preferences?.unavailableSlots || []
  );
  const [preferredRooms, setPreferredRooms] = useState<string[]>(
    teacher.preferences?.preferredRooms || teacher.preferredRooms || []
  );
  const [maxConsecutivePeriods, setMaxConsecutivePeriods] = useState<number>(
    teacher.preferences?.maxConsecutivePeriods || 3
  );
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  const [subjectSearch, setSubjectSearch] = useState<string>('');

  if (!isOpen) return null;

  const lessonPeriods = periods
    .filter((p) => p.type === 'lesson')
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Filter subjects for multi-subject acquisition
  const filteredSubjects = subjects.filter((s) => {
    const matchesDept = selectedDepartmentFilter === 'ALL' || s.department === selectedDepartmentFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Toggle subject acquisition
  const handleToggleSubject = (subjectId: string) => {
    if (selectedSubjectIds.includes(subjectId)) {
      const next = selectedSubjectIds.filter((id) => id !== subjectId);
      setSelectedSubjectIds(next);
      if (primarySubjectId === subjectId) {
        setPrimarySubjectId(next[0] || '');
      }
    } else {
      const next = [...selectedSubjectIds, subjectId];
      setSelectedSubjectIds(next);
      if (!primarySubjectId) {
        setPrimarySubjectId(subjectId);
      }
    }
  };

  // Toggle preferred day
  const handleToggleDay = (day: DayOfWeek) => {
    if (preferredDays.includes(day)) {
      if (preferredDays.length > 1) {
        setPreferredDays(preferredDays.filter((d) => d !== day));
      }
    } else {
      setPreferredDays([...preferredDays, day]);
    }
  };

  // Toggle unavailable slot in matrix
  const handleToggleUnavailableSlot = (day: DayOfWeek, periodNumber: number) => {
    const existingIndex = unavailableSlots.findIndex(
      (u) => u.day === day && u.periodNumber === periodNumber
    );

    if (existingIndex >= 0) {
      setUnavailableSlots(unavailableSlots.filter((_, idx) => idx !== existingIndex));
    } else {
      setUnavailableSlots([
        ...unavailableSlots,
        {
          day,
          periodNumber,
          reason: 'Staff unavailable / administrative commitment',
        },
      ]);
    }
  };

  // Toggle preferred room
  const handleToggleRoom = (roomId: string) => {
    if (preferredRooms.includes(roomId)) {
      setPreferredRooms(preferredRooms.filter((r) => r !== roomId));
    } else {
      setPreferredRooms([...preferredRooms, roomId]);
    }
  };

  const handleSave = () => {
    const updatedPreferences: TeacherPreferences = {
      preferredTimeOfDay,
      preferredDays,
      unavailableSlots,
      preferredRooms,
      maxConsecutivePeriods,
    };

    const updatedTeacher: Teacher = {
      ...teacher,
      subjectIds: selectedSubjectIds,
      primarySubjectId,
      preferredRooms,
      preferences: updatedPreferences,
    };

    onSave(updatedTeacher);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden text-slate-100 p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              {teacher.code}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {teacher.title} {teacher.name} — Qualifications & Preferences
              </h3>
              <p className="text-xs text-slate-400">
                Manage multiple subjects taught, preferred teaching hours, and blocked unavailable periods
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'subjects'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Multiple Subjects Taught ({selectedSubjectIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'preferences'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Schedule Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('unavailable')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'unavailable'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Unavailable Slots Matrix ({unavailableSlots.length})</span>
          </button>
        </div>

        {/* TAB 1: MULTIPLE SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Acquired Teaching Subjects ({selectedSubjectIds.length} Assigned)
                </span>
                <span className="text-[11px] text-slate-400">
                  Click any subject below to assign or unassign to {teacher.name}
                </span>
              </div>

              {/* Selected Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedSubjectIds.map((id) => {
                  const s = subjects.find((sub) => sub.id === id);
                  if (!s) return null;
                  const isPrimary = primarySubjectId === s.id;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium"
                      style={{
                        backgroundColor: `${s.color}20`,
                        borderColor: `${s.color}60`,
                        color: '#ffffff',
                      }}
                    >
                      <span className="font-bold">{s.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({s.code})</span>

                      <button
                        type="button"
                        onClick={() => setPrimarySubjectId(s.id)}
                        title="Set as Primary Subject"
                        className={`ml-1 text-[10px] px-1.5 py-0.5 rounded transition ${
                          isPrimary
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isPrimary ? '★ Primary' : 'Make Primary'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSubject(s.id)}
                        className="ml-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {selectedSubjectIds.length === 0 && (
                  <span className="text-xs text-rose-400 italic">
                    ⚠️ No subjects currently assigned. Please select at least one subject below.
                  </span>
                )}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search subject by name or code (e.g., Mathematics, 4008, Physics)..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500"
              />

              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="ALL">All Departments</option>
                <option value="Sciences">Sciences</option>
                <option value="Languages">Languages</option>
                <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                <option value="Commercials">Commercials</option>
                <option value="Technical & Vocational">Technical & Vocational</option>
                <option value="Physical Education & Arts">Physical Education & Arts</option>
              </select>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {filteredSubjects.map((s) => {
                const isSelected = selectedSubjectIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleSubject(s.id)}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs leading-tight text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{s.code}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{s.department}</div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-500'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            {/* Preferred Time of Day */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Preferred Teaching Time of Day
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredTimeOfDay('morning')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                    preferredTimeOfDay === 'morning'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-400" />
                  <span className="text-xs">Morning Preference</span>
                  <span className="text-[10px] text-slate-400">Periods 1 - 4 (07:30 - 10:45)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredTimeOfDay('afternoon')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                    preferredTimeOfDay === 'afternoon'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Sunset className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs">Afternoon Preference</span>
                  <span className="text-[10px] text-slate-400">Periods 5 - 9 (11:05 - 15:30)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredTimeOfDay('any')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                    preferredTimeOfDay === 'any'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs">Any Time / Flexible</span>
                  <span className="text-[10px] text-slate-400">Even weekly distribution</span>
                </button>
              </div>
            </div>

            {/* Preferred Teaching Days */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Active Teaching Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = preferredDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800/70 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Consecutive Periods */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Max Consecutive Teaching Periods
                </label>
                <span className="text-xs font-bold text-amber-400">
                  {maxConsecutivePeriods} Periods Max (in a row)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                value={maxConsecutivePeriods}
                onChange={(e) => setMaxConsecutivePeriods(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg"
              />
              <p className="text-[11px] text-slate-400">
                Prevents scheduling teacher for more than {maxConsecutivePeriods} lessons consecutively without a break or free period.
              </p>
            </div>

            {/* Preferred Rooms */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Preferred Teaching Venues & Laboratories
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {rooms.map((r) => {
                  const isSelected = preferredRooms.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleToggleRoom(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UNAVAILABLE SLOTS MATRIX */}
        {activeTab === 'unavailable' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                Unavailable Slots Matrix
              </span>
              <span className="text-[11px] text-slate-400">
                Click any slot to block it (e.g. HOD meetings, sports coaching, duty)
              </span>
            </div>

            {/* Matrix */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60 p-3">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2 text-left font-semibold">Period</th>
                    {DAYS.map((day) => (
                      <th key={day} className="py-2 px-2 font-semibold">
                        {day.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lessonPeriods.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/50">
                      <td className="py-2 px-2 text-left text-slate-400 font-mono text-[11px]">
                        P{p.periodNumber} ({p.startTime})
                      </td>
                      {DAYS.map((day) => {
                        const isBlocked = unavailableSlots.some(
                          (u) => u.day === day && u.periodNumber === p.periodNumber
                        );
                        return (
                          <td key={day} className="p-1">
                            <button
                              type="button"
                              onClick={() => handleToggleUnavailableSlot(day, p.periodNumber)}
                              className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${
                                isBlocked
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800/80'
                              }`}
                            >
                              {isBlocked ? '🚫 Blocked' : 'Available'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Qualifications & Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

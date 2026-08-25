'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_SCHOOL_CONFIG,
  INITIAL_TERMS,
  ZIMBABWE_PUBLIC_HOLIDAYS_2026,
  INITIAL_SUBJECTS,
  INITIAL_ROOMS,
  INITIAL_TEACHERS,
  INITIAL_STREAMS,
  INITIAL_PERIOD_SLOTS,
  INITIAL_SPORTS_ACTIVITIES,
  generateSampleAllocations,
} from '@/data/zimbabwePreset';
import {
  SchoolConfig,
  SchoolTerm,
  PublicHoliday,
  Subject,
  Room,
  Teacher,
  ClassStream,
  PeriodSlot,
  SportActivity,
  LessonAllocation,
} from '@/types/timetable';
import { Navbar } from '@/components/Navbar';
import { ClassTimetableView } from '@/components/ClassTimetableView';
import { TeacherTimetableView } from '@/components/TeacherTimetableView';
import { SportsScheduleView } from '@/components/SportsScheduleView';
import { SchoolCalendarView } from '@/components/SchoolCalendarView';
import { PrintTimetableView } from '@/components/PrintTimetableView';
import { AdminHubView } from '@/components/AdminHubView';
import { ConflictModal } from '@/components/ConflictModal';
import { detectTimetableConflicts } from '@/utils/conflictDetector';
import { autoGenerateTimetable } from '@/utils/timetableGenerator';

export default function TimetableApp() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'class' | 'teacher' | 'sports' | 'calendar' | 'print' | 'admin'
  >('class');

  // Persistence State
  const [config, setConfig] = useState<SchoolConfig>(INITIAL_SCHOOL_CONFIG);
  const [terms, setTerms] = useState<SchoolTerm[]>(INITIAL_TERMS);
  const [holidays, setHolidays] = useState<PublicHoliday[]>(ZIMBABWE_PUBLIC_HOLIDAYS_2026);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [streams, setStreams] = useState<ClassStream[]>(INITIAL_STREAMS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [periods, setPeriods] = useState<PeriodSlot[]>(INITIAL_PERIOD_SLOTS);
  const [sports, setSports] = useState<SportActivity[]>(INITIAL_SPORTS_ACTIVITIES);
  const [allocations, setAllocations] = useState<LessonAllocation[]>(() => generateSampleAllocations());
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Client-side hydration from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('zim_school_config');
      if (savedConfig) setConfig(JSON.parse(savedConfig));

      const savedTerms = localStorage.getItem('zim_school_terms');
      if (savedTerms) setTerms(JSON.parse(savedTerms));

      const savedHolidays = localStorage.getItem('zim_school_holidays');
      if (savedHolidays) setHolidays(JSON.parse(savedHolidays));

      const savedSubjects = localStorage.getItem('zim_school_subjects');
      if (savedSubjects) setSubjects(JSON.parse(savedSubjects));

      const savedTeachers = localStorage.getItem('zim_school_teachers');
      if (savedTeachers) setTeachers(JSON.parse(savedTeachers));

      const savedStreams = localStorage.getItem('zim_school_streams');
      if (savedStreams) setStreams(JSON.parse(savedStreams));

      const savedRooms = localStorage.getItem('zim_school_rooms');
      if (savedRooms) setRooms(JSON.parse(savedRooms));

      const savedPeriods = localStorage.getItem('zim_school_periods');
      if (savedPeriods) setPeriods(JSON.parse(savedPeriods));

      const savedSports = localStorage.getItem('zim_school_sports');
      if (savedSports) setSports(JSON.parse(savedSports));

      const savedAllocations = localStorage.getItem('zim_school_allocations');
      if (savedAllocations) setAllocations(JSON.parse(savedAllocations));
    } catch (e) {
      console.warn('Could not read saved data from localStorage:', e);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('zim_school_config', JSON.stringify(config));
    } catch (e) {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_terms', JSON.stringify(terms));
    } catch (e) {}
  }, [terms]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_holidays', JSON.stringify(holidays));
    } catch (e) {}
  }, [holidays]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_subjects', JSON.stringify(subjects));
    } catch (e) {}
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_teachers', JSON.stringify(teachers));
    } catch (e) {}
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_streams', JSON.stringify(streams));
    } catch (e) {}
  }, [streams]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_rooms', JSON.stringify(rooms));
    } catch (e) {}
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_periods', JSON.stringify(periods));
    } catch (e) {}
  }, [periods]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_sports', JSON.stringify(sports));
    } catch (e) {}
  }, [sports]);

  useEffect(() => {
    try {
      localStorage.setItem('zim_school_allocations', JSON.stringify(allocations));
    } catch (e) {}
  }, [allocations]);

  // Current Active Term
  const currentTerm = useMemo(() => {
    return terms.find((t) => t.isCurrent) || terms[0];
  }, [terms]);

  // Real-time Conflict Detector
  const conflicts = useMemo(() => {
    return detectTimetableConflicts(allocations, subjects, teachers, streams, rooms, periods);
  }, [allocations, subjects, teachers, streams, rooms, periods]);

  // Handlers for Allocations
  const handleUpdateAllocation = (newAlloc: LessonAllocation) => {
    setAllocations((prev) => {
      const filtered = prev.filter(
        (a) =>
          !(
            a.streamId === newAlloc.streamId &&
            a.day === newAlloc.day &&
            a.periodNumber === newAlloc.periodNumber
          )
      );
      return [...filtered, newAlloc];
    });
  };

  const handleDeleteAllocation = (id: string) => {
    setAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  // Reset Everything to Default Zimbabwe Preset
  const handleResetAllDefaults = () => {
    setConfig(INITIAL_SCHOOL_CONFIG);
    setTerms(INITIAL_TERMS);
    setHolidays(ZIMBABWE_PUBLIC_HOLIDAYS_2026);
    setSubjects(INITIAL_SUBJECTS);
    setTeachers(INITIAL_TEACHERS);
    setStreams(INITIAL_STREAMS);
    setRooms(INITIAL_ROOMS);
    setPeriods(INITIAL_PERIOD_SLOTS);
    setSports(INITIAL_SPORTS_ACTIVITIES);
    setAllocations(generateSampleAllocations());
    localStorage.clear();
  };

  // AI Auto-resolve Clashes
  const handleAutoResolveClashes = () => {
    const result = autoGenerateTimetable({
      streams,
      subjects,
      teachers,
      rooms,
      periods,
    });
    setAllocations(result.allocations);
    setIsConflictModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        currentTerm={currentTerm}
        conflicts={conflicts}
        periods={periods}
        onOpenConflicts={() => setIsConflictModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'class' && (
          <ClassTimetableView
            streams={streams}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            periods={periods}
            allocations={allocations}
            currentTerm={currentTerm}
            holidays={holidays}
            schoolName={config.schoolName}
            onUpdateAllocation={handleUpdateAllocation}
            onDeleteAllocation={handleDeleteAllocation}
            onApplyNewAllocations={(newAllocs) => setAllocations(newAllocs)}
            onSwitchToPrint={() => setActiveTab('print')}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherTimetableView
            teachers={teachers}
            subjects={subjects}
            streams={streams}
            rooms={rooms}
            periods={periods}
            allocations={allocations}
            currentTerm={currentTerm}
            holidays={holidays}
            schoolName={config.schoolName}
            onUpdateTeacher={(updated) =>
              setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            }
            onApplyNewAllocations={(newAllocs) => setAllocations(newAllocs)}
            onSwitchToPrint={() => setActiveTab('print')}
          />
        )}

        {activeTab === 'sports' && (
          <SportsScheduleView
            sports={sports}
            teachers={teachers}
            currentTerm={currentTerm}
            holidays={holidays}
            schoolName={config.schoolName}
            onAddSport={(newSport) => setSports((prev) => [...prev, newSport])}
            onUpdateSport={(updated) =>
              setSports((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
            }
            onDeleteSport={(sportId) =>
              setSports((prev) => prev.filter((s) => s.id !== sportId))
            }
          />
        )}

        {activeTab === 'calendar' && (
          <SchoolCalendarView
            terms={terms}
            holidays={holidays}
            config={config}
            onUpdateTerm={(updated) =>
              setTerms((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            }
            onAddHoliday={(newHoliday) => setHolidays((prev) => [...prev, newHoliday])}
            onDeleteHoliday={(holId) =>
              setHolidays((prev) => prev.filter((h) => h.id !== holId))
            }
          />
        )}

        {activeTab === 'print' && (
          <PrintTimetableView
            config={config}
            currentTerm={currentTerm}
            streams={streams}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            periods={periods}
            allocations={allocations}
            sports={sports}
          />
        )}

        {activeTab === 'admin' && (
          <AdminHubView
            config={config}
            subjects={subjects}
            teachers={teachers}
            streams={streams}
            rooms={rooms}
            periods={periods}
            allocations={allocations}
            onUpdateConfig={setConfig}
            onUpdateSubjects={setSubjects}
            onUpdateTeachers={setTeachers}
            onUpdateStreams={setStreams}
            onUpdateRooms={setRooms}
            onApplyNewAllocations={(newAllocs) => setAllocations(newAllocs)}
            onResetAllPresetData={handleResetAllDefaults}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-xs text-slate-400 text-center print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>🇿🇼</span>
            <span>
              <strong>{config.schoolName}</strong> — Ministry of Primary and Secondary Education (MoPSE) Timetable & Calendar Scheduler
            </span>
          </div>
          <div className="text-slate-500">
            Supports Forms 1, 2, 3, 4 (O-Level) & Lower/Upper 6 (A-Level) • ZIMSEC & Cambridge
          </div>
        </div>
      </footer>

      {/* Conflict Inspector Modal */}
      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={conflicts}
        onAutoResolve={handleAutoResolveClashes}
      />
    </div>
  );
}

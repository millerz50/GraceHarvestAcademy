'use client';

import React, { useState, useMemo } from 'react';
import {
  Settings,
  Sparkles,
  BookOpen,
  Users,
  Building,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Sun,
  Sunset,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Subject,
  Teacher,
  ClassStream,
  Room,
  PeriodSlot,
  LessonAllocation,
  SchoolConfig,
  Department,
  ZimbabweForm,
  RoomType
} from '../types/timetable';
import {
  autoGenerateTimetable,
  calculateTeacherPreferenceStats,
  PreferenceStats
} from '../utils/timetableGenerator';
import { TeacherPreferencesModal } from './TeacherPreferencesModal';

interface AdminHubViewProps {
  config: SchoolConfig;
  subjects: Subject[];
  teachers: Teacher[];
  streams: ClassStream[];
  rooms: Room[];
  periods: PeriodSlot[];
  allocations: LessonAllocation[];
  onUpdateConfig: (config: SchoolConfig) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateStreams: (streams: ClassStream[]) => void;
  onUpdateRooms: (rooms: Room[]) => void;
  onApplyNewAllocations: (allocations: LessonAllocation[]) => void;
  onResetAllPresetData: () => void;
}

const DEPARTMENTS: Department[] = [
  'Sciences',
  'Commercials',
  'Humanities & Social Sciences',
  'Languages',
  'Technical & Vocational',
  'Physical Education & Arts',
];

const FORMS: ZimbabweForm[] = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6'];

const PROVINCES = [
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
] as const;

export const AdminHubView: React.FC<AdminHubViewProps> = ({
  config,
  subjects,
  teachers,
  streams,
  rooms,
  periods,
  allocations,
  onUpdateConfig,
  onUpdateSubjects,
  onUpdateTeachers,
  onUpdateStreams,
  onUpdateRooms,
  onApplyNewAllocations,
  onResetAllPresetData,
}) => {
  const [adminTab, setAdminTab] = useState<'ai' | 'subjects' | 'teachers' | 'streams' | 'rooms' | 'school'>('ai');
  const [generatorLogs, setGeneratorLogs] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Teacher Preferences Modal
  const [preferencesModalTeacher, setPreferencesModalTeacher] = useState<Teacher | null>(null);

  // Subject Form State
  const [editingSubj, setEditingSubj] = useState<Subject | null>(null);
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjDept, setSubjDept] = useState<Department>('Sciences');
  const [subjForms, setSubjForms] = useState<ZimbabweForm[]>(['Form 1', 'Form 2', 'Form 3', 'Form 4']);
  const [subjPeriods, setSubjPeriods] = useState(5);
  const [subjReqLab, setSubjReqLab] = useState(false);
  const [subjLabType, setSubjLabType] = useState<RoomType>('science_lab');
  const [subjColor, setSubjColor] = useState('#0284c7');

  // Teacher Form State
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [tTitle, setTTitle] = useState<'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.' | 'Rev.'>('Mr.');
  const [tName, setTName] = useState('');
  const [tCode, setTCode] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tSubjIds, setTSubjIds] = useState<string[]>([]);
  const [tPrimarySubjId, setTPrimarySubjId] = useState<string>('');
  const [tMaxLoad, setTMaxLoad] = useState(26);
  const [tNotes, setTNotes] = useState('');

  // Class Stream Form State
  const [editingStream, setEditingStream] = useState<ClassStream | null>(null);
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [streamForm, setStreamForm] = useState<ZimbabweForm>('Form 1');
  const [streamName, setStreamName] = useState('');
  const [streamCount, setStreamCount] = useState(40);
  const [streamTeacherId, setStreamTeacherId] = useState('');
  const [streamRoomId, setStreamRoomId] = useState('');

  // Room Form State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('classroom');
  const [roomCap, setRoomCap] = useState(40);
  const [roomBldg, setRoomBldg] = useState('');

  const subjectMap = useMemo(() => new Map<string, Subject>(subjects.map((s) => [s.id, s])), [subjects]);

  // Current Teacher Preference Stats
  const currentPreferenceStats = useMemo(() => {
    return calculateTeacherPreferenceStats(allocations, teachers, rooms);
  }, [allocations, teachers, rooms]);

  // 1-Click AI Automated Timetable Generation
  const handleRunAIGenerator = (optimizeForPreferences = true) => {
    setIsGenerating(true);
    setGeneratorLogs(['🚀 Initializing Grace Harvest Academy Constraint Solver & Preference Engine...']);

    setTimeout(() => {
      const result = autoGenerateTimetable({
        streams,
        subjects,
        teachers,
        rooms,
        periods,
        optimizeForPreferences,
      });

      setGeneratorLogs(result.logs);
      onApplyNewAllocations(result.allocations);
      setIsGenerating(false);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      setAdminNotice(
        `Generated ${result.allocations.length} lessons with ${result.stats.satisfactionPercentage}% Teacher Preference Satisfaction!`
      );
      setTimeout(() => setAdminNotice(null), 4000);
    }, 600);
  };

  // --- Subject Handlers ---
  const openAddSubject = () => {
    setEditingSubj(null);
    setSubjName('');
    setSubjCode('');
    setSubjDept('Sciences');
    setSubjForms(['Form 1', 'Form 2', 'Form 3', 'Form 4']);
    setSubjPeriods(5);
    setSubjReqLab(false);
    setSubjLabType('science_lab');
    setSubjColor('#0284c7');
    setIsSubjModalOpen(true);
  };

  const openEditSubject = (subj: Subject) => {
    setEditingSubj(subj);
    setSubjName(subj.name);
    setSubjCode(subj.code);
    setSubjDept(subj.department);
    setSubjForms(subj.allowedForms);
    setSubjPeriods(subj.recommendedPeriodsPerWeek);
    setSubjReqLab(subj.requiresLab);
    setSubjLabType(subj.labType || 'science_lab');
    setSubjColor(subj.color);
    setIsSubjModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim() || !subjCode.trim()) return;

    const newSubj: Subject = {
      id: editingSubj ? editingSubj.id : `subj-${Date.now()}`,
      name: subjName.trim(),
      code: subjCode.trim(),
      department: subjDept,
      allowedForms: subjForms,
      recommendedPeriodsPerWeek: Number(subjPeriods),
      requiresLab: subjReqLab,
      labType: subjReqLab ? subjLabType : undefined,
      color: subjColor,
    };

    if (editingSubj) {
      onUpdateSubjects(subjects.map((s) => (s.id === newSubj.id ? newSubj : s)));
    } else {
      onUpdateSubjects([...subjects, newSubj]);
    }

    setIsSubjModalOpen(false);
    setAdminNotice(`Saved subject: ${newSubj.name}`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleDeleteSubject = (id: string) => {
    onUpdateSubjects(subjects.filter((s) => s.id !== id));
  };

  // --- Teacher Handlers ---
  const openAddTeacher = () => {
    setEditingTeacher(null);
    setTTitle('Mr.');
    setTName('');
    setTCode('');
    setTEmail('');
    setTPhone('+263 77 ');
    setTSubjIds([subjects[0]?.id || '']);
    setTPrimarySubjId(subjects[0]?.id || '');
    setTMaxLoad(26);
    setTNotes('');
    setIsTeacherModalOpen(true);
  };

  const openEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setTTitle(t.title);
    setTName(t.name);
    setTCode(t.code);
    setTEmail(t.email);
    setTPhone(t.phone || '');
    setTSubjIds(t.subjectIds || []);
    setTPrimarySubjId(t.primarySubjectId || t.subjectIds?.[0] || '');
    setTMaxLoad(t.maxPeriodsPerWeek);
    setTNotes(t.notes || '');
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tCode.trim()) return;

    const newTeacher: Teacher = {
      id: editingTeacher ? editingTeacher.id : `teacher-${Date.now()}`,
      title: tTitle,
      name: tName.trim(),
      code: tCode.trim().toUpperCase(),
      email: tEmail.trim() || `${tCode.toLowerCase()}@graceharvest.ac.zw`,
      phone: tPhone.trim(),
      subjectIds: tSubjIds.length > 0 ? tSubjIds : [subjects[0]?.id || 'subj-math-o'],
      primarySubjectId: tPrimarySubjId || tSubjIds[0],
      maxPeriodsPerWeek: tMaxLoad,
      preferences: editingTeacher?.preferences || {
        preferredTimeOfDay: 'morning',
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        unavailableSlots: [],
        maxConsecutivePeriods: 3,
      },
      preferredRooms: editingTeacher?.preferredRooms || [],
      notes: tNotes.trim(),
    };

    if (editingTeacher) {
      onUpdateTeachers(teachers.map((t) => (t.id === newTeacher.id ? newTeacher : t)));
    } else {
      onUpdateTeachers([...teachers, newTeacher]);
    }

    setIsTeacherModalOpen(false);
    setAdminNotice(`Saved staff member: ${newTeacher.title} ${newTeacher.name} with ${newTeacher.subjectIds.length} acquired subjects`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleDeleteTeacher = (id: string) => {
    onUpdateTeachers(teachers.filter((t) => t.id !== id));
  };

  const handleSaveTeacherPreferences = (updatedTeacher: Teacher) => {
    onUpdateTeachers(teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    setAdminNotice(`Updated qualifications & preferences for ${updatedTeacher.title} ${updatedTeacher.name}`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  // --- Stream Handlers ---
  const openAddStream = () => {
    setEditingStream(null);
    setStreamForm('Form 1');
    setStreamName('North');
    setStreamCount(40);
    setStreamTeacherId(teachers[0]?.id || '');
    setStreamRoomId(rooms[0]?.id || '');
    setIsStreamModalOpen(true);
  };

  const openEditStream = (st: ClassStream) => {
    setEditingStream(st);
    setStreamForm(st.form);
    setStreamName(st.streamName);
    setStreamCount(st.studentCount);
    setStreamTeacherId(st.classTeacherId || '');
    setStreamRoomId(st.homeRoomId || '');
    setIsStreamModalOpen(true);
  };

  const handleSaveStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamName.trim()) return;

    const displayName = `${streamForm} ${streamName.trim()}`;
    const newStream: ClassStream = {
      id: editingStream ? editingStream.id : `stream-${Date.now()}`,
      form: streamForm,
      streamName: streamName.trim(),
      displayName,
      studentCount: streamCount,
      classTeacherId: streamTeacherId || undefined,
      homeRoomId: streamRoomId || undefined,
      enrolledSubjectIds: editingStream?.enrolledSubjectIds || subjects.slice(0, 8).map((s) => s.id),
    };

    if (editingStream) {
      onUpdateStreams(streams.map((s) => (s.id === newStream.id ? newStream : s)));
    } else {
      onUpdateStreams([...streams, newStream]);
    }

    setIsStreamModalOpen(false);
    setAdminNotice(`Saved class stream: ${newStream.displayName}`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleDeleteStream = (id: string) => {
    onUpdateStreams(streams.filter((s) => s.id !== id));
  };

  // --- Room Handlers ---
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomType('classroom');
    setRoomCap(40);
    setRoomBldg('Academic Block');
    setIsRoomModalOpen(true);
  };

  const openEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomName(r.name);
    setRoomType(r.type);
    setRoomCap(r.capacity);
    setRoomBldg(r.building || '');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    const newRoom: Room = {
      id: editingRoom ? editingRoom.id : `room-${Date.now()}`,
      name: roomName.trim(),
      type: roomType,
      capacity: Number(roomCap),
      building: roomBldg.trim(),
    };

    if (editingRoom) {
      onUpdateRooms(rooms.map((r) => (r.id === newRoom.id ? newRoom : r)));
    } else {
      onUpdateRooms([...rooms, newRoom]);
    }

    setIsRoomModalOpen(false);
    setAdminNotice(`Saved venue: ${newRoom.name}`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleDeleteRoom = (id: string) => {
    onUpdateRooms(rooms.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAdminTab('ai')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              adminTab === 'ai'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generator & Preferences
          </button>

          <button
            onClick={() => setAdminTab('subjects')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              adminTab === 'subjects'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Subjects ({subjects.length})
          </button>

          <button
            onClick={() => setAdminTab('teachers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              adminTab === 'teachers'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Teachers & Staff ({teachers.length})
          </button>

          <button
            onClick={() => setAdminTab('streams')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              adminTab === 'streams'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Classes & Streams ({streams.length})
          </button>

          <button
            onClick={() => setAdminTab('rooms')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              adminTab === 'rooms'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Venues & Labs ({rooms.length})
          </button>

          <button
            onClick={() => setAdminTab('school')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              adminTab === 'school'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            School Settings
          </button>
        </div>

        {/* Reset Preset Action */}
        <button
          onClick={() => {
            if (window.confirm('Reset all timetable data to Grace Harvest Academy preset?')) {
              onResetAllPresetData();
              setAdminNotice('Reset all data to Grace Harvest Academy defaults!');
              setTimeout(() => setAdminNotice(null), 3000);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-xs transition"
          title="Restore standard sample data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {adminNotice && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{adminNotice}</span>
        </div>
      )}

      {/* --- TAB 1: AI AUTO-SCHEDULER & PREFERENCE ENGINE --- */}
      {adminTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Constraint Satisfaction & Preference Optimizer
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Grace Harvest Academy Timetable Generator
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Generates conflict-free weekly schedules for Forms 1-6 while optimizing for teacher preferred hours (morning/afternoon), avoiding blocked unavailable slots, respecting multi-subject qualifications, and allocating science labs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-run-ai-generator"
                  onClick={() => handleRunAIGenerator(true)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 transform hover:scale-[1.02]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing Timetable...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Generate & Optimize by Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Current Schedule Metrics & Preference Satisfaction Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">Teacher Satisfaction:</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <strong className="text-xl text-emerald-400 font-bold font-mono">
                    {currentPreferenceStats.satisfactionPercentage}%
                  </strong>
                  <span className="text-[10px] text-slate-400">Match</span>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">Unavailable Protected:</span>
                <strong className="text-lg text-amber-400 font-mono mt-0.5 block">
                  {currentPreferenceStats.unavailableConflictsAvoided} Slots
                </strong>
              </div>

              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">Time-of-Day Matches:</span>
                <strong className="text-lg text-cyan-400 font-mono mt-0.5 block">
                  {currentPreferenceStats.timeOfDayMatches} Lessons
                </strong>
              </div>

              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">Total Scheduled:</span>
                <strong className="text-lg text-white font-mono mt-0.5 block">
                  {allocations.length} Lessons
                </strong>
              </div>

              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">Teaching Staff:</span>
                <strong className="text-lg text-white font-mono mt-0.5 block">
                  {teachers.length} Teachers
                </strong>
              </div>
            </div>

            {/* Teacher Preference Satisfaction Breakdown */}
            <div className="mt-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Staff Preference Fulfillment Breakdown
                </h4>
                <span className="text-[11px] text-slate-400">
                  Calculated against morning/afternoon, day, and unavailable slot constraints
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentPreferenceStats.teacherBreakdown.map((tb) => {
                  const tObj = teachers.find((t) => t.id === tb.teacherId);
                  return (
                    <div
                      key={tb.teacherId}
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white truncate">{tb.teacherName}</div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            tb.score >= 90
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : tb.score >= 70
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {tb.score}%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        {tb.fulfilledNotes.slice(0, 2).map((fn, idx) => (
                          <div key={idx} className="truncate text-emerald-400/90">
                            ✓ {fn}
                          </div>
                        ))}
                        {tb.unfulfilledNotes.map((un, idx) => (
                          <div key={idx} className="truncate text-rose-400/90">
                            ⚠️ {un}
                          </div>
                        ))}
                      </div>

                      {tObj && (
                        <button
                          type="button"
                          onClick={() => setPreferencesModalTeacher(tObj)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline pt-1 block"
                        >
                          Edit Preferences →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generator Execution Console */}
            {generatorLogs.length > 0 && (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider pb-1 border-b border-slate-800">
                  Generator Execution Log:
                </div>
                {generatorLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: SUBJECTS MANAGEMENT --- */}
      {adminTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">ZIMSEC & Cambridge Curriculum Subjects</h3>
            <button
              onClick={openAddSubject}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: `${subj.color}20`,
                          color: subj.color,
                          borderColor: `${subj.color}40`,
                        }}
                      >
                        {subj.department}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{subj.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditSubject(subj)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subj.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    Code: <strong className="text-amber-300">{subj.code}</strong>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Periods/Week: <strong>{subj.recommendedPeriodsPerWeek}</strong></div>
                    <div>Forms: <strong>{subj.allowedForms.join(', ')}</strong></div>
                    {subj.requiresLab && (
                      <div className="text-emerald-400 text-[11px] font-semibold">
                        🔬 Requires Lab: {subj.labType}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: TEACHERS MANAGEMENT --- */}
      {adminTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Academic Teaching Staff</h3>
              <p className="text-xs text-slate-400">
                Acquire multiple subjects per teacher and configure individual schedule preferences
              </p>
            </div>
            <button
              onClick={openAddTeacher}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((t) => {
              const assignedCount = allocations.filter((a) => a.teacherId === t.id).length;
              const pref = t.preferences;
              const unavailCount = pref?.unavailableSlots?.length || 0;

              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                          {t.code}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {t.title} {t.name}
                          </h4>
                          <span className="text-xs text-slate-400">{t.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditTeacher(t)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Acquired Multiple Subjects */}
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Acquired Subjects ({t.subjectIds?.length || 0}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.subjectIds?.map((sId) => {
                          const s = subjectMap.get(sId);
                          if (!s) return null;
                          const isPrimary = t.primarySubjectId === sId;
                          return (
                            <span
                              key={sId}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                isPrimary
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {s.name} {isPrimary && '★'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preference Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      {pref?.preferredTimeOfDay === 'morning' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <Sun className="w-3 h-3" /> Morning
                        </span>
                      )}
                      {pref?.preferredTimeOfDay === 'afternoon' && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                          <Sunset className="w-3 h-3" /> Afternoon
                        </span>
                      )}
                      {unavailCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                          🚫 {unavailCount} Blocked Slot{unavailCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Max {assignedCount}/{t.maxPeriodsPerWeek} p/wk
                      </span>
                    </div>
                  </div>

                  {/* Action Button: Edit Qualifications & Preferences */}
                  <button
                    type="button"
                    onClick={() => setPreferencesModalTeacher(t)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Subjects & Preferences</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 4: CLASSES & STREAMS --- */}
      {adminTab === 'streams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Class Streams (Forms 1 - 6)</h3>
            <button
              onClick={openAddStream}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Stream</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {streams.map((s) => {
              const streamAllocs = allocations.filter((a) => a.streamId === s.id).length;
              return (
                <div
                  key={s.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {s.form}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{s.displayName}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditStream(s)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStream(s.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Enrolled Students: <strong>{s.studentCount}</strong></div>
                    <div>Scheduled Lessons: <strong>{streamAllocs} periods/wk</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 5: VENUES & LABS --- */}
      {adminTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">School Venues, Grounds & Laboratories</h3>
            <button
              onClick={openAddRoom}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                      {r.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{r.name}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditRoom(r)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(r.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>Capacity: <strong>{r.capacity} seats</strong></div>
                  <div>Building: <strong>{r.building || 'Main Campus'}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: SCHOOL CONFIGURATION --- */}
      {adminTab === 'school' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 max-w-2xl">
          <h3 className="text-base font-bold text-white">Grace Harvest Academy Profile</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={config.schoolName}
                onChange={(e) => onUpdateConfig({ ...config, schoolName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                School Motto
              </label>
              <input
                type="text"
                value={config.motto}
                onChange={(e) => onUpdateConfig({ ...config, motto: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white italic"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Province
                </label>
                <select
                  value={config.province}
                  onChange={(e) => onUpdateConfig({ ...config, province: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={config.district}
                  onChange={(e) => onUpdateConfig({ ...config, district: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Principal / Headmaster
                </label>
                <input
                  type="text"
                  value={config.headmasterName}
                  onChange={(e) => onUpdateConfig({ ...config, headmasterName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Curriculum Track
                </label>
                <select
                  value={config.curriculum}
                  onChange={(e) => onUpdateConfig({ ...config, curriculum: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                >
                  <option value="ZIMSEC / Cambridge Dual">ZIMSEC / Cambridge Dual</option>
                  <option value="ZIMSEC National">ZIMSEC National</option>
                  <option value="Cambridge International">Cambridge International</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingSubj ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Combined Science"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Syllabus Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5006 or 4008"
                    value={subjCode}
                    onChange={(e) => setSubjCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={subjDept}
                    onChange={(e) => setSubjDept(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingTeacher ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title
                  </label>
                  <select
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-sm text-white"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Rev.">Rev.</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Takunda Moyo"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TMY"
                    value={tCode}
                    onChange={(e) => setTCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="t.moyo@graceharvest.ac.zw"
                    value={tEmail}
                    onChange={(e) => setTEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Periods/Week
                  </label>
                  <input
                    type="number"
                    value={tMaxLoad}
                    onChange={(e) => setTMaxLoad(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {/* Multi-Subject Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Multiple Subjects Taught ({tSubjIds.length} Selected)
                </label>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5">
                  {subjects.map((s) => {
                    const isChecked = tSubjIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          if (isChecked) {
                            setTSubjIds(tSubjIds.filter((id) => id !== s.id));
                          } else {
                            setTSubjIds([...tSubjIds, s.id]);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between border transition ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-500/50 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department / Responsibility Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Head of Science Department, Rugby Head Coach"
                  value={tNotes}
                  onChange={(e) => setTNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stream Modal */}
      {isStreamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingStream ? 'Edit Class Stream' : 'Add Class Stream'}
            </h3>
            <form onSubmit={handleSaveStream} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Form Level
                  </label>
                  <select
                    value={streamForm}
                    onChange={(e) => setStreamForm(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    {FORMS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stream Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. East, West, Sciences"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enrolled Students Count
                </label>
                <input
                  type="number"
                  value={streamCount}
                  onChange={(e) => setStreamCount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStreamModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Class Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingRoom ? 'Edit Facility' : 'Add Facility'}
            </h3>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Lab 1"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Facility Type
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="science_lab">Science Lab</option>
                    <option value="computer_lab">Computer Lab</option>
                    <option value="workshop">Workshop</option>
                    <option value="sports_ground">Sports Ground</option>
                    <option value="hall">Great Hall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={roomCap}
                    onChange={(e) => setRoomCap(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Qualifications & Preferences Full Modal */}
      {preferencesModalTeacher && (
        <TeacherPreferencesModal
          isOpen={Boolean(preferencesModalTeacher)}
          onClose={() => setPreferencesModalTeacher(null)}
          teacher={preferencesModalTeacher}
          subjects={subjects}
          rooms={rooms}
          periods={periods}
          onSave={handleSaveTeacherPreferences}
        />
      )}
    </div>
  );
};

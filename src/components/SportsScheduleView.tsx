'use client';

import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Filter,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SportActivity,
  Teacher,
  ZimbabweForm,
  DayOfWeek,
  SchoolTerm,
  PublicHoliday
} from '../types/timetable';
import { generateTimetableICS, downloadICSFile } from '../utils/calendarSync';

interface SportsScheduleViewProps {
  sports: SportActivity[];
  teachers: Teacher[];
  currentTerm: SchoolTerm;
  holidays: PublicHoliday[];
  schoolName: string;
  onAddSport: (sport: SportActivity) => void;
  onUpdateSport: (sport: SportActivity) => void;
  onDeleteSport: (sportId: string) => void;
}

const CATEGORIES = ['All', 'Major Sport', 'Club & Society', 'Cultural & Arts'] as const;
const FORMS: ZimbabweForm[] = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6'];
const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const SportsScheduleView: React.FC<SportsScheduleViewProps> = ({
  sports,
  teachers,
  currentTerm,
  holidays,
  schoolName,
  onAddSport,
  onUpdateSport,
  onDeleteSport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedForm, setSelectedForm] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportActivity | null>(null);

  // Form states for new/edit sport
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Major Sport' | 'Minor Sport' | 'Club & Society' | 'Cultural & Arts'>('Major Sport');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['Tuesday', 'Thursday']);
  const [startTime, setStartTime] = useState('15:30');
  const [endTime, setEndTime] = useState('17:00');
  const [venue, setVenue] = useState('Main Sports Grounds');
  const [coachTeacherId, setCoachTeacherId] = useState(teachers[0]?.id || '');
  const [targetForms, setTargetForms] = useState<ZimbabweForm[]>(['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']);
  const [gender, setGender] = useState<'Boys' | 'Girls' | 'Co-ed' | 'All'>('All');
  const [description, setDescription] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));

  // Filtered sports
  const filteredSports = sports.filter((sport) => {
    if (selectedCategory !== 'All' && sport.category !== selectedCategory) return false;
    if (selectedGender !== 'All' && sport.gender !== selectedGender && sport.gender !== 'All') return false;
    if (selectedForm !== 'All' && !sport.targetForms.includes(selectedForm as ZimbabweForm)) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingSport(null);
    setName('');
    setCategory('Major Sport');
    setSelectedDays(['Tuesday', 'Thursday']);
    setStartTime('15:30');
    setEndTime('17:00');
    setVenue('Main Pavilion Grounds');
    setCoachTeacherId(teachers[0]?.id || '');
    setTargetForms(['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']);
    setGender('All');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (sport: SportActivity) => {
    setEditingSport(sport);
    setName(sport.name);
    setCategory(sport.category);
    setSelectedDays(sport.days);
    setStartTime(sport.startTime);
    setEndTime(sport.endTime);
    setVenue(sport.venue);
    setCoachTeacherId(sport.coachTeacherId);
    setTargetForms(sport.targetForms);
    setGender(sport.gender);
    setDescription(sport.description || '');
    setIsModalOpen(true);
  };

  const handleSaveSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sportData: SportActivity = {
      id: editingSport ? editingSport.id : `sport-${Date.now()}`,
      name: name.trim(),
      category,
      days: selectedDays,
      startTime,
      endTime,
      venue,
      coachTeacherId,
      targetForms,
      gender,
      description: description.trim(),
    };

    if (editingSport) {
      onUpdateSport(sportData);
      setNotification(`Updated ${sportData.name}!`);
    } else {
      onAddSport(sportData);
      setNotification(`Added new activity: ${sportData.name}!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotification(null), 3500);
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleForm = (form: ZimbabweForm) => {
    setTargetForms((prev) =>
      prev.includes(form) ? prev.filter((f) => f !== form) : [...prev, form]
    );
  };

  const handleExportSportsICS = () => {
    const icsContent = generateTimetableICS({
      schoolName,
      term: currentTerm,
      holidays,
      allocations: [],
      subjects: [],
      teachers,
      streams: [],
      rooms: [],
      periods: [],
      sports: filteredSports,
      filterTitle: 'Sports & Co-Curricular Schedule',
    });

    downloadICSFile(`Sports_and_Clubs_Schedule_${currentTerm.termName.replace(/\s+/g, '_')}_2026.ics`, icsContent);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    setNotification('Exported sports & clubs calendar (.ics) file!');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Zimbabwe Sports & Co-Curricular Department
            </h2>
            <p className="text-xs text-slate-400">
              Administer after-school athletics, sports leagues, clubs, cultural societies & coaches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-sync-sports-cal"
              onClick={handleExportSportsICS}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Sync Sports to Calendar (.ics)</span>
            </button>

            <button
              id="btn-add-sport-activity"
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Activity</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Form Filter */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            <span className="text-xs font-semibold text-slate-400">Form:</span>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="All">All Forms</option>
              {FORMS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Sports Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSports.map((sport) => {
          const coach = teacherMap.get(sport.coachTeacherId);

          return (
            <div
              key={sport.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        sport.category === 'Major Sport'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : sport.category === 'Cultural & Arts'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {sport.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{sport.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sport)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit Activity"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSport(sport.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                      title="Delete Activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{sport.description}</p>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Days: <strong>{sport.days.join(', ')}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Time: <strong>{sport.startTime} - {sport.endTime}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Venue: <strong>{sport.venue}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Coach / Patron: <strong>{coach ? `${coach.title} ${coach.name}` : 'TBA'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Footer Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                <div className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3 h-3 text-slate-500" />
                  <span>{sport.targetForms.join(', ')}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {sport.gender}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Sport Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                {editingSport ? 'Edit Sport / Co-Curricular' : 'Add New Sport / Activity'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSport} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Warriors Soccer, Sables Rugby..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    <option value="Major Sport">Major Sport</option>
                    <option value="Minor Sport">Minor Sport</option>
                    <option value="Club & Society">Club & Society</option>
                    <option value="Cultural & Arts">Cultural & Arts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gender Group
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    <option value="All">All Students</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Co-ed">Co-ed Squad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Scheduled Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedDays.includes(d)
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Venue / Grounds
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Main Rugby Pitch, Netball Court 1, Beit Hall"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Coach / Teacher Patron
                </label>
                <select
                  value={coachTeacherId}
                  onChange={(e) => setCoachTeacherId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Eligible Forms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FORMS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleForm(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        targetForms.includes(f)
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / League Info
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Interschool training squad, CHISZ tournament preparation..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

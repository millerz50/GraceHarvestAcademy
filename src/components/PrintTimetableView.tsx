'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  Calendar,
  FileText,
  Users,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ClassStream,
  Subject,
  Teacher,
  Room,
  PeriodSlot,
  LessonAllocation,
  SchoolConfig,
  SchoolTerm,
  SportActivity,
  DayOfWeek
} from '../types/timetable';

interface PrintTimetableViewProps {
  config: SchoolConfig;
  currentTerm: SchoolTerm;
  streams: ClassStream[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  periods: PeriodSlot[];
  allocations: LessonAllocation[];
  sports: SportActivity[];
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const PrintTimetableView: React.FC<PrintTimetableViewProps> = ({
  config,
  currentTerm,
  streams,
  subjects,
  teachers,
  rooms,
  periods,
  allocations,
  sports,
}) => {
  const [printType, setPrintType] = useState<'class' | 'teacher' | 'master' | 'sports'>('class');
  const [selectedStreamId, setSelectedStreamId] = useState<string>(streams[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const streamMap = new Map<string, ClassStream>(streams.map((s) => [s.id, s]));
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));

  const activeStream = streams.find((s) => s.id === selectedStreamId) || streams[0];
  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const handlePrint = () => {
    window.print();
  };

  const activeClassTeacher = activeStream?.classTeacherId
    ? teacherMap.get(activeStream.classTeacherId)
    : undefined;
  const activeHomeRoom = activeStream?.homeRoomId
    ? roomMap.get(activeStream.homeRoomId)
    : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Control Panel (Hidden during actual print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              Official Zimbabwe MoPSE Print & PDF Export Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates formal, high-resolution printable timetables for classroom noticeboards, staff rooms, student diaries, and ministry inspection.
            </p>
          </div>

          <button
            id="btn-trigger-print"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition transform hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF (A4 Landscape)</span>
          </button>
        </div>

        {/* Print Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Timetable Document Type:
            </label>
            <select
              id="select-print-type"
              value={printType}
              onChange={(e) => setPrintType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-amber-400"
            >
              <option value="class">Class / Form Timetable</option>
              <option value="teacher">Individual Teacher Master Schedule</option>
              <option value="master">Whole School Master Matrix</option>
              <option value="sports">Sports & Co-Curricular Schedule</option>
            </select>
          </div>

          {printType === 'class' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Class Stream:
              </label>
              <select
                id="select-print-stream"
                value={selectedStreamId}
                onChange={(e) => setSelectedStreamId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-amber-400"
              >
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({s.form})
                  </option>
                ))}
              </select>
            </div>
          )}

          {printType === 'teacher' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Staff Member:
              </label>
              <select
                id="select-print-teacher"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-amber-400"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:ml-auto flex items-end">
            <div className="text-[11px] text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
              🖨️ For best results in print preview: Select <strong>Landscape</strong> orientation.
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Canvas (Styled with authentic Zimbabwe Ministry Header) */}
      <div
        id="printable-timetable-sheet"
        className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-2 print:m-0 print:rounded-none max-w-full overflow-x-auto"
      >
        {/* Ministry & School Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-left text-[11px] text-slate-700 font-semibold font-mono">
              <div>REP. OF ZIMBABWE</div>
              <div>MoPSE • {config.province} PROVINCE</div>
              <div>DISTRICT: {config.district}</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
                {config.schoolName}
              </div>
              <div className="text-xs font-semibold italic text-slate-700 font-serif">
                "{config.motto}"
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-700 font-mono">
              <div>ACADEMIC YEAR: {config.academicYear}</div>
              <div>{currentTerm.termName.toUpperCase()}</div>
              <div>CURRICULUM: {config.curriculum}</div>
            </div>
          </div>

          <div className="pt-2 text-sm font-bold uppercase tracking-widest text-slate-900 bg-slate-100 py-1 rounded border border-slate-300">
            {printType === 'class' && `OFFICIAL CLASS TIMETABLE — ${activeStream?.displayName || ''}`}
            {printType === 'teacher' && `STAFF TEACHING TIMETABLE — ${activeTeacher?.title} ${activeTeacher?.name} (${activeTeacher?.code})`}
            {printType === 'master' && 'WHOLE SCHOOL MASTER TIMETABLE MATRIX'}
            {printType === 'sports' && 'SPORTS, CLUBS & CO-CURRICULAR OFFICIAL SCHEDULE'}
          </div>

          {printType === 'class' && activeStream && (
            <div className="flex items-center justify-between text-xs text-slate-800 pt-1 px-1 font-semibold">
              <div>
                CLASS TEACHER: {activeClassTeacher ? `${activeClassTeacher.title} ${activeClassTeacher.name}` : 'TBA'}
              </div>
              <div>ROOM: {activeHomeRoom?.name || 'Classroom'}</div>
              <div>STUDENTS ON ROLL: {activeStream.studentCount}</div>
            </div>
          )}
        </div>

        {/* Timetable Matrix for Class */}
        {printType === 'class' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-900">
                  <th className="border border-slate-900 p-2 font-bold text-center w-24">DAY</th>
                  {periods.map((p) => (
                    <th key={p.id} className="border border-slate-900 p-1.5 text-center font-bold">
                      <div className="text-[11px]">{p.name}</div>
                      <div className="text-[9px] font-mono text-slate-600 font-normal">
                        {p.startTime} - {p.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 text-center align-middle">
                      {day}
                    </td>

                    {periods.map((slot) => {
                      if (slot.type === 'assembly') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Assembly / Devotion
                          </td>
                        );
                      }
                      if (slot.type === 'break') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Tea Break
                          </td>
                        );
                      }
                      if (slot.type === 'lunch') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Lunch Break
                          </td>
                        );
                      }
                      if (slot.type === 'sports') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Sports / Clubs
                          </td>
                        );
                      }

                      const alloc = allocations.find(
                        (a) =>
                          a.streamId === activeStream?.id &&
                          a.day === day &&
                          a.periodNumber === slot.periodNumber
                      );
                      const subj = alloc ? subjectMap.get(alloc.subjectId) : undefined;
                      const teacher = alloc ? teacherMap.get(alloc.teacherId) : undefined;
                      const room = alloc ? roomMap.get(alloc.roomId) : undefined;

                      return (
                        <td
                          key={slot.id}
                          className="border border-slate-900 p-1.5 text-center align-middle min-h-[50px]"
                        >
                          {alloc && subj ? (
                            <div>
                              <div className="font-bold text-[11px] text-slate-950">
                                {subj.name}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                                {teacher ? `${teacher.title} ${teacher.code}` : ''}{' '}
                                {room ? `• ${room.name.split(' ')[0]}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Timetable Matrix for Teacher */}
        {printType === 'teacher' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-900">
                  <th className="border border-slate-900 p-2 font-bold text-center w-24">DAY</th>
                  {periods.map((p) => (
                    <th key={p.id} className="border border-slate-900 p-1.5 text-center font-bold">
                      <div className="text-[11px]">{p.name}</div>
                      <div className="text-[9px] font-mono text-slate-600 font-normal">
                        {p.startTime} - {p.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 text-center align-middle">
                      {day}
                    </td>

                    {periods.map((slot) => {
                      if (slot.type === 'assembly') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Assembly / Duty
                          </td>
                        );
                      }
                      if (slot.type === 'break') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Tea Break
                          </td>
                        );
                      }
                      if (slot.type === 'lunch') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Staff Lunch
                          </td>
                        );
                      }
                      if (slot.type === 'sports') {
                        return (
                          <td key={slot.id} className="border border-slate-900 p-1 text-center bg-slate-100 font-semibold text-[10px] text-slate-700 align-middle">
                            Sports Coaching
                          </td>
                        );
                      }

                      const alloc = allocations.find(
                        (a) =>
                          a.teacherId === activeTeacher?.id &&
                          a.day === day &&
                          a.periodNumber === slot.periodNumber
                      );
                      const subj = alloc ? subjectMap.get(alloc.subjectId) : undefined;
                      const stream = alloc ? streamMap.get(alloc.streamId) : undefined;
                      const room = alloc ? roomMap.get(alloc.roomId) : undefined;

                      return (
                        <td
                          key={slot.id}
                          className="border border-slate-900 p-1.5 text-center align-middle"
                        >
                          {alloc && subj && stream ? (
                            <div>
                              <div className="font-bold text-[11px] text-slate-950">
                                {stream.displayName}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-700">
                                {subj.name} • {room?.name.split(' ')[0] || ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              FREE / PREP
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Master Matrix */}
        {printType === 'master' && (
          <div className="mt-4 space-y-6">
            {DAYS.map((day) => (
              <div key={day} className="space-y-1">
                <h4 className="font-bold text-xs bg-slate-200 px-2 py-1 border border-slate-900">
                  {day.toUpperCase()} MASTER SCHEDULE
                </h4>
                <table className="w-full border-collapse border border-slate-900 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900">
                      <th className="border border-slate-900 p-1 font-bold w-28">CLASS</th>
                      {periods.filter((p) => p.type === 'lesson').map((p) => (
                        <th key={p.id} className="border border-slate-900 p-1 font-bold">
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {streams.map((stream) => (
                      <tr key={stream.id} className="border-b border-slate-900">
                        <td className="border border-slate-900 p-1 font-bold bg-slate-50">
                          {stream.displayName}
                        </td>
                        {periods.filter((p) => p.type === 'lesson').map((slot) => {
                          const alloc = allocations.find(
                            (a) =>
                              a.streamId === stream.id &&
                              a.day === day &&
                              a.periodNumber === slot.periodNumber
                          );
                          const subj = alloc ? subjectMap.get(alloc.subjectId) : undefined;
                          const teacher = alloc ? teacherMap.get(alloc.teacherId) : undefined;

                          return (
                            <td key={slot.id} className="border border-slate-900 p-1 text-center">
                              {alloc && subj ? (
                                <span>
                                  <strong>{subj.code.split(' ')[0]}</strong> ({teacher?.code || ''})
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Sports Schedule Print */}
        {printType === 'sports' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-900">
                  <th className="border border-slate-900 p-2 font-bold text-left">SPORT / CLUB</th>
                  <th className="border border-slate-900 p-2 font-bold text-left">CATEGORY</th>
                  <th className="border border-slate-900 p-2 font-bold text-left">DAYS</th>
                  <th className="border border-slate-900 p-2 font-bold text-left">TIME</th>
                  <th className="border border-slate-900 p-2 font-bold text-left">VENUE / GROUND</th>
                  <th className="border border-slate-900 p-2 font-bold text-left">COACH / PATRON</th>
                  <th className="border border-slate-900 p-2 font-bold text-left">FORMS</th>
                </tr>
              </thead>
              <tbody>
                {sports.map((sport) => {
                  const coach = teacherMap.get(sport.coachTeacherId);
                  return (
                    <tr key={sport.id} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 font-bold">{sport.name}</td>
                      <td className="border border-slate-900 p-2">{sport.category}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{sport.days.join(', ')}</td>
                      <td className="border border-slate-900 p-2 font-mono">{sport.startTime} - {sport.endTime}</td>
                      <td className="border border-slate-900 p-2">{sport.venue}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{coach ? `${coach.title} ${coach.name}` : 'TBA'}</td>
                      <td className="border border-slate-900 p-2">{sport.targetForms.join(', ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signature and Date Stamp Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-xs text-slate-900">
          <div className="space-y-6">
            <p className="font-semibold">CLASS TEACHER'S SIGNATURE:</p>
            <div className="border-b border-slate-900 w-48" />
            <p className="text-[10px] text-slate-600">Date: .......................................</p>
          </div>

          <div className="space-y-6 text-center">
            <p className="font-semibold">DEPUTY HEADMASTER (ACADEMICS):</p>
            <div className="border-b border-slate-900 w-48 mx-auto" />
            <p className="text-[10px] text-slate-600">Date: .......................................</p>
          </div>

          <div className="space-y-6 text-right">
            <p className="font-semibold">HEADMASTER / OFFICIAL STAMP:</p>
            <div className="border border-dashed border-slate-400 h-16 w-36 ml-auto rounded flex items-center justify-center text-[9px] text-slate-400 font-mono">
              [ OFFICIAL SCHOOL STAMP ]
            </div>
            <p className="text-[10px] text-slate-600">{config.headmasterName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

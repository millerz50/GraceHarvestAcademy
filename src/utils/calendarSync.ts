import {
  LessonAllocation,
  Subject,
  Teacher,
  ClassStream,
  Room,
  PeriodSlot,
  SportActivity,
  SchoolTerm,
  PublicHoliday,
  DayOfWeek
} from '../types/timetable';

// Map day of week to RFC 5545 day code
const DAY_CODE_MAP: Record<DayOfWeek, string> = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
};

// Map day of week to offset from Monday (0 to 4)
const DAY_OFFSET_MAP: Record<DayOfWeek, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
};

// Format Date object into UTC iCal string: YYYYMMDDTHHMMSSZ or local YYYYMMDDTHHMMSS
function formatICalDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function formatICalDateOnly(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}${month}${day}`;
}

// Find first occurrence date of a specific day of week on or after a start date
function getFirstDayOccurrence(startDateStr: string, day: DayOfWeek): Date {
  const start = new Date(startDateStr);
  // start.getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const currentDayOfWeek = start.getDay(); // 1 for Monday
  const targetDayOffset = DAY_OFFSET_MAP[day] + 1; // 1 for Mon, 5 for Fri
  
  let diff = targetDayOffset - currentDayOfWeek;
  if (diff < 0) {
    diff += 7;
  }
  
  const result = new Date(start);
  result.setDate(start.getDate() + diff);
  return result;
}

/**
 * Generate Google Calendar Web URL for a single lesson or recurring series
 */
export function buildGoogleCalendarUrl(params: {
  title: string;
  details: string;
  location: string;
  startDate: Date;
  endDate: Date;
  recurrenceUntil?: string; // e.g. "20260409T235959Z"
  dayCode?: string; // e.g. "MO"
}): string {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const startStr = formatICalDateTime(params.startDate);
  const endStr = formatICalDateTime(params.endDate);
  
  let url = `${baseUrl}&text=${encodeURIComponent(params.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(params.details)}&location=${encodeURIComponent(params.location)}`;
  
  if (params.recurrenceUntil && params.dayCode) {
    const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${params.dayCode};UNTIL=${params.recurrenceUntil}`;
    url += `&recur=${encodeURIComponent(rrule)}`;
  }
  
  return url;
}

/**
 * Generate an RFC 5545 .ICS iCalendar standard file string for full timetable calendar synchronization
 */
export function generateTimetableICS(options: {
  schoolName: string;
  term: SchoolTerm;
  holidays: PublicHoliday[];
  allocations: LessonAllocation[];
  subjects: Subject[];
  teachers: Teacher[];
  streams: ClassStream[];
  rooms: Room[];
  periods: PeriodSlot[];
  sports?: SportActivity[];
  filterTitle?: string;
}): string {
  const {
    schoolName,
    term,
    holidays,
    allocations,
    subjects,
    teachers,
    streams,
    rooms,
    periods,
    sports = [],
    filterTitle = 'Timetable',
  } = options;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const streamMap = new Map(streams.map((s) => [s.id, s]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const periodMap = new Map(periods.map((p) => [p.periodNumber, p]));

  // Term End Date formatted for UNTIL
  const termEndDate = new Date(term.endDate);
  termEndDate.setHours(23, 59, 59);
  const untilStr = formatICalDateTime(termEndDate) + 'Z';

  // Build exclusion dates (EXDATE) from Public Holidays occurring in this term
  const exdates: string[] = [];
  const termStart = new Date(term.startDate);
  const termEnd = new Date(term.endDate);

  holidays.forEach((hol) => {
    const holDate = new Date(hol.date);
    if (holDate >= termStart && holDate <= termEnd) {
      exdates.push(formatICalDateOnly(holDate));
    }
  });

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//ZimSchool//Timetable Scheduler 2026//EN');
  lines.push(`CALSCALE:GREGORIAN`);
  lines.push(`METHOD:PUBLISH`);
  lines.push(`X-WR-CALNAME:${schoolName} - ${filterTitle} (${term.termName})`);
  lines.push(`X-WR-TIMEZONE:Africa/Harare`);
  lines.push(`X-WR-CALDESC:Official Zimbabwe School Timetable synced with school term & public holidays`);

  // 1. Add Lesson Allocations
  allocations.forEach((alloc) => {
    const subj = subjectMap.get(alloc.subjectId);
    const teacher = teacherMap.get(alloc.teacherId);
    const stream = streamMap.get(alloc.streamId);
    const room = roomMap.get(alloc.roomId);
    const slot = periodMap.get(alloc.periodNumber);

    if (!subj || !slot) return;

    const firstOccurrence = getFirstDayOccurrence(term.startDate, alloc.day);
    
    // Parse time: "08:35" -> hours, mins
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);

    const eventStart = new Date(firstOccurrence);
    eventStart.setHours(startH, startM, 0, 0);

    const eventEnd = new Date(firstOccurrence);
    eventEnd.setHours(endH, endM, 0, 0);

    const summary = `${subj.name} (${subj.code}) - ${stream?.displayName || ''}`;
    const location = `${room?.name || 'Classroom'}, ${schoolName}`;
    const description = `Subject: ${subj.name}\\nClass: ${stream?.displayName || 'N/A'}\\nTeacher: ${teacher ? `${teacher.title} ${teacher.name} (${teacher.code})` : 'TBA'}\\nDepartment: ${subj.department}\\nPeriod: ${slot.name} (${slot.startTime} - ${slot.endTime})\\nTerm: ${term.termName} ${term.year}`;

    const uid = `lesson-${alloc.id}-${term.id}@zimschool.local`;
    const dayCode = DAY_CODE_MAP[alloc.day];

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatICalDateTime(new Date())}Z`);
    lines.push(`DTSTART;TZID=Africa/Harare:${formatICalDateTime(eventStart)}`);
    lines.push(`DTEND;TZID=Africa/Harare:${formatICalDateTime(eventEnd)}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStr}`);
    
    // Add EXDATE exclusions for holidays
    if (exdates.length > 0) {
      exdates.forEach((ex) => {
        // EXDATE;TZID=Africa/Harare:20260418T083500
        const pad = (n: number) => n.toString().padStart(2, '0');
        const exTime = `${ex}T${pad(startH)}${pad(startM)}00`;
        lines.push(`EXDATE;TZID=Africa/Harare:${exTime}`);
      });
    }

    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push(`LOCATION:${location}`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push('END:VEVENT');
  });

  // 2. Add Sports Activities
  sports.forEach((sport) => {
    const coach = teacherMap.get(sport.coachTeacherId);
    const [startH, startM] = sport.startTime.split(':').map(Number);
    const [endH, endM] = sport.endTime.split(':').map(Number);

    sport.days.forEach((sportDay) => {
      const firstOccur = getFirstDayOccurrence(term.startDate, sportDay);
      const eventStart = new Date(firstOccur);
      eventStart.setHours(startH, startM, 0, 0);

      const eventEnd = new Date(firstOccur);
      eventEnd.setHours(endH, endM, 0, 0);

      const summary = `🏆 [Sport] ${sport.name}`;
      const location = `${sport.venue}, ${schoolName}`;
      const description = `Sport / Club: ${sport.name}\\nCategory: ${sport.category}\\nCoach / Patron: ${coach ? `${coach.title} ${coach.name}` : 'TBA'}\\nTarget Forms: ${sport.targetForms.join(', ')}\\nTime: ${sport.startTime} - ${sport.endTime}`;
      const uid = `sport-${sport.id}-${sportDay}-${term.id}@zimschool.local`;
      const dayCode = DAY_CODE_MAP[sportDay];

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${formatICalDateTime(new Date())}Z`);
      lines.push(`DTSTART;TZID=Africa/Harare:${formatICalDateTime(eventStart)}`);
      lines.push(`DTEND;TZID=Africa/Harare:${formatICalDateTime(eventEnd)}`);
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStr}`);
      
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`LOCATION:${location}`);
      lines.push(`STATUS:CONFIRMED`);
      lines.push('END:VEVENT');
    });
  });

  // 3. Add Zimbabwe Public Holidays as informative all-day markers
  holidays.forEach((hol) => {
    const holDate = new Date(hol.date);
    if (holDate >= termStart && holDate <= termEnd) {
      const nextDay = new Date(holDate);
      nextDay.setDate(holDate.getDate() + 1);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:holiday-${hol.id}@zimschool.local`);
      lines.push(`DTSTAMP:${formatICalDateTime(new Date())}Z`);
      lines.push(`DTSTART;VALUE=DATE:${formatICalDateOnly(holDate)}`);
      lines.push(`DTEND;VALUE=DATE:${formatICalDateOnly(nextDay)}`);
      lines.push(`SUMMARY:🇿🇼 Public Holiday: ${hol.name}`);
      lines.push(`DESCRIPTION:Official Zimbabwean Public Holiday. School closed: ${hol.description}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger browser file download of .ICS file
 */
export function downloadICSFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

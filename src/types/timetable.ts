export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export type ZimbabweForm = 
  | 'Form 1' 
  | 'Form 2' 
  | 'Form 3' 
  | 'Form 4' 
  | 'Lower 6' 
  | 'Upper 6';

export type Department = 
  | 'Sciences' 
  | 'Commercials' 
  | 'Humanities & Social Sciences' 
  | 'Languages' 
  | 'Technical & Vocational' 
  | 'Physical Education & Arts';

export type RoomType = 
  | 'classroom' 
  | 'science_lab' 
  | 'computer_lab' 
  | 'workshop' 
  | 'home_economics' 
  | 'sports_ground' 
  | 'hall';

export type PeriodType = 
  | 'assembly' 
  | 'lesson' 
  | 'break' 
  | 'lunch' 
  | 'sports' 
  | 'clubs_devotion';

export interface Subject {
  id: string;
  name: string;
  code: string; // e.g. "4008", "1122", "5006", "9188" (ZIMSEC/Cambridge code)
  department: Department;
  allowedForms: ZimbabweForm[];
  recommendedPeriodsPerWeek: number;
  requiresLab: boolean;
  labType?: RoomType;
  color: string;
  description?: string;
}

export interface UnavailableSlot {
  day: DayOfWeek;
  periodNumber: number;
  reason?: string;
}

export interface TeacherPreferences {
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'any'; // morning = Periods 1-4, afternoon = Periods 5-9
  preferredDays?: DayOfWeek[]; // Days the teacher prefers teaching
  unavailableSlots?: UnavailableSlot[]; // Slots the teacher CANNOT teach
  preferredRooms?: string[]; // Room IDs preferred
  maxConsecutivePeriods?: number; // e.g. 2 or 3
  consecutiveDoublePreferred?: boolean;
}

export interface Teacher {
  id: string;
  title: 'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.' | 'Rev.';
  name: string;
  code: string; // e.g. "TMY", "CND", "FCH"
  email: string;
  phone?: string;
  subjectIds: string[]; // Supports multiple subjects (e.g. Math + Pure Math, Combined Science + Chemistry)
  primarySubjectId?: string;
  department?: Department;
  maxPeriodsPerWeek: number;
  isClassTeacherFor?: string; // ClassStream id
  preferredRooms?: string[];
  preferences?: TeacherPreferences;
  notes?: string;
}

export interface ClassStream {
  id: string;
  form: ZimbabweForm;
  streamName: string; // e.g. "East", "West", "Sciences", "Commercials", "Arts"
  displayName: string; // e.g. "Form 1 East", "Form 4 Sciences", "Upper 6 Arts"
  studentCount: number;
  classTeacherId?: string;
  homeRoomId?: string;
  enrolledSubjectIds: string[];
}

export interface Room {
  id: string;
  name: string; // e.g. "Room 101", "Biology Lab", "Main Computer Lab", "Pavilion Ground"
  type: RoomType;
  capacity: number;
  building?: string;
}

export interface PeriodSlot {
  id: string;
  periodNumber: number; // 1 to 9 (or 0 for assembly)
  name: string; // "Assembly", "Period 1", "Tea Break", "Lunch Break", "Sports & Clubs"
  startTime: string; // "07:30" (24h)
  endTime: string; // "08:10"
  type: PeriodType;
  appliesToDays: DayOfWeek[];
}

export interface LessonAllocation {
  id: string;
  streamId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  day: DayOfWeek;
  periodNumber: number;
  isDoublePeriod?: boolean;
  notes?: string;
}

export interface SportActivity {
  id: string;
  name: string; // "Football / Soccer", "Netball", "Rugby", "Athletics", "Cricket", "Basketball", "Debate & Public Speaking", "Chess", "Scripture Union"
  category: 'Major Sport' | 'Minor Sport' | 'Club & Society' | 'Cultural & Arts';
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  venue: string;
  coachTeacherId: string;
  targetForms: ZimbabweForm[];
  gender: 'Boys' | 'Girls' | 'Co-ed' | 'All';
  description?: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // "2026-04-18"
  description: string;
  isOfficialZimbabweHoliday: boolean;
}

export interface SchoolTerm {
  id: string;
  termNumber: 1 | 2 | 3;
  termName: string; // "Term 1 (Autumn)", "Term 2 (Winter)", "Term 3 (Summer / Exams)"
  year: number;
  startDate: string; // "2026-01-13"
  endDate: string; // "2026-04-09"
  midtermStartDate?: string;
  midtermEndDate?: string;
  isCurrent: boolean;
}

export interface SchoolConfig {
  schoolName: string;
  schoolType: 'Government High School' | 'Mission Boarding School' | 'Trust Independent School' | 'Day Secondary';
  province: 'Harare' | 'Bulawayo' | 'Manicaland' | 'Mashonaland Central' | 'Mashonaland East' | 'Mashonaland West' | 'Masvingo' | 'Matabeleland North' | 'Matabeleland South' | 'Midlands';
  district: string;
  motto: string;
  headmasterName: string;
  academicYear: number;
  activeTermNumber: 1 | 2 | 3;
  curriculum: 'ZIMSEC / Cambridge Dual' | 'ZIMSEC National' | 'Cambridge International';
  schoolStartTime?: string; // "07:00"
  lessonStartTime?: string; // "07:30"
  teaBreakTime?: string; // "10:00"
  lunchTime?: string; // "14:00"
  schoolEndTime?: string; // "16:00"
  fridayEndTime?: string; // "13:00"
  minSubjectsPerStreamOLevel?: number; // 5
  maxSubjectsPerStreamOLevel?: number; // 12
  minDailySubjectsPerStream?: number; // 3
}

export interface ConflictItem {
  id: string;
  type: 'teacher_clash' | 'room_clash' | 'stream_clash' | 'teacher_overload' | 'unassigned_subject';
  severity: 'error' | 'warning';
  title: string;
  description: string;
  day?: DayOfWeek;
  periodNumber?: number;
  involvedIds: string[];
}

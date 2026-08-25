import {
  LessonAllocation,
  Subject,
  Teacher,
  ClassStream,
  Room,
  PeriodSlot,
  ConflictItem,
  DayOfWeek
} from '../types/timetable';

export function detectTimetableConflicts(
  allocations: LessonAllocation[],
  subjects: Subject[],
  teachers: Teacher[],
  streams: ClassStream[],
  rooms: Room[],
  periods: PeriodSlot[]
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const streamMap = new Map(streams.map((s) => [s.id, s]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  // Index allocations by Day + Period
  const dayPeriodAllocations = new Map<string, LessonAllocation[]>();

  allocations.forEach((alloc) => {
    const key = `${alloc.day}-${alloc.periodNumber}`;
    if (!dayPeriodAllocations.has(key)) {
      dayPeriodAllocations.set(key, []);
    }
    dayPeriodAllocations.get(key)!.push(alloc);
  });

  // 1. Check for Teacher double-booking & Room double-booking & Stream double-booking at each timeslot
  dayPeriodAllocations.forEach((slotAllocs, key) => {
    const [day, periodStr] = key.split('-') as [DayOfWeek, string];
    const periodNum = parseInt(periodStr, 10);

    // Check teacher clashes
    const teacherUsage = new Map<string, LessonAllocation[]>();
    // Check room clashes (ignore if room is 'grounds-main' or 'hall-main' which can hold multi classes)
    const roomUsage = new Map<string, LessonAllocation[]>();
    // Check stream clashes
    const streamUsage = new Map<string, LessonAllocation[]>();

    slotAllocs.forEach((alloc) => {
      // Teacher
      if (alloc.teacherId) {
        if (!teacherUsage.has(alloc.teacherId)) {
          teacherUsage.set(alloc.teacherId, []);
        }
        teacherUsage.get(alloc.teacherId)!.push(alloc);
      }

      // Room
      if (alloc.roomId && alloc.roomId !== 'grounds-main' && alloc.roomId !== 'hall-main') {
        if (!roomUsage.has(alloc.roomId)) {
          roomUsage.set(alloc.roomId, []);
        }
        roomUsage.get(alloc.roomId)!.push(alloc);
      }

      // Stream
      if (alloc.streamId) {
        if (!streamUsage.has(alloc.streamId)) {
          streamUsage.set(alloc.streamId, []);
        }
        streamUsage.get(alloc.streamId)!.push(alloc);
      }
    });

    // Report teacher clashes
    teacherUsage.forEach((tAllocs, teacherId) => {
      if (tAllocs.length > 1) {
        const teacher = teacherMap.get(teacherId);
        const classNames = tAllocs.map((a) => streamMap.get(a.streamId)?.displayName || 'Unknown').join(' and ');
        conflicts.push({
          id: `conflict-teacher-${teacherId}-${key}`,
          type: 'teacher_clash',
          severity: 'error',
          title: `Teacher Clashing: ${teacher?.title || 'Mr.'} ${teacher?.name || 'Teacher'} (${teacher?.code || ''})`,
          description: `Double-booked on ${day} Period ${periodNum} with ${classNames}.`,
          day,
          periodNumber: periodNum,
          involvedIds: tAllocs.map((a) => a.id),
        });
      }
    });

    // Report room clashes
    roomUsage.forEach((rAllocs, roomId) => {
      if (rAllocs.length > 1) {
        const room = roomMap.get(roomId);
        const classNames = rAllocs.map((a) => streamMap.get(a.streamId)?.displayName || 'Unknown').join(' and ');
        conflicts.push({
          id: `conflict-room-${roomId}-${key}`,
          type: 'room_clash',
          severity: 'error',
          title: `Room Overcrowded: ${room?.name || 'Room'}`,
          description: `Assigned simultaneously to ${classNames} on ${day} Period ${periodNum}.`,
          day,
          periodNumber: periodNum,
          involvedIds: rAllocs.map((a) => a.id),
        });
      }
    });

    // Report stream clashes
    streamUsage.forEach((sAllocs, streamId) => {
      if (sAllocs.length > 1) {
        const stream = streamMap.get(streamId);
        const subjNames = sAllocs.map((a) => subjectMap.get(a.subjectId)?.name || 'Subject').join(' and ');
        conflicts.push({
          id: `conflict-stream-${streamId}-${key}`,
          type: 'stream_clash',
          severity: 'error',
          title: `Class Double-Booked: ${stream?.displayName || 'Stream'}`,
          description: `Assigned ${subjNames} simultaneously at ${day} Period ${periodNum}.`,
          day,
          periodNumber: periodNum,
          involvedIds: sAllocs.map((a) => a.id),
        });
      }
    });
  });

  // 2. Check Teacher Workload Overload
  const teacherPeriodsCount = new Map<string, number>();
  allocations.forEach((alloc) => {
    if (alloc.teacherId) {
      teacherPeriodsCount.set(alloc.teacherId, (teacherPeriodsCount.get(alloc.teacherId) || 0) + 1);
    }
  });

  teacherPeriodsCount.forEach((count, teacherId) => {
    const teacher = teacherMap.get(teacherId);
    if (teacher && count > teacher.maxPeriodsPerWeek) {
      conflicts.push({
        id: `conflict-overload-${teacherId}`,
        type: 'teacher_overload',
        severity: 'warning',
        title: `Workload Exceeded: ${teacher.title} ${teacher.name}`,
        description: `Teaching ${count} periods/week (Maximum allowed load is ${teacher.maxPeriodsPerWeek} periods).`,
        involvedIds: [teacherId],
      });
    }
  });

  return conflicts;
}

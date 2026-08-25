# Next.js 15 / 16 Migration & Setup Guide

This codebase is crafted with React 19 and Tailwind CSS. All application logic, state stores, Zimbabwean curriculum constraint solvers, calendar generators, and UI views are fully prepared for **Next.js App Router**.

---

## 🚀 Quick Setup for Next.js 15 / 16

### 1. Initialize or copy into a Next.js Project

```bash
npx create-next-app@latest my-timetable-app --typescript --tailwind --app --eslint
cd my-timetable-app
```

### 2. Install Required Dependencies

```bash
npm install lucide-react motion canvas-confetti @google/genai dotenv
npm install -D @types/canvas-confetti
```

---

## 📁 Recommended Next.js File Mapping

| Current Vite Path | Next.js App Router Path | Notes |
|---|---|---|
| `src/App.tsx` | `app/page.tsx` | Add `"use client";` at the top |
| `src/index.css` | `app/globals.css` | Global Tailwind CSS styles |
| `src/components/*` | `components/*` or `app/components/*` | Add `"use client";` to interactive components |
| `src/types/*` | `types/*` | Type definitions (100% portable) |
| `src/data/*` | `data/*` or `lib/data/*` | Preset data & sample generators |
| `src/utils/*` | `utils/*` or `lib/utils/*` | Timetable generator & conflict solver |

---

## 📄 Next.js `app/page.tsx` Example

```tsx
"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useMemo } from "react";
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
} from "@/data/zimbabwePreset";
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
} from "@/types/timetable";
import { Navbar } from "@/components/Navbar";
import { ClassTimetableView } from "@/components/ClassTimetableView";
import { TeacherTimetableView } from "@/components/TeacherTimetableView";
import { SportsScheduleView } from "@/components/SportsScheduleView";
import { SchoolCalendarView } from "@/components/SchoolCalendarView";
import { PrintTimetableView } from "@/components/PrintTimetableView";
import { AdminHubView } from "@/components/AdminHubView";
import { ConflictModal } from "@/components/ConflictModal";
import { detectTimetableConflicts } from "@/utils/conflictDetector";
import { autoGenerateTimetable } from "@/utils/timetableGenerator";

export default function HomePage() {
  // Navigation & Timetable State
  const [activeTab, setActiveTab] = useState<
    "class" | "teacher" | "sports" | "calendar" | "print" | "admin"
  >("class");

  const [config, setConfig] = useState<SchoolConfig>(INITIAL_SCHOOL_CONFIG);
  const [terms, setTerms] = useState<SchoolTerm[]>(INITIAL_TERMS);
  const [holidays, setHolidays] = useState<PublicHoliday[]>(ZIMBABWE_PUBLIC_HOLIDAYS_2026);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [streams, setStreams] = useState<ClassStream[]>(INITIAL_STREAMS);
  const [periods, setPeriods] = useState<PeriodSlot[]>(INITIAL_PERIOD_SLOTS);
  const [sports, setSports] = useState<SportActivity[]>(INITIAL_SPORTS_ACTIVITIES);
  const [allocations, setAllocations] = useState<LessonAllocation[]>(() =>
    generateSampleAllocations()
  );

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("zim_school_config");
      if (savedConfig) setConfig(JSON.parse(savedConfig));
      const savedAlloc = localStorage.getItem("zim_school_allocations");
      if (savedAlloc) setAllocations(JSON.parse(savedAlloc));
      const savedTeachers = localStorage.getItem("zim_school_teachers");
      if (savedTeachers) setTeachers(JSON.parse(savedTeachers));
    } catch (e) {
      console.warn("Could not load stored data:", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        conflictCount={0}
        onOpenConflicts={() => {}}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === "class" && (
          <ClassTimetableView
            streams={streams}
            periods={periods}
            allocations={allocations}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            onUpdateAllocation={() => {}}
          />
        )}
        {activeTab === "teacher" && (
          <TeacherTimetableView
            teachers={teachers}
            periods={periods}
            allocations={allocations}
            subjects={subjects}
            rooms={rooms}
            streams={streams}
          />
        )}
        {activeTab === "sports" && (
          <SportsScheduleView
            sports={sports}
            teachers={teachers}
            rooms={rooms}
            streams={streams}
            onUpdateSports={setSports}
          />
        )}
        {activeTab === "calendar" && (
          <SchoolCalendarView
            terms={terms}
            holidays={holidays}
            config={config}
            onUpdateTerms={setTerms}
            onUpdateHolidays={setHolidays}
          />
        )}
        {activeTab === "print" && (
          <PrintTimetableView
            config={config}
            streams={streams}
            teachers={teachers}
            rooms={rooms}
            subjects={subjects}
            periods={periods}
            allocations={allocations}
            sports={sports}
          />
        )}
        {activeTab === "admin" && (
          <AdminHubView
            config={config}
            setConfig={setConfig}
            terms={terms}
            setTerms={setTerms}
            holidays={holidays}
            setHolidays={setHolidays}
            subjects={subjects}
            setSubjects={setSubjects}
            rooms={rooms}
            setRooms={setRooms}
            teachers={teachers}
            setTeachers={setTeachers}
            streams={streams}
            setStreams={setStreams}
            periods={periods}
            setPeriods={setPeriods}
            sports={sports}
            setSports={setSports}
            allocations={allocations}
            setAllocations={setAllocations}
          />
        )}
      </main>
    </div>
  );
}
```

---

## 📄 Next.js `app/layout.tsx` Example

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grace Harvest Academy - Timetable & School Scheduler",
  description: "Comprehensive ZIMSEC & Cambridge Timetable, Sports & Calendar Planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
```

---

## 📄 Next.js `app/api/generate-timetable/route.ts` (Optional Server Action / API Route)

```ts
import { NextResponse } from "next/server";
import { autoGenerateTimetable } from "@/utils/timetableGenerator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = autoGenerateTimetable(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grace Harvest Academy - Timetable & School Management System',
  description: 'Smart Timetable Scheduler, Sports Fixtures, and Zimbabwe Ministry School Calendar Planner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

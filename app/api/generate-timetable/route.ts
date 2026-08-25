import { NextResponse } from 'next/server';
import { autoGenerateTimetable } from '@/utils/timetableGenerator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = autoGenerateTimetable(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to auto-generate timetable' },
      { status: 500 }
    );
  }
}

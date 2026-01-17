import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';

// Helper functions for period calculations
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(now.setDate(diff));
}

function getWeekEnd(): Date {
  const start = getWeekStart();
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000); // Sunday
}

// Calculate position for ordering (surah * 1000 + verse)
function calculatePosition(surah: number, verse: number): number {
  return surah * 1000 + verse;
}

// POST /api/reading-logs - Create a reading log entry
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { oldSurah, oldVerse, newSurah, newVerse, groupId } = body;

    const oldPosition = calculatePosition(oldSurah, oldVerse);
    const newPosition = calculatePosition(newSurah, newVerse);

    // Calculate delta (progress made)
    const delta = Math.max(0, newPosition - oldPosition);

    const log = await prisma.readingLog.create({
      data: {
        user_id: user.id,
        group_id: groupId || null,
        character_count: delta,
        period_start: getWeekStart(),
        period_end: getWeekEnd(),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Failed to create reading log:', error);
    return NextResponse.json(
      { error: 'Failed to create reading log' },
      { status: 500 }
    );
  }
}

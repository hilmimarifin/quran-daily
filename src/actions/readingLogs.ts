'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from './auth';

// Calculate characters read between two positions
// Position is expressed as (surah * 1000 + verse) to create a linear order
function calculatePosition(surah: number, verse: number): number {
  return surah * 1000 + verse;
}

export async function createReadingLog(data: {
  oldSurah: number;
  oldVerse: number;
  newSurah: number;
  newVerse: number;
  groupId?: string;
}) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const oldPosition = calculatePosition(data.oldSurah, data.oldVerse);
  const newPosition = calculatePosition(data.newSurah, data.newVerse);

  // Calculate delta (progress made)
  // If reading forward, delta is positive. If going back, delta is 0 (no progress loss)
  const delta = Math.max(0, newPosition - oldPosition);

  // Create a reading log entry
  const log = await prisma.readingLog.create({
    data: {
      user_id: user.id,
      group_id: data.groupId || null,
      character_count: delta, // Using position delta as progress metric
      period_start: getWeekStart(),
      period_end: getWeekEnd(),
    },
  });

  return log;
}

export async function getGroupRankings(groupId: string, period: 'weekly' | 'monthly' | 'all' = 'weekly') {
  const user = await getUser();
  if (!user) return null;

  // Build date filter based on period
  let dateFilter: { gte?: Date; lte?: Date } | undefined;
  
  if (period === 'weekly') {
    dateFilter = { gte: getWeekStart(), lte: getWeekEnd() };
  } else if (period === 'monthly') {
    dateFilter = { gte: getMonthStart(), lte: getMonthEnd() };
  }
  // For 'all', we don't filter by date

  // Get all reading logs for this group in the period
  const logs = await prisma.readingLog.groupBy({
    by: ['user_id'],
    where: {
      group_id: groupId,
      ...(dateFilter && { created_at: dateFilter }),
    },
    _sum: {
      character_count: true,
    },
    orderBy: {
      _sum: {
        character_count: 'desc',
      },
    },
  });

  return logs.map((log, index) => ({
    userId: log.user_id,
    rank: index + 1,
    progress: log._sum.character_count || 0,
  }));
}

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

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getMonthEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

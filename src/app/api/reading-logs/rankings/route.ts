import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';

// Helper functions for period calculations
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
}

function getWeekEnd(): Date {
  const start = getWeekStart();
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getMonthEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

// GET /api/reading-logs/rankings - Get group rankings
export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const period = searchParams.get('period') || 'weekly';

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const { periodStart, periodEnd } =
      period === 'weekly'
        ? { periodStart: getWeekStart(), periodEnd: getWeekEnd() }
        : { periodStart: getMonthStart(), periodEnd: getMonthEnd() };

    const logs = await prisma.readingLog.groupBy({
      by: ['user_id'],
      where: {
        group_id: groupId,
        created_at: {
          gte: periodStart,
          lte: periodEnd,
        },
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

    const rankings = logs.map((log, index) => ({
      userId: log.user_id,
      rank: index + 1,
      progress: log._sum.character_count || 0,
    }));

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}

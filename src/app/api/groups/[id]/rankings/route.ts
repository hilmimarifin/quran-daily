'use server';

import { getGroupRankings } from '@/actions/readingLogs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') as 'weekly' | 'monthly' | 'all' || 'weekly';

  try {
    const rankings = await getGroupRankings(id, period);
    if (!rankings) {
      return NextResponse.json({ error: 'Unauthorized or group not found' }, { status: 401 });
    }
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}

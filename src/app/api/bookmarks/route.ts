import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

// GET /api/bookmarks - Fetch all bookmarks for authenticated user
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { user_id: user.id },
      orderBy: { updated_at: 'desc' },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

// POST /api/bookmarks - Create a new bookmark
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, surah_number, verse_number } = body;

    if (!name || !surah_number || !verse_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        user_id: user.id,
        name,
        surah_number,
        verse_number,
      },
    });

    revalidatePath('/bookmarks');
    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Failed to create bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

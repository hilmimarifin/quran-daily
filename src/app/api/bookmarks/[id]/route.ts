import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/bookmarks/[id] - Update bookmark position
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { surah_number, verse_number } = body;

    if (!surah_number || !verse_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get old bookmark position for progress calculation
    const oldBookmark = await prisma.bookmark.findUnique({
      where: { id, user_id: user.id },
    });

    if (!oldBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    const bookmark = await prisma.bookmark.update({
      where: { id, user_id: user.id },
      data: {
        surah_number,
        verse_number,
        updated_at: new Date(),
      },
    });

    // Create reading log for all groups where this bookmark is active
    const memberships = await prisma.groupMember.findMany({
      where: {
        user_id: user.id,
        current_bookmark_id: id,
      },
    });

    // Calculate character progress (Arabic letters read)
    const { calculateCharacterProgress } = await import('@/lib/quranUtils');
    const characterCount = await calculateCharacterProgress(
      oldBookmark.surah_number,
      oldBookmark.verse_number,
      surah_number,
      verse_number
    );

    // Create reading logs for each group
    if (characterCount > 0) {
      for (const membership of memberships) {
        await prisma.readingLog.create({
          data: {
            user_id: user.id,
            group_id: membership.group_id,
            character_count: characterCount,
          },
        });
      }
    }

    revalidatePath('/bookmarks');
    revalidatePath('/');
    revalidatePath('/groups');
    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Failed to update bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookmarks/[id] - Delete a bookmark
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.bookmark.delete({
      where: { id, user_id: user.id },
    });

    revalidatePath('/bookmarks');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}

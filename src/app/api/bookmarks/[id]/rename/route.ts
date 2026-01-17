import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/bookmarks/[id]/rename - Rename a bookmark
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.update({
      where: { id, user_id: user.id },
      data: { name },
    });

    revalidatePath('/bookmarks');
    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Failed to rename bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to rename bookmark' },
      { status: 500 }
    );
  }
}

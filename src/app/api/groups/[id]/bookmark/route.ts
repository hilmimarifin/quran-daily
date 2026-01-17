import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/groups/[id]/bookmark - Set active bookmark for group
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { bookmarkId } = body;

    if (!bookmarkId) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const member = await prisma.groupMember.update({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: user.id,
        },
      },
      data: {
        current_bookmark_id: bookmarkId,
      },
    });

    revalidatePath(`/groups/${groupId}`);
    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to set active bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to set active bookmark' },
      { status: 500 }
    );
  }
}

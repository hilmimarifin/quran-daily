import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/groups/[id]/leave - Leave a group
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    await prisma.groupMember.delete({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: user.id,
        },
      },
    });

    revalidatePath('/groups');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to leave group:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}

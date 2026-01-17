import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/groups/[id]/join - Join a group
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Check if group exists and is not deleted
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group || group.deleted_at) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already member
    const existing = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const member = await prisma.groupMember.create({
      data: {
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      },
    });

    revalidatePath('/groups');
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Failed to join group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

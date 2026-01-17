import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';
import { Group, GroupMember } from '@prisma/client';

type GroupWithCount = Group & {
  _count: {
    members: number;
  };
};

type GroupMemberWithGroup = GroupMember & {
  group: GroupWithCount;
};

// GET /api/groups - Fetch all groups user belongs to
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await prisma.groupMember.findMany({
      where: {
        user_id: user.id,
        group: {
          deleted_at: null,
        },
      },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const groups = members.map((m: GroupMemberWithGroup) => ({
      ...m.group,
      role: m.role,
      memberCount: m.group._count.members,
    }));

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        created_by: user.id,
        members: {
          create: {
            user_id: user.id,
            role: 'admin',
          },
        },
      },
    });

    revalidatePath('/groups');
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

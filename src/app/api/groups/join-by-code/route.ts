import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

// POST /api/groups/join-by-code - Join a group by its 5-character code
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase().trim();

    if (normalizedCode.length !== 5) {
      return NextResponse.json({ error: 'Group code must be 5 characters' }, { status: 400 });
    }

    // Find group by code
    const group = await prisma.group.findUnique({
      where: { group_code: normalizedCode },
    });

    if (!group || group.deleted_at) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already member
    const existing = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: group.id,
          user_id: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ 
        ...existing, 
        groupId: group.id,
        message: 'Already a member' 
      });
    }

    const member = await prisma.groupMember.create({
      data: {
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      },
    });

    revalidatePath('/groups');
    return NextResponse.json({ ...member, groupId: group.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to join group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

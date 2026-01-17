import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';
import { Bookmark, GroupMember, Profile } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id] - Fetch group details with members
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
        deleted_at: null,
      },
      include: {
        members: {
          include: {
            bookmark: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Fetch profiles for members
    const userIds = group.members.map((m: GroupMember) => m.user_id);
    const profiles = await prisma.profile.findMany({
      where: { id: { in: userIds } },
    });

    // Fetch total progress for each member in this group
    const progressData = await prisma.readingLog.groupBy({
      by: ['user_id'],
      where: {
        group_id: groupId,
      },
      _sum: {
        character_count: true,
      },
    });

    const progressMap = new Map(
      progressData.map((p) => [p.user_id, p._sum.character_count || 0])
    );

    const membersWithProfile = group.members.map((m: GroupMember & { bookmark: Bookmark | null }) => {
      const profile = profiles.find((p: Profile) => p.id === m.user_id);
      const progress = progressMap.get(m.user_id) || 0;
      return {
        ...m,
        profile,
        progress,
      };
    });

    // Sort by progress (highest first)
    membersWithProfile.sort((a, b) => b.progress - a.progress);

    return NextResponse.json({
      ...group,
      members: membersWithProfile,
      currentUserRole: membership.role,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error('Failed to fetch group details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group details' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Soft delete a group (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Verify user is admin of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: user.id,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can delete the group' },
        { status: 403 }
      );
    }

    // Soft delete the group
    await prisma.group.update({
      where: { id: groupId },
      data: {
        deleted_at: new Date(),
      },
    });

    revalidatePath('/groups');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}

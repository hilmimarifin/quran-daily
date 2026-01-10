'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function getGroups() {
  const user = await getUser();
  if (!user) return [];

  const members = await prisma.groupMember.findMany({
    where: { user_id: user.id },
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

  return members.map((m: any) => ({
    ...m.group,
    role: m.role,
    memberCount: m.group._count.members,
  }));
}

export async function createGroup(name: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

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
  return group;
}

export async function joinGroup(groupId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  // Check if already member
  const existing = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: user.id,
      },
    },
  });

  if (existing) return existing;

  const member = await prisma.groupMember.create({
    data: {
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    },
  });

  revalidatePath('/groups');
  return member;
}

export async function getGroupDetails(groupId: string) {
  const user = await getUser();
  if (!user) return null;

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: user.id,
      },
    },
  });

  if (!membership) return null;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          bookmark: true,
        },
      },
    },
  });

  if (!group) return null;

  // Fetch profiles for members
  const userIds = group.members.map((m: any) => m.user_id);
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

  const progressMap = new Map(progressData.map((p: any) => [p.user_id, p._sum.character_count || 0]));

  const membersWithProfile = group.members.map((m: any) => {
    const profile = profiles.find((p: any) => p.id === m.user_id);
    const progress = progressMap.get(m.user_id) || 0;
    return {
      ...m,
      profile,
      progress, // Total progress for this member
    };
  });

  // Sort by progress (highest first)
  membersWithProfile.sort((a, b) => b.progress - a.progress);

  return {
    ...group,
    members: membersWithProfile,
    currentUserRole: membership.role,
    currentUserId: user.id,
  };
}

export async function setActiveBookmarkForGroup(groupId: string, bookmarkId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

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
  return member;
}

export async function leaveGroup(groupId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.groupMember.delete({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: user.id,
      },
    },
  });

  revalidatePath('/groups');
}

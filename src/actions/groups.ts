'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from './auth';
import { revalidatePath } from 'next/cache';
import { Bookmark, Group, GroupMember, Profile } from '@prisma/client';
import { cache } from 'react';

type GroupWithCount = Group & {
  _count: {
    members: number;
  };
};

type GroupMemberWithGroup = GroupMember & {
  group: GroupWithCount;
};

export const getGroups = cache(async () => {
  const user = await getUser();
  if (!user) return [];

  const members = await prisma.groupMember.findMany({
    where: { 
      user_id: user.id,
      group: {
        deleted_at: null, // Filter out soft-deleted groups
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

  return members.map((m: GroupMemberWithGroup) => ({
    ...m.group,
    role: m.role,
    memberCount: m.group._count.members,
  }));
});

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

  // Check if group exists and is not deleted
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group || group.deleted_at) {
    throw new Error('Group not found');
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
    where: { 
      id: groupId,
      deleted_at: null, // Filter out soft-deleted groups
    },
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

  // Fetch juz data for each member's bookmark
  const membersWithProfile = await Promise.all(
    group.members.map(async (m: GroupMember & { bookmark: Bookmark | null }) => {
      const profile = profiles.find((p: Profile) => p.id === m.user_id);
      const progress = progressMap.get(m.user_id) || 0;

      // Fetch juz data if member has a bookmark
      let juzData = {
        juz_number: undefined as number | undefined,
        verse_position_in_juz: undefined as number | undefined,
        total_verses_in_juz: undefined as number | undefined,
      };

      if (m.bookmark) {
        try {
          const verseKey = `${m.bookmark.surah_number}:${m.bookmark.verse_number}`;
          
          // Get juz number for this verse
          const verseResponse = await fetch(
            `https://api.quran.com/api/v4/verses/by_key/${verseKey}`
          );
          const verseData = await verseResponse.json();
          const juzNumber = verseData.verse?.juz_number;

          if (juzNumber) {
            // Get total verses count for this juz
            const juzResponse = await fetch(
              `https://api.quran.com/api/v4/juzs/${juzNumber}`
            );
            const juzInfo = await juzResponse.json();
            const totalVersesInJuz = juzInfo.juz?.verses_count;

            if (totalVersesInJuz) {
              // Get all verses in this juz to find position
              const versesResponse = await fetch(
                `https://api.quran.com/api/v4/verses/by_juz/${juzNumber}?page=1&per_page=${totalVersesInJuz}`
              );
              const versesData = await versesResponse.json();
              
              // Find the position of current verse in juz (1-indexed)
              const versePositionInJuz = versesData.verses?.findIndex(
                (v: { verse_key: string }) => v.verse_key === verseKey
              ) + 1;

              juzData = {
                juz_number: juzNumber,
                verse_position_in_juz: versePositionInJuz > 0 ? versePositionInJuz : undefined,
                total_verses_in_juz: totalVersesInJuz,
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch juz data for member ${m.user_id}:`, error);
        }
      }

      return {
        ...m,
        profile,
        progress,
        ...juzData,
      };
    })
  );

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

export async function deleteGroup(groupId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

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
    throw new Error('Only admin can delete the group');
  }

  // Soft delete the group
  await prisma.group.update({
    where: { id: groupId },
    data: {
      deleted_at: new Date(),
    },
  });

  revalidatePath('/groups');
}


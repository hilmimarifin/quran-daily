'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from './auth';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export const getBookmarks = cache(async () => {
  const user = await getUser();
  if (!user) return [];

  return await prisma.bookmark.findMany({
    where: { user_id: user.id },
    orderBy: { updated_at: 'desc' },
  });
});

export async function addBookmark(data: {
  name: string;
  surah_number: number;
  verse_number: number;
}) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const bookmark = await prisma.bookmark.create({
    data: {
      user_id: user.id,
      name: data.name,
      surah_number: data.surah_number,
      verse_number: data.verse_number,
    },
  });

  revalidatePath('/bookmarks');
  return bookmark;
}

export async function deleteBookmark(id: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.bookmark.delete({
    where: { id, user_id: user.id },
  });

  revalidatePath('/bookmarks');
}

export async function updateBookmark(
  id: string,
  data: { surah_number: number; verse_number: number }
) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  // Get old bookmark position for progress calculation
  const oldBookmark = await prisma.bookmark.findUnique({
    where: { id, user_id: user.id },
  });

  if (!oldBookmark) throw new Error('Bookmark not found');

  const bookmark = await prisma.bookmark.update({
    where: { id, user_id: user.id },
    data: {
      surah_number: data.surah_number,
      verse_number: data.verse_number,
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
    data.surah_number,
    data.verse_number
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
  return bookmark;
}

export async function renameBookmark(id: string, name: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const bookmark = await prisma.bookmark.update({
    where: { id, user_id: user.id },
    data: { name },
  });

  revalidatePath('/bookmarks');
  return bookmark;
}

'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from './auth';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

// Types for Quran API responses
interface VerseByKeyResponse {
  verse: {
    juz_number: number;
    verse_key: string;
  };
}

interface JuzResponse {
  juz: {
    verses_count: number;
  };
}

interface VersesByJuzResponse {
  verses: { verse_key: string }[];
}

export const getBookmarks = cache(async () => {
  const user = await getUser();
  if (!user) return [];

  const bookmarks = await prisma.bookmark.findMany({
    where: { user_id: user.id },
    orderBy: { updated_at: 'desc' },
  });

  // Fetch juz data for each bookmark
  const bookmarksWithJuz = await Promise.all(
    bookmarks.map(async (bookmark) => {
      try {
        const verseKey = `${bookmark.surah_number}:${bookmark.verse_number}`;
        
        // Get juz number for this verse
        const verseResponse = await fetch(
          `https://api.quran.com/api/v4/verses/by_key/${verseKey}`
        );
        const verseData: VerseByKeyResponse = await verseResponse.json();
        const juzNumber = verseData.verse.juz_number;

        // Get total verses count for this juz
        const juzResponse = await fetch(
          `https://api.quran.com/api/v4/juzs/${juzNumber}`
        );
        const juzData: JuzResponse = await juzResponse.json();
        const totalVersesInJuz = juzData.juz.verses_count;

        // Get all verses in this juz to find position
        const versesResponse = await fetch(
          `https://api.quran.com/api/v4/verses/by_juz/${juzNumber}?page=1&per_page=${totalVersesInJuz}`
        );
        const versesData: VersesByJuzResponse = await versesResponse.json();
        
        // Find the position of current verse in juz (1-indexed)
        const versePositionInJuz = versesData.verses.findIndex(
          (v) => v.verse_key === verseKey
        ) + 1;

        return {
          ...bookmark,
          juz_number: juzNumber,
          verse_position_in_juz: versePositionInJuz,
          total_verses_in_juz: totalVersesInJuz,
        };
      } catch (error) {
        console.error(`Failed to fetch juz data for bookmark ${bookmark.id}:`, error);
        return {
          ...bookmark,
          juz_number: undefined,
          verse_position_in_juz: undefined,
          total_verses_in_juz: undefined,
        };
      }
    })
  );

  return bookmarksWithJuz;
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

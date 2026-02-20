import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani?: string;
  text_imlaei?: string;
  text_indopak?: string;
  verse_number?: number;
  juz_number?: number;
}

export interface QuranResponse {
  verses: Verse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface ChapterResponse {
  chapters: Chapter[];
}

export interface AyatResponse {
  code: number;
  message: string;
  data: {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
    deskripsi: string;
  }[];
}

// Fetch all verses for a chapter in a single API call
const fetchAllVerses = async (chapterId: number, versesCount: number) => {
  const { data } = await axios.get<QuranResponse>(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}`,
    {
      params: {
        language: 'en',
        words: false,
        translations: false,
        audio: false,
        page: 1,
        per_page: versesCount, // Get all verses in one call
        fields: 'text_indopak',
        // fields: 'text_uthmani',
      },
    }
  );
  return data;
};

const fetchChapters = async () => {
  const { data } = await axios.get<ChapterResponse>(`https://api.quran.com/api/v4/chapters`);
  return data;
};

const fetchSurat = async () => {
  const { data } = await axios.get<AyatResponse>(`https://equran.id/api/v2/surat`);
  return data;
};

// Fetch all verses for a chapter using verses_count
export const useQuran = (chapterId: number, versesCount: number) => {
  return useQuery({
    queryKey: ['quran', chapterId, 'all'],
    queryFn: () => fetchAllVerses(chapterId, versesCount),
    enabled: versesCount > 0, // Only fetch when we have verses_count
  });
};

export const useChapters = () => {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: () => fetchChapters(),
    staleTime: Infinity, // Chapters don't change, cache forever
  });
};

export const useSurat = () => {
  return useQuery({
    queryKey: ['surat'],
    queryFn: () => fetchSurat(),
    staleTime: Infinity, // Chapters don't change, cache forever
  });
};

// Juz data types and hook
export interface JuzData {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>; // e.g. { "1": "1-7", "2": "1-141" }
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

const fetchJuz = async (juzNumber: number) => {
  const { data } = await axios.get<{ juz: JuzData }>(
    `https://api.quran.com/api/v4/juzs/${juzNumber}`
  );
  return data.juz;
};

export const useJuz = (juzNumber: number | null) => {
  return useQuery({
    queryKey: ['juz', juzNumber],
    queryFn: () => fetchJuz(juzNumber!),
    enabled: juzNumber !== null && juzNumber > 0,
    staleTime: Infinity, // Juz data doesn't change
  });
};

// Helper: calculate verse position within a juz using verse_mapping
export function getVersePositionInJuz(
  juzData: JuzData,
  chapterId: number,
  verseNumber: number
): { position: number; total: number } {
  let position = 0;
  const sortedChapterIds = Object.keys(juzData.verse_mapping)
    .map(Number)
    .sort((a, b) => a - b);

  for (const chId of sortedChapterIds) {
    const range = juzData.verse_mapping[String(chId)];
    const [start, end] = range.split('-').map(Number);
    const versesInRange = end - start + 1;

    if (chId < chapterId) {
      position += versesInRange;
    } else if (chId === chapterId) {
      position += Math.min(verseNumber, end) - start + 1;
      break;
    }
  }

  return { position, total: juzData.verses_count };
}

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  verse_number?: number;
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
        fields: 'text_uthmani',
      },
    }
  );
  return data;
};

const fetchChapters = async () => {
  const { data } = await axios.get<ChapterResponse>(`https://api.quran.com/api/v4/chapters`);
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

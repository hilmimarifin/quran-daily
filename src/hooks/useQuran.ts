import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
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

const fetchVerses = async (chapterId: number = 1, page: number = 1) => {
  const { data } = await axios.get<QuranResponse>(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}`,
    {
      params: {
        language: 'en',
        words: false,
        translations: false,
        audio: false,
        page: page,
        per_page: 10, // Small for MVP demo
        fields: 'text_uthmani',
      },
    }
  );
  return data;
};

export const useQuran = (chapterId: number, page: number) => {
  return useQuery({
    queryKey: ['quran', chapterId, page],
    queryFn: () => fetchVerses(chapterId, page),
  });
};

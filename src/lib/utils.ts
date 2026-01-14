import { ChapterResponse } from '@/hooks/useQuran';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getChapterName(chapterId: number, chaptersData?: ChapterResponse) {
  if (!chaptersData) return '';
  const chapter = chaptersData.chapters?.find((chapter) => chapter.id === chapterId);
  return chapter?.name_simple || '';
}
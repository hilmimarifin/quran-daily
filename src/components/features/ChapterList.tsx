'use client';

import { useChapters } from '@/hooks/useQuran';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ChapterList = () => {
  const { data, isLoading, error } = useChapters();
  const router = useRouter();

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error) return <div>Error: {error.message}</div>;
  const handleNavigate = (surah: number) => {
    router.push(`/read/?surah=${surah}`);
  };

  return (
    <div className='space-y-2'>
      {data?.chapters.map((chapter) => (
        <Card
          key={chapter.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleNavigate(chapter.id)}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">{chapter.id}. {chapter.name_simple}</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChapterList;

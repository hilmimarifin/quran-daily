'use client';
import { useState } from 'react';

import { useSurat } from '@/hooks/useQuran';
import { Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

const ChapterList = () => {
  // const { data, isLoading, error } = useChapters();
  const { data, isLoading, error } = useSurat();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredChapters = data?.data.filter(
    (chapter) =>
      chapter.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.nomor.toString().includes(searchQuery)
  );

  return (
    <div className="relative">
      <div className="sticky top-16 z-10 bg-background mb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau nomor surat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        {filteredChapters?.map((chapter) => (
          <Card
            key={chapter.nomor}
            className="cursor-pointer hover:bg-muted/50 transition-colors border-r-4 border-r-primary"
            onClick={() => handleNavigate(chapter.nomor)}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium flex flex-row justify-between w-full">
                <div className="flex flex-row">
                  <span className="mr-2">{chapter.nomor}.</span>
                  <div className="flex flex-col">
                    <span>{chapter.namaLatin}</span>
                    <span className='text-xs text-gray-500'>{chapter.arti} ayat</span>
                  </div>
                </div>
                <span>{chapter.nama}</span>
              </CardTitle>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        ))}
        {filteredChapters?.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No chapters found</div>
        )}
      </div>
    </div>
  );
};

export default ChapterList;

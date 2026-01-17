'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuran, useChapters, Verse } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, X, Languages } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkSheet } from '@/components/features/BookmarkSheet';
import { getChapterName } from '@/lib/utils';

// Type for translation data from eQuran API
interface TranslationVerse {
  nomorAyat: number;
  teksIndonesia: string;
}

interface TranslationData {
  [verseNumber: number]: string;
}

// Loading skeleton component for verses
function VerseSkeleton() {
  return (
    <Card className="border-none shadow-sm bg-card/50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4 ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

// Translation loading skeleton
function TranslationSkeleton() {
  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function ReaderClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL params
  const initialSurah = searchParams.get('surah');
  const initialVerse = searchParams.get('verse');
  const bookmarkName = searchParams.get('bookmark');

  const [chapterId, setChapterId] = useState(initialSurah ? parseInt(initialSurah) : 1);
  const targetVerseNumber = initialVerse ? parseInt(initialVerse) : null;

  // Fetch chapters to get verses_count
  const { data: chaptersData } = useChapters();

  // Get current chapter info
  const currentChapter = useMemo(() => {
    return chaptersData?.chapters.find((c) => c.id === chapterId);
  }, [chaptersData, chapterId]);

  const versesCount = currentChapter?.verses_count ?? 0;

  // Fetch all verses for the chapter in a single API call
  const { data, isLoading, isError } = useQuran(chapterId, versesCount);

  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showContextIndicator, setShowContextIndicator] = useState(!!bookmarkName);
  const [hasScrolledToTarget, setHasScrolledToTarget] = useState(false);

  const [searchVerse, setSearchVerse] = useState('');
  const targetVerseRef = useRef<HTMLDivElement>(null);

  // Translation state
  const [showTranslation, setShowTranslation] = useState(false);
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  const handleSearchVerse = () => {
    const verseNum = parseInt(searchVerse);
    if (isNaN(verseNum)) return;

    if (verseNum < 1 || verseNum > versesCount) {
      alert(`Masukkan nomor ayat antara 1 dan ${versesCount}`);
      return;
    }

    const element = document.getElementById(`verse-${verseNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const allVerses = data?.verses ?? [];

  // Scroll to target verse when data loads
  useEffect(() => {
    if (
      !hasScrolledToTarget &&
      allVerses.length > 0 &&
      targetVerseNumber &&
      targetVerseRef.current
    ) {
      const timer = setTimeout(() => {
        targetVerseRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        setHasScrolledToTarget(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [allVerses.length, targetVerseNumber, hasScrolledToTarget]);

  const handleVerseClick = (verse: Verse) => {
    setSelectedVerse(verse);
    setIsSheetOpen(true);
  };

  const handleDismissIndicator = () => {
    setShowContextIndicator(false);
    router.replace('/read', { scroll: false });
  };

  const handleChapterChange = (newChapterId: number) => {
    setChapterId(newChapterId);
    setHasScrolledToTarget(false);
    // Reset translations when chapter changes
    setTranslations({});
  };

  // Fetch Indonesian translations when toggle is enabled
  useEffect(() => {
    if (!showTranslation) return;

    const fetchTranslations = async () => {
      setIsLoadingTranslation(true);
      try {
        const response = await fetch(`https://equran.id/api/v2/surat/${chapterId}`);
        const data = await response.json();

        if (data.code === 200 && data.data?.ayat) {
          const translationMap: TranslationData = {};
          data.data.ayat.forEach((ayat: TranslationVerse) => {
            translationMap[ayat.nomorAyat] = ayat.teksIndonesia;
          });
          setTranslations(translationMap);
        }
      } catch (error) {
        console.error('Failed to fetch translations:', error);
      } finally {
        setIsLoadingTranslation(false);
      }
    };

    fetchTranslations();
  }, [showTranslation, chapterId]);

  const handleToggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  const showLoading = isLoading || !chaptersData;

  return (
    <div className="container max-w-md mx-auto p-4 space-y-4 pb-24">
      {/* Context Indicator - shown when navigating from bookmark */}
      {showContextIndicator && bookmarkName && (
        <div className="sticky top-28 z-40 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{bookmarkName}</div>
              <div className="text-xs text-muted-foreground">
                QS. {getChapterName(chapterId, chaptersData)} ayat {targetVerseNumber}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismissIndicator}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <header className="flex flex-col gap-4 py-2 sticky top-0 z-30 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {currentChapter?.name_simple ?? `Surah ${chapterId}`}
            </h1>
            {currentChapter && (
              <p className="text-sm text-muted-foreground">{currentChapter.name_arabic}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleChapterChange(Math.max(1, chapterId - 1))}
              disabled={chapterId <= 1}
            >
              Prev
            </Button>
            <Button
              size="sm"
              onClick={() => handleChapterChange(Math.min(114, chapterId + 1))}
              disabled={chapterId >= 114}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Masukkan nomor ayat...`}
            value={searchVerse}
            onChange={(e) => setSearchVerse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchVerse()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSearchVerse}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={showTranslation ? 'default' : 'outline'}
            onClick={handleToggleTranslation}
            title="Tampilkan terjemahan"
          >
            <Languages className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {showLoading ? (
        <div className="space-y-4">
          <VerseSkeleton />
          <VerseSkeleton />
          <VerseSkeleton />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive">Gagal memuat ayat. Silahkan coba lagi.</div>
      ) : (
        <div className="space-y-4">
          {allVerses.map((verse) => {
            const verseNumber = parseInt(verse.verse_key.split(':')[1]);
            const isTargetVerse = verseNumber === targetVerseNumber;

            return (
              <Card
                key={verse.id}
                id={`verse-${verseNumber}`}
                ref={isTargetVerse ? targetVerseRef : null}
                className={`border-none shadow-sm cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99] pb-0 ${
                  isTargetVerse ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-card/50'
                }`}
                onClick={() => handleVerseClick(verse)}
              >
                <CardContent className="">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {verse.verse_number}
                  </span>
                  <p className="text-right text-2xl font-serif leading-loose" dir="rtl">
                    {verse.text_uthmani}
                  </p>
                  {showTranslation &&
                    (isLoadingTranslation ? (
                      <TranslationSkeleton />
                    ) : translations[verseNumber] ? (
                      <p className="m-3 pt-3 border-t border-border/50 text-sm text-muted-foreground leading-relaxed">
                        {translations[verseNumber]}
                      </p>
                    ) : null)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handleChapterChange(Math.max(1, chapterId - 1))}
          disabled={chapterId <= 1}
        >
          Prev
        </Button>
        <Button
          size="sm"
          onClick={() => handleChapterChange(Math.min(114, chapterId + 1))}
          disabled={chapterId >= 114}
        >
          Next
        </Button>
      </div>

      <BookmarkSheet
        chaptersData={chaptersData}
        key={isSheetOpen ? 'open' : 'closed'}
        verse={selectedVerse}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        chapterId={chapterId}
      />
    </div>
  );
}

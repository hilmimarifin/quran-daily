'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuran, Verse } from '@/hooks/useQuran';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkSheet } from '@/components/features/BookmarkSheet';

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

export function ReaderClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL params
  const initialSurah = searchParams.get('surah');
  const initialVerse = searchParams.get('verse');
  const bookmarkName = searchParams.get('bookmark');

  const [chapterId, setChapterId] = useState(initialSurah ? parseInt(initialSurah) : 1);
  const [page, setPage] = useState(1);
  // Store pages of verses keyed by page number to avoid duplicate fetches
  const [versesByPage, setVersesByPage] = useState<Record<number, Verse[]>>({});
  const { data, isLoading, isError } = useQuran(chapterId, page);

  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showContextIndicator, setShowContextIndicator] = useState(!!bookmarkName);

  const targetVerseRef = useRef<HTMLDivElement>(null);
  const targetVerseNumber = initialVerse ? parseInt(initialVerse) : null;
  const observerRef = useRef<HTMLDivElement>(null);
  const hasNextPage = data?.pagination.next_page ?? false;

  // Store verses when data loads (keyed by page to avoid re-setting)
  const currentPageVerses = data?.verses;
  if (currentPageVerses && !versesByPage[page]) {
    // This runs during render, not in an effect, avoiding cascading renders
    setVersesByPage((prev) => ({ ...prev, [page]: currentPageVerses }));
  }

  // Compute all verses from the pages we've loaded
  const allVerses = useMemo(() => {
    const pages = Object.keys(versesByPage)
      .map(Number)
      .sort((a, b) => a - b);
    return pages.flatMap((p) => versesByPage[p]);
  }, [versesByPage]);

  // Scroll to verse when data loads
  useEffect(() => {
    if (allVerses.length > 0 && targetVerseNumber && targetVerseRef.current) {
      targetVerseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [allVerses, targetVerseNumber]);

  // Infinite scroll with IntersectionObserver at 75% threshold
  const loadMore = useCallback(() => {
    if (!isLoading && hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [isLoading, hasNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.75, // Trigger when 75% visible
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  const handleVerseClick = (verse: Verse) => {
    setSelectedVerse(verse);
    setIsSheetOpen(true);
  };

  const handleDismissIndicator = () => {
    setShowContextIndicator(false);
    // Clear URL params
    router.replace('/read', { scroll: false });
  };

  const handleChapterChange = (newChapterId: number) => {
    setVersesByPage({});
    setPage(1);
    setChapterId(newChapterId);
  };

  // Show initial loading state
  const showInitialLoading = isLoading && allVerses.length === 0;
  // Show loading skeleton at the bottom when loading more
  const showLoadingMore = isLoading && allVerses.length > 0;

  return (
    <div className="container max-w-md mx-auto p-4 space-y-4 pb-24">
      {/* Context Indicator - shown when navigating from bookmark */}
      {showContextIndicator && bookmarkName && (
        <div className="sticky top-14 z-40 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{bookmarkName}</div>
              <div className="text-xs text-muted-foreground">
                Surah {chapterId}, Verse {targetVerseNumber}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismissIndicator}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <header className="flex items-center justify-between py-2">
        <h1 className="text-xl font-bold">Surah {chapterId}</h1>
        {/* Simple navigation for MVP */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChapterChange(Math.max(1, chapterId - 1))}
            disabled={chapterId <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChapterChange(Math.min(114, chapterId + 1))}
            disabled={chapterId >= 114}
          >
            Next
          </Button>
        </div>
      </header>

      {showInitialLoading ? (
        <div className="space-y-4">
          <VerseSkeleton />
          <VerseSkeleton />
          <VerseSkeleton />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive">Failed to load verses. Please try again.</div>
      ) : (
        <div className="space-y-4">
          {allVerses.map((verse) => {
            const verseNumber = parseInt(verse.verse_key.split(':')[1]);
            const isTargetVerse = verseNumber === targetVerseNumber;

            return (
              <Card
                key={verse.id}
                ref={isTargetVerse ? targetVerseRef : null}
                className={`border-none shadow-sm cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99] ${
                  isTargetVerse ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-card/50'
                }`}
                onClick={() => handleVerseClick(verse)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {verse.verse_key}
                    </span>
                  </div>
                  <p className="text-right text-2xl font-serif leading-loose" dir="rtl">
                    {verse.text_uthmani}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {/* Loading skeleton for infinite scroll */}
          {showLoadingMore && (
            <div className="space-y-4">
              <VerseSkeleton />
              <VerseSkeleton />
            </div>
          )}

          {/* Intersection observer trigger element */}
          {hasNextPage && !isLoading && (
            <div ref={observerRef} className="h-20" aria-hidden="true" />
          )}
        </div>
      )}

      <BookmarkSheet
        key={isSheetOpen ? 'open' : 'closed'}
        verse={selectedVerse}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        chapterId={chapterId}
      />
    </div>
  );
}

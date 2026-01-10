"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuran, Verse } from "@/hooks/useQuran";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, BookOpen } from "lucide-react";
import { BookmarkSheet } from "@/components/features/BookmarkSheet";

export function ReaderClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL params
  const initialSurah = searchParams.get("surah");
  const initialVerse = searchParams.get("verse");
  const bookmarkName = searchParams.get("bookmark");

  const [chapterId, setChapterId] = useState(
    initialSurah ? parseInt(initialSurah) : 1
  );
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuran(chapterId, page);

  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showContextIndicator, setShowContextIndicator] = useState(
    !!bookmarkName
  );

  const targetVerseRef = useRef<HTMLDivElement>(null);
  const targetVerseNumber = initialVerse ? parseInt(initialVerse) : null;

  // Scroll to verse when data loads
  useEffect(() => {
    if (data && targetVerseNumber && targetVerseRef.current) {
      targetVerseRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [data, targetVerseNumber]);

  const handleVerseClick = (verse: Verse) => {
    setSelectedVerse(verse);
    setIsSheetOpen(true);
  };

  const handleDismissIndicator = () => {
    setShowContextIndicator(false);
    // Clear URL params
    router.replace("/", { scroll: false });
  };

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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismissIndicator}
          >
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
            onClick={() => setChapterId((c) => Math.max(1, c - 1))}
            disabled={chapterId <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChapterId((c) => Math.min(114, c + 1))}
            disabled={chapterId >= 114}
          >
            Next
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive">
          Failed to load verses. Please try again.
        </div>
      ) : (
        <div className="space-y-4">
          {data?.verses.map((verse) => {
            const verseNumber = parseInt(verse.verse_key.split(":")[1]);
            const isTargetVerse = verseNumber === targetVerseNumber;

            return (
              <Card
                key={verse.id}
                ref={isTargetVerse ? targetVerseRef : null}
                className={`border-none shadow-sm cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99] ${
                  isTargetVerse
                    ? "bg-primary/5 ring-2 ring-primary/30"
                    : "bg-card/50"
                }`}
                onClick={() => handleVerseClick(verse)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {verse.verse_key}
                    </span>
                  </div>
                  <p
                    className="text-right text-2xl font-serif leading-loose"
                    dir="rtl"
                  >
                    {verse.text_uthmani}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-center pt-4">
            {data?.pagination.next_page && (
              <Button onClick={() => setPage((p) => p + 1)}>Load More</Button>
            )}
          </div>
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

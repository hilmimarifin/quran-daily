/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Verse } from '@/hooks/useQuran';
import { addBookmark, getBookmarks, updateBookmark } from '@/actions/bookmarks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Plus, BookOpen } from 'lucide-react';

interface Bookmark {
  id: string;
  name: string;
  surah_number: number;
  verse_number: number;
}

interface BookmarkSheetProps {
  verse: Verse | null;
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
}

type SheetView = 'list' | 'confirm' | 'new';

export function BookmarkSheet({ verse, isOpen, onClose, chapterId }: BookmarkSheetProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [view, setView] = useState<SheetView>('list');
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [newName, setNewName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const verseNumber = verse ? parseInt(verse.verse_key.split(':')[1]) : 0;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getBookmarks()
        .then(setBookmarks)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleSelectBookmark = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setView('confirm');
  };

  const handleConfirmUpdate = () => {
    if (!selectedBookmark || !verse) return;

    startTransition(async () => {
      try {
        await updateBookmark(selectedBookmark.id, {
          surah_number: chapterId,
          verse_number: verseNumber,
        });
        onClose();
      } catch (error) {
        console.error(error);
        alert('Failed to update bookmark');
      }
    });
  };

  const handleCreateNew = () => {
    if (!verse) return;

    startTransition(async () => {
      try {
        await addBookmark({
          name: newName,
          surah_number: chapterId,
          verse_number: verseNumber,
        });
        onClose();
      } catch (error) {
        console.error(error);
        alert('Failed to create bookmark');
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh] overflow-y-auto px-0">
        {view === 'list' && (
          <>
            <SheetHeader className="bg-primary px-4 ">
              <SheetTitle className="text-background bg-primary">Perbaharui Hanca</SheetTitle>
              <SheetDescription className="text-background bg-primary">
                Pilih hanca untuk {verse?.verse_key}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2 px-4">
              {isLoading ? (
                // Loading skeletons
                <>
                  {[1, 2].map((i) => (
                    <Card key={i} className="border-none p-3">
                      <CardContent className="px-3 flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada hanca. Buat hanca pertama!
                </p>
              ) : (
                bookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors p-3"
                    onClick={() => handleSelectBookmark(bookmark)}
                  >
                    <CardContent className="px-3 flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{bookmark.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Surah {bookmark.surah_number}: {bookmark.verse_number}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <SheetFooter>
              <Button onClick={() => setView('new')} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Buat Hanca Baru
              </Button>
            </SheetFooter>
          </>
        )}

        {view === 'confirm' && selectedBookmark && (
          <>
            <SheetHeader className="bg-primary px-4 ">
              <SheetTitle className="text-background bg-primary">Konfirmasi pembaruan</SheetTitle>
              <SheetDescription className="text-background bg-primary">
                Perbarui hanca `{selectedBookmark.name}` ke ayat baru?
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Sebelumnya</span>
                <span className="font-medium">
                  Surah {selectedBookmark.surah_number}, Ayat {selectedBookmark.verse_number}
                </span>
              </div>
              <div className="flex justify-center">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm text-muted-foreground">Baru</span>
                <span className="font-medium text-primary">
                  Surah {chapterId}, Ayat {verseNumber}
                </span>
              </div>
            </div>
            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setView('list')} className="flex-1">
                Kembali
              </Button>
              <Button onClick={handleConfirmUpdate} disabled={isPending} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {isPending ? 'Updating...' : 'Confirm'}
              </Button>
            </SheetFooter>
          </>
        )}

        {view === 'new' && (
          <>
            <SheetHeader className="bg-primary px-4 ">
              <SheetTitle className="text-background bg-primary">Hanca Baru</SheetTitle>
              <SheetDescription className="text-background bg-primary">
                Buat hanca baru untuk {verse?.verse_key}</SheetDescription>
            </SheetHeader>
            <div className="py-4 px-4">
              <div className="">
                <Label htmlFor="name" className="text-right mb-2">
                  Nama hanca
                </Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setView('list')} className="flex-1">
                Kembali
              </Button>
              <Button onClick={handleCreateNew} disabled={isPending || !newName} className="flex-1">
                {isPending ? 'Membuat...' : 'Buat'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

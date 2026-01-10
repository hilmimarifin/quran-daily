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
  const [newName, setNewName] = useState('Daily Reading');
  const [isPending, startTransition] = useTransition();

  const verseNumber = verse ? parseInt(verse.verse_key.split(':')[1]) : 0;

  useEffect(() => {
    if (isOpen) {
      getBookmarks().then(setBookmarks);
      // setView('list');
      // setSelectedBookmark(null);
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
      <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh] overflow-y-auto">
        {view === 'list' && (
          <>
            <SheetHeader>
              <SheetTitle>Update Bookmark</SheetTitle>
              <SheetDescription>Select a bookmark to update to {verse?.verse_key}</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-2">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bookmarks yet. Create your first one!
                </p>
              ) : (
                bookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectBookmark(bookmark)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{bookmark.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Surah {bookmark.surah_number}, Verse {bookmark.verse_number}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setView('new')} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Bookmark
              </Button>
            </SheetFooter>
          </>
        )}

        {view === 'confirm' && selectedBookmark && (
          <>
            <SheetHeader>
              <SheetTitle>Confirm Update</SheetTitle>
              <SheetDescription>
                Update `${selectedBookmark.name}` to the new position?
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Previous</span>
                <span className="font-medium">
                  Surah {selectedBookmark.surah_number}, Verse {selectedBookmark.verse_number}
                </span>
              </div>
              <div className="flex justify-center">
                <span className="text-muted-foreground">↓</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm text-muted-foreground">New</span>
                <span className="font-medium text-primary">
                  Surah {chapterId}, Verse {verseNumber}
                </span>
              </div>
            </div>
            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setView('list')} className="flex-1">
                Back
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
            <SheetHeader>
              <SheetTitle>New Bookmark</SheetTitle>
              <SheetDescription>Create a new bookmark at {verse?.verse_key}</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
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
                Back
              </Button>
              <Button onClick={handleCreateNew} disabled={isPending} className="flex-1">
                {isPending ? 'Creating...' : 'Create Bookmark'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

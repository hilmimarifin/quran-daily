'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Users } from 'lucide-react';
import { deleteBookmark, renameBookmark } from '@/actions/bookmarks';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Bookmark {
  id: string;
  name: string;
  surah_number: number;
  verse_number: number;
  groupCount?: number;
}

export function BookmarkList({ bookmarks }: { bookmarks: Bookmark[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editName, setEditName] = useState('');

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    startTransition(async () => {
      try {
        await deleteBookmark(id);
      } catch (error) {
        console.error(error);
        alert('Failed to delete bookmark');
      }
    });
  };

  const handleEdit = (b: Bookmark, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBookmark(b);
    setEditName(b.name);
  };

  const handleSaveEdit = () => {
    if (!editingBookmark) return;

    startTransition(async () => {
      try {
        await renameBookmark(editingBookmark.id, editName);
        setEditingBookmark(null);
      } catch (error) {
        console.error(error);
        alert('Failed to rename bookmark');
      }
    });
  };

  const handleNavigate = (b: Bookmark) => {
    router.push(`/read/?surah=${b.surah_number}&verse=${b.verse_number}&bookmark=${b.name}`);
  };

  if (bookmarks.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No bookmarks yet.</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {bookmarks.map((b) => (
          <Card
            key={b.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleNavigate(b)}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{b.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => handleEdit(b, e)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(b.id, e)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Surah {b.surah_number}, Verse {b.verse_number}
              </p>
              {b.groupCount !== undefined && b.groupCount > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>
                    Used in {b.groupCount} group{b.groupCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Bookmark</DialogTitle>
            <DialogDescription>Enter a new name for this bookmark.</DialogDescription>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Bookmark name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBookmark(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

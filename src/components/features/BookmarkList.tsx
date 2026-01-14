'use client';

import { deleteBookmark, renameBookmark } from '@/actions/bookmarks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useChapters } from '@/hooks/useQuran';
import { getChapterName } from '@/lib/utils';
import { Pencil, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

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
  const { data: chaptersData } = useChapters();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Anda yakin ingin menghapus hanca ini?')) return;

    startTransition(async () => {
      try {
        await deleteBookmark(id);
        toast.success('Hanca berhasil dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus hanca');
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
        toast.success('Nama hanca berhasil diubah');
        setEditingBookmark(null);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengubah nama hanca');
      }
    });
  };

  const handleNavigate = (b: Bookmark) => {
    router.push(`/read/?surah=${b.surah_number}&verse=${b.verse_number}&bookmark=${b.name}`);
  };

  if (bookmarks.length === 0) {
    return <div className="text-center text-muted-foreground py-10">Belum ada hanca.</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {bookmarks.map((b) => (
          <Card
            key={b.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors p-3 "
            onClick={() => handleNavigate(b)}
          >
            <div className="flex flex-col space-y-0">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div className="text-base font-medium">{b.name}</div>
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
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  QS. {getChapterName(b.surah_number, chaptersData)} ayat {b.verse_number}
                </p>
                {b.groupCount !== undefined && b.groupCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      Digunakan dalam {b.groupCount} group{b.groupCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Nama Hanca</DialogTitle>
            <DialogDescription>Masukkan nama hanca baru</DialogDescription>
          </DialogHeader>
          <div className="px-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nama hanca"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBookmark(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { BookOpen, LogOut, Trash2 } from 'lucide-react';
import { setActiveBookmarkForGroup, leaveGroup, deleteGroup } from '@/actions/groups';
import { useRouter } from 'next/navigation';
import { getChapterName } from '@/lib/utils';
import { useChapters } from '@/hooks/useQuran';
import { toast } from 'sonner';

interface Member {
  id: string;
  user_id: string;
  role: string;
  current_bookmark_id: string | null;
  progress: number;
  bookmark: {
    id: string;
    name: string;
    surah_number: number;
    verse_number: number;
  } | null;
  profile:
    | {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null
    | undefined;
}

interface Group {
  id: string;
  name: string;
  members: Member[];
  currentUserRole: string;
  currentUserId: string;
}

interface Bookmark {
  id: string;
  name: string;
  surah_number: number;
  verse_number: number;
}

export function GroupDetailClient({ group, bookmarks }: { group: Group; bookmarks: Bookmark[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const isAdmin = group.currentUserRole === 'admin';
  const { data: chaptersData } = useChapters();

  // Find current user's membership
  const currentUserMember = group.members.find((m) => m.user_id === group.currentUserId);
  const currentUserRank = group.members.findIndex((m) => m.user_id === group.currentUserId) + 1;

  // For members: show top 3 + self (if not in top 3)
  // For admins: show all
  const displayedMembers = isAdmin ? group.members : group.members.slice(0, 3);

  const showSelfRanking = !isAdmin && currentUserRank > 3 && currentUserMember;

  const handleSetBookmark = (bookmarkId: string) => {
    startTransition(async () => {
      try {
        await setActiveBookmarkForGroup(group.id, bookmarkId);
        toast.success('Hanca berhasil dipilih');
        setIsBookmarkDialogOpen(false);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengatur hanca');
      }
    });
  };

  const handleLeaveGroup = () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    startTransition(async () => {
      try {
        await leaveGroup(group.id);
        toast.success('Berhasil keluar dari grup');
        router.push('/groups');
      } catch (error) {
        console.error(error);
        toast.error('Gagal keluar dari grup');
      }
    });
  };

  const handleDeleteGroup = () => {
    if (!confirm('Anda yakin ingin menghapus grup ini? Tindakan ini tidak dapat dibatalkan.')) return;

    startTransition(async () => {
      try {
        await deleteGroup(group.id);
        toast.success('Grup berhasil dihapus');
        router.push('/groups');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus grup');
      }
    });
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <header className="py-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground text-sm">
            {group.members.length} Anggota • {isAdmin ? 'Admin' : 'Member'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">ID: {group.id.slice(0, 8)}...</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => {
                navigator.clipboard.writeText(group.id);
                toast.success('ID Grup disalin!');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsBookmarkDialogOpen(true)}>
            <BookOpen className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDeleteGroup} 
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {!isAdmin && (
            <Button variant="outline" size="icon" onClick={handleLeaveGroup} disabled={isPending}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Current Bookmark Info */}
      {currentUserMember?.bookmark && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Hanca yang dipakai:</div>
              <div className="text-xs text-muted-foreground">
                {currentUserMember.bookmark.name} - Qs.{getChapterName(currentUserMember.bookmark.surah_number, chaptersData)} Ayat
                {currentUserMember.bookmark.verse_number}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <div className="grid gap-3">
          {displayedMembers.map((member, index) => (
            <Card
              key={member.id}
              className={`border-none ${index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-card'}`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="font-bold text-xl w-6 text-center text-muted-foreground">
                  #{index + 1}
                </div>
                <Avatar>
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback>{member.profile?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {member.profile?.display_name || 'Unknown User'}
                    {member.user_id === group.currentUserId && (
                      <span className="ml-2 text-xs text-primary">(You)</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.progress > 0 ? `${member.progress} pts` : 'No progress yet'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Show self ranking if not in top 3 */}
          {showSelfRanking && currentUserMember && (
            <>
              <div className="text-center text-muted-foreground text-sm py-2">• • •</div>
              <Card className="border-none bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="font-bold text-xl w-6 text-center text-muted-foreground">
                    #{currentUserRank}
                  </div>
                  <Avatar>
                    <AvatarImage src={currentUserMember.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {currentUserMember.profile?.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">
                      {currentUserMember.profile?.display_name || 'Unknown User'}
                      <span className="ml-2 text-xs text-primary">(You)</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentUserMember.bookmark
                        ? `S${currentUserMember.bookmark.surah_number}:V${currentUserMember.bookmark.verse_number}`
                        : 'No progress yet'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* All Members (Admin only) */}
      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">All Members</h2>
          <div className="space-y-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <span className="font-medium">
                    {member.profile?.display_name || 'Unknown User'}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    ({member.role})
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.bookmark
                    ? `S${member.bookmark.surah_number}:V${member.bookmark.verse_number}`
                    : '-'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Set Bookmark Dialog */}
      <Dialog open={isBookmarkDialogOpen} onOpenChange={setIsBookmarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Hanca</DialogTitle>
            <DialogDescription>
              Pilih hanca yang akan digunakan untuk grup ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-4 space-y-2 max-h-60 overflow-y-auto">
            {bookmarks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada hanca yang tersedia. Yuk buat hanca terlebih dahulu!
              </p>
            ) : (
              bookmarks.map((b) => (
                <Card
                  key={b.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    currentUserMember?.current_bookmark_id === b.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSetBookmark(b.id)}
                >
                  <CardContent className="flex items-center gap-3">
                    <BookOpen className="w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{b.name}</div>
                      <div className="text-xs text-muted-foreground">
                        QS. {getChapterName(b.surah_number, chaptersData)} ayat {b.verse_number}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookmarkDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

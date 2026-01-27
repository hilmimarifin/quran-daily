'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LogOut, Trash2, CircleAlert, Crown, Loader2, Share2, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  setActiveBookmarkForGroup,
  leaveGroup,
  deleteGroup,
  fetchGroupRankings,
  Ranking,
} from '@/lib/api/groups';
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
  juz_number?: number;
  verse_position_in_juz?: number;
  total_verses_in_juz?: number;
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
  group_code: string | null;
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
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'all'>('all');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const isAdmin = group.currentUserRole === 'admin';
  const { data: chaptersData } = useChapters();

  // Fetch rankings when period changes
  useEffect(() => {
    const loadRankings = async () => {
      setIsLoadingRankings(true);
      try {
        const data = await fetchGroupRankings(group.id, leaderboardPeriod);
        setRankings(data);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
        toast.error('Gagal memuat leaderboard');
      } finally {
        setIsLoadingRankings(false);
      }
    };
    loadRankings();
  }, [group.id, leaderboardPeriod]);

  // Create a map of rankings by userId for quick lookup
  const rankingsMap = new Map(rankings.map((r) => [r.userId, r]));

  // Get members sorted by period-specific progress
  const sortedMembers = [...group.members].sort((a, b) => {
    const aProgress = rankingsMap.get(a.user_id)?.progress || 0;
    const bProgress = rankingsMap.get(b.user_id)?.progress || 0;
    return bProgress - aProgress;
  });

  // Find current user's membership
  const currentUserMember = sortedMembers.find((m) => m.user_id === group.currentUserId);
  const currentUserRank = sortedMembers.findIndex((m) => m.user_id === group.currentUserId) + 1;

  // For members: show top 3 + self (if not in top 3)
  // For admins: show all
  const displayedMembers = isAdmin ? sortedMembers : sortedMembers.slice(0, 3);

  const showSelfRanking = !isAdmin && currentUserRank > 3 && currentUserMember;

  const handleSetBookmark = (bookmarkId: string) => {
    startTransition(async () => {
      try {
        await setActiveBookmarkForGroup(group.id, bookmarkId);
        toast.success('Hanca berhasil dipilih');
        setIsBookmarkDialogOpen(false);
        router.refresh();
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
    if (!confirm('Anda yakin ingin menghapus grup ini? Tindakan ini tidak dapat dibatalkan.'))
      return;

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
          {group.group_code && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                <span className="text-sm font-mono font-semibold tracking-wider">
                  {group.group_code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(group.group_code!);
                    toast.success('Kode grup disalin!');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/groups/join/${group.group_code}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link undangan disalin!');
                }}
              >
                <Share2 className="h-3 w-3" />
                Bagikan
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="icon" onClick={() => setIsBookmarkDialogOpen(true)}>
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
      {currentUserMember?.bookmark ? (
        <Card className="bg-green-50 border-green-100">
          <CardContent className="px-3 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Hanca yang dipakai:</div>
              <div className="text-xs text-muted-foreground">
                {currentUserMember.bookmark.name} - QS.
                {getChapterName(currentUserMember.bookmark.surah_number, chaptersData)} Ayat{' '}
                {currentUserMember.bookmark.verse_number}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="bg-red-50 border-red-100 cursor-pointer"
          onClick={() => setIsBookmarkDialogOpen(true)}
        >
          <CardContent className="px-3 flex items-center gap-3">
            <CircleAlert className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">
                Belum ada hanca yang dipilih untuk grup ini!
              </div>
              <div className="text-xs text-muted-foreground">Klik di sini untuk memilih hanca</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          <Tabs
            value={leaderboardPeriod}
            onValueChange={(v) => setLeaderboardPeriod(v as 'weekly' | 'monthly' | 'all')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="weekly" className="text-xs px-2">
                Minggu
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2">
                Bulan
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2">
                Semua
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoadingRankings ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3">
            {displayedMembers.map((member, index) => {
              const memberRanking = rankingsMap.get(member.user_id);
              const periodProgress = memberRanking?.progress || 0;
              return (
                <Card
                  key={member.id}
                  className={`${index === 0 && periodProgress > 0 ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-card border-none'}`}
                >
                  <CardContent className="p-4 flex items-center gap-4 ">
                    <div className="font-bold text-xl w-6 text-center text-muted-foreground">
                      #{index + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>{member.profile?.display_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {member.profile?.display_name || 'Unknown User'}
                        {member.user_id === group.currentUserId && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                        {index === 0 && periodProgress > 0 && (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {periodProgress > 0 ? `${periodProgress} pts` : 'No progress yet'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

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
                        {rankingsMap.get(currentUserMember.user_id)?.progress || 0} pts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </section>

      {/* All Members (Admin only) */}
      {/* {isAdmin && ( */}
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
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium">
                    {member.profile?.display_name || 'Unknown User'}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    ({member.role})
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.bookmark
                    ? `QS. ${getChapterName(member.bookmark.surah_number, chaptersData)} ayat ${member.bookmark.verse_number}`
                    : '-'}
                </div>

                {member.juz_number &&
                  member.verse_position_in_juz &&
                  member.total_verses_in_juz &&
                  (() => {
                    const percentage = Math.round(
                      (member.verse_position_in_juz / member.total_verses_in_juz) * 100
                    );
                    const getProgressColor = (pct: number) => {
                      if (pct < 25) return 'bg-gradient-to-r from-rose-500 to-orange-400';
                      if (pct < 50) return 'bg-gradient-to-r from-orange-400 to-amber-400';
                      if (pct < 75) return 'bg-gradient-to-r from-amber-400 to-emerald-400';
                      return 'bg-gradient-to-r from-emerald-400 to-teal-500';
                    };
                    return (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Juz {member.juz_number}</span>
                          <span className="ml-auto font-semibold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {percentage}%
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-1 bg-muted/50"
                          indicatorClassName={getProgressColor(percentage)}
                        />
                      </div>
                    );
                  })()}
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* )} */}

      {/* Set Bookmark Dialog */}
      <Dialog open={isBookmarkDialogOpen} onOpenChange={setIsBookmarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Hanca</DialogTitle>
            <DialogDescription>Pilih hanca yang akan digunakan untuk grup ini.</DialogDescription>
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
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setIsBookmarkDialogOpen(false)}
            >
              {isPending ? 'Menyimpan...' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

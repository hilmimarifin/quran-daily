'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from '@/lib/api/profile';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string | undefined;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const { signOut } = useAuthStore();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateProfile({ displayName });
        toast.success('Profil berhasil diperbarui!');
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error('Gagal memperbarui profil');
      }
    });
  };
  const handleSyncAvatar = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/profile/sync-avatar', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sync avatar');
      }
      toast.success('Avatar berhasil disinkronkan!');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyinkronkan avatar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manajemen informasi profil publik Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {displayName?.[0] || email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <button onClick={handleSyncAvatar} disabled={isSyncing}>
            <span className="flex flex-row items-center gap-2">
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Avatar'}</span>
            </span>
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            placeholder="Nama Lengkap"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled className="bg-muted" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
        <Button onClick={handleSignOut} disabled={isPending} variant="destructive">
          {isPending ? 'Keluar...' : 'Keluar'}
        </Button>
      </CardFooter>
    </Card>
  );
}

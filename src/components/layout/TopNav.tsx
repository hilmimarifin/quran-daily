'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, LogOut, RefreshCw } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export function TopNav() {
  const { user, signOut, checkUser } = useAuthStore();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
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
 
  if (pathname === '/read') {
    return null;
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary">
            <Image
              src="/logo/logo4.png"
              alt="HancaQu Logo"
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
          </div>
          HancaQu
        </Link>

        {/* {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ''} />
                  <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.user_metadata.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSyncAvatar} disabled={isSyncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Avatar'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        )} */}
      </div>
    </header>
  );
}


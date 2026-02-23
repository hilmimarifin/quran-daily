'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Bookmark, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const { user, checkUser } = useAuthStore();

  const navItems = [
    {
      label: 'Baca',
      href: '/',
      icon: BookOpen,
    },
    {
      label: 'Hanca',
      href: '/bookmarks',
      icon: Bookmark,
    },
    {
      label: 'Grup',
      href: '/groups',
      icon: Users,
    },
    {
      label: 'Profil',
      href: '/profile',
      icon: User,
    },
  ];
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-primary pb-1 pt-1">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-xs font-light transition-colors',
                isActive ? 'text-background' : 'text-background hover:text-muted-background'
              )}
            >
              {user && item.href === '/profile' ? (
                <Avatar className="h-6 w-6 rounded-full">
                  <AvatarImage src={user?.user_metadata.avatar_url} alt={user?.email || ''} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : (
                <item.icon
                  strokeWidth={1.5}
                  className={cn('h-6 w-6', isActive && 'fill-current')}
                />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

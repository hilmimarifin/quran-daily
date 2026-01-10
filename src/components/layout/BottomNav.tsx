'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Bookmark, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Read',
      href: '/',
      icon: BookOpen,
    },
    {
      label: 'Bookmarks',
      href: '/bookmarks',
      icon: Bookmark,
    },
    {
      label: 'Groups',
      href: '/groups',
      icon: Users,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe pt-2">
      <div className="flex items-center justify-around pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-6 w-6', isActive && 'fill-current')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { getGroupDetails } from '@/actions/groups';
import { getBookmarks } from '@/actions/bookmarks';
import { notFound } from 'next/navigation';
import { GroupDetailClient } from '@/components/features/GroupDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [group, bookmarks] = await Promise.all([
    getGroupDetails(id),
    getBookmarks(),
  ]);

  if (!group) {
    notFound();
  }

  return (
    <GroupDetailClient 
      group={group} 
      bookmarks={bookmarks}
    />
  );
}

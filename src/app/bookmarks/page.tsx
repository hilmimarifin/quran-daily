import { getBookmarks } from '@/actions/bookmarks';
import { BookmarkList } from '@/components/features/BookmarkList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Suspense } from 'react';

async function BookmarkListContainer() {
  const bookmarks = await getBookmarks();
  return <BookmarkList bookmarks={bookmarks} />;
}

export default function BookmarksPage() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-4 pb-24">
      <header className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <Button size="icon" variant="ghost">
          <Plus className="h-6 w-6" />
        </Button>
      </header>
      <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Loading bookmarks...</div>}>
        <BookmarkListContainer />
      </Suspense>
    </div>
  );
}

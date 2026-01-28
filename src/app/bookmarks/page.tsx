import { getBookmarks } from '@/actions/bookmarks';
import { BookmarkList } from '@/components/features/BookmarkList';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();

  return (
    <div className="container max-w-md mx-auto p-4 space-y-4 pb-24">
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          <Bookmark className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Hanca</h1>
        </div>
        {/* <Button size="icon" variant="ghost">
          <Plus className="h-6 w-6" />
        </Button> */}
      </header>
      <BookmarkList bookmarks={bookmarks} />
    </div>
  );
}

import { ReaderClient } from '@/components/features/ReaderClient';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ReaderClient />
    </Suspense>
  );
}

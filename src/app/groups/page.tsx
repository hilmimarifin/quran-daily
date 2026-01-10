import { getGroups } from '@/actions/groups';
import { GroupList } from '@/components/features/GroupList';
import { Suspense } from 'react';

async function GroupListContainer() {
  const groups = await getGroups();
  return <GroupList groups={groups} />;
}

export default function GroupsPage() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-4 pb-24">
      <header className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">Groups</h1>
      </header>
      <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Loading groups...</div>}>
        <GroupListContainer />
      </Suspense>
    </div>
  );
}

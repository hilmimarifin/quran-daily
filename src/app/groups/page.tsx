import { getGroups } from '@/actions/groups';
import { GroupList } from '@/components/features/GroupList';

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div className="container max-w-md mx-auto p-4 space-y-4 pb-24">
      <header className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">Groups</h1>
      </header>
      <GroupList groups={groups} />
    </div>
  );
}

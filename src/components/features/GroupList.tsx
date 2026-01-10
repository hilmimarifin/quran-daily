'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Users, Search } from 'lucide-react';
import { createGroup, joinGroup } from '@/actions/groups';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

export function GroupList({ groups }: { groups: Group[] }) {
  const [isPending, startTransition] = useTransition();
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupId, setJoinGroupId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const handleCreate = () => {
    if (!newGroupName.trim()) return;

    startTransition(async () => {
      try {
        await createGroup(newGroupName);
        setIsCreateOpen(false);
        setNewGroupName('');
      } catch (error) {
        console.error(error);
        alert('Failed to create group');
      }
    });
  };

  const handleJoin = () => {
    if (!joinGroupId.trim()) return;

    startTransition(async () => {
      try {
        await joinGroup(joinGroupId);
        setIsJoinOpen(false);
        setJoinGroupId('');
      } catch (error) {
        console.error(error);
        alert('Failed to join group (ID might be invalid)');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 gap-2">
              <Plus className="h-4 w-4" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 gap-2">
              <Search className="h-4 w-4" /> Join Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Existing Group</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Group ID"
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleJoin} disabled={isPending}>
                {isPending ? 'Joining...' : 'Join'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            You havent joined any groups yet.
          </div>
        ) : (
          groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-medium">{g.name}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="text-sm text-muted-foreground">
                      <p>Members: {g.memberCount}</p>
                      <p>Role: {g.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

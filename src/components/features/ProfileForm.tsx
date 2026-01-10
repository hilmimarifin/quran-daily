'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from '@/actions/profile';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string | undefined;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateProfile({ displayName, avatarUrl });
        alert('Profile updated!');
        router.refresh();
      } catch (error) {
        console.error(error);
        alert('Failed to update profile');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your public profile information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-lg">
              {displayName?.[0] || email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            placeholder="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled className="bg-muted" />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}

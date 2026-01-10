'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: { displayName: string; avatarUrl?: string }) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const profile = await prisma.profile.update({
    where: { id: user.id },
    data: {
      display_name: data.displayName,
      avatar_url: data.avatarUrl,
    },
  });

  revalidatePath('/profile');
  return profile;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  return await prisma.profile.findUnique({
    where: { id: user.id },
  });
}

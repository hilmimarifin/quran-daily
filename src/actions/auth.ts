'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
});

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Ensure profile exists in Prisma/DB
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    await prisma.profile.create({
      data: {
        id: user.id,
        display_name: user.user_metadata.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata.avatar_url,
      },
    });
  }

  return user;
});

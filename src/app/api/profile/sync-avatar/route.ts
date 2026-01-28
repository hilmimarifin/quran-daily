import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

// POST /api/profile/sync-avatar - Sync avatar from Google
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        avatar_url: user.user_metadata.avatar_url,
      },
    });

    revalidatePath('/profile');
    revalidatePath('/groups');
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to sync avatar:', error);
    return NextResponse.json(
      { error: 'Failed to sync avatar' },
      { status: 500 }
    );
  }
}

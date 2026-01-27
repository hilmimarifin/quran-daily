import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/auth';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const user = await getUser();

  // If not logged in, redirect to login with return URL
  if (!user) {
    redirect(`/login?returnTo=/groups/join/${code}`);
  }

  // Normalize code to uppercase
  const normalizedCode = code.toUpperCase().trim();

  // Find group by code
  const group = await prisma.group.findUnique({
    where: { group_code: normalizedCode },
  });

  if (!group || group.deleted_at) {
    // Group not found - redirect to groups page with error state
    redirect('/groups?error=group_not_found');
  }

  // Check if already a member
  const existingMembership = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: group.id,
        user_id: user.id,
      },
    },
  });

  if (existingMembership) {
    // Already a member - redirect to group page
    redirect(`/groups/${group.id}`);
  }

  // Join the group
  await prisma.groupMember.create({
    data: {
      group_id: group.id,
      user_id: user.id,
      role: 'member',
    },
  });

  revalidatePath('/groups');
  revalidatePath(`/groups/${group.id}`);

  // Redirect to the group page
  redirect(`/groups/${group.id}`);
}

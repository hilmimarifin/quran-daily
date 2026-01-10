import { getProfile } from '@/actions/profile';
import { getUser } from '@/actions/auth';
import { ProfileForm } from '@/components/features/ProfileForm';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <ProfileForm profile={profile} email={user.email} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For MVP without real Supabase keys, we might want to simulate login
    // But assuming keys are present:
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else if (data.user) {
      setUser(data.user);
      router.push('/');
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data: _data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to track your Quran reading progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" onClick={handleSignUp} disabled={loading}>
            Create Account
          </Button>
          <div className="text-xs text-center text-muted-foreground mt-2">
            By continuing, you agree to our Terms of Service.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

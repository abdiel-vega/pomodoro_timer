// app/profile/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/form-message';
import { User as UserIcon } from 'lucide-react';

export default function ProfileSetup() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        router.push('/sign-in');
        return;
      }
      
      setUser(data.user);
      
      // Check if username already exists
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.user.id)
        .single();
        
      // If user already has a username, redirect to home
      if (userData?.username) {
        router.push('/');
        return;
      }
      
      setIsLoading(false);
    };
    
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        setError('Username already taken');
        setIsLoading(false);
        return;
      }
      
      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username,
          email: user.email,
          updated_at: new Date().toISOString(),
        });
        
      if (updateError) {
        throw updateError;
      }
      
      router.push('/');
    } catch (err: any) {
      console.error('Error setting up profile:', err);
      setError(err.message || 'Failed to set up profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Choose a username to complete your profile setup
          </CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
                <div className="mb-4">
                    <FormMessage message={{ error }} />
                </div>
            )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <div className="relative">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="pl-8"
                    required
                    autoFocus
                  />
                  <UserIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your username will be visible to other users
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
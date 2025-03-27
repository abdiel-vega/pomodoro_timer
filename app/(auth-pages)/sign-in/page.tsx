// app/(auth-pages)/sign-in/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { FormMessage } from '@/components/form-message';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('Sign-in successful!', data.user);
      
      // Force update UI state immediately
      router.refresh();
      
      // Redirect to protected page
      router.push('/protected');
    } catch (err: any) {
      console.error('Error signing in:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error signing in with Google:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-md">
        <div className="bg-card shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2 text-center text-foreground">Sign in</h1>
          <p className="text-muted-foreground text-center mb-6">
            Enter your credentials to access your account
          </p>
          
          {error && (
            <div className="mb-4">
              <FormMessage message={{ error }} />
            </div>
          )}
          
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-secondary-foreground hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                className="absolute right-0 top-0 h-10 px-3"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            </div>
            
            <Button 
              type="submit" 
              variant={'outline'}
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-2 border-background" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Sign in with Google
          </Button>
          
          <div className="mt-6 text-center text-sm text-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-secondary-foreground hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
/*

reset password page

*/
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  // Check for errors in query params and session status on load
  useEffect(() => {
    const checkSessionAndErrors = async () => {
      try {
        // Check for error in URL parameters
        const errorParam = searchParams?.get('error');
        if (errorParam) {
          setError(decodeURIComponent(errorParam));
        }

        // Check for existing session
        const { data } = await supabase.auth.getSession();
        setHasValidSession(!!data.session);
        
        if (!data.session) {
          console.log('No active session found');
          setError('No active session. Please request a new password reset link.');
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Failed to verify your session. Please try again.');
      }
    };
    
    checkSessionAndErrors();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      // Double-check that we have a valid session
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        setError('Your session has expired. Please request a new password reset link.');
        setIsSubmitting(false);
        return;
      }
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (updateError.message.includes('same password')) {
          setError('You cannot reuse your previous password. Please choose a different one.');
        } else {
          setError(updateError.message);
        }
      } else {
        setSuccess('Password updated successfully! Redirecting to home page...');
        // A longer delay to ensure the success message is seen
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking session
  if (hasValidSession === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Show "No Session" view if no valid session
  if (hasValidSession === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md text-foreground">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              Your password reset session has expired or is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              For security reasons, password reset links are only valid for a limited time.
              Please request a new password reset link to continue.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant={"outline"}>
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <FormMessage message={{ error }} />}
          {success && <FormMessage message={{ success }} />}
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="pr-10"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit"
              variant={"outline"}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
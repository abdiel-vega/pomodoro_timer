/*

reset password page

*/
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { Eye, EyeOff, Link } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);
  const [hasExpiredToken, setHasExpiredToken] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check for hash fragment error on load
  useEffect(() => {
    // Look for hash fragment errors
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('error=access_denied') && hash.includes('otp_expired')) {
        setHasExpiredToken(true);
        setError('Your password reset link has expired. Please request a new one.');
      }
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      // First check if we have a session
      const { data } = await supabase.auth.getSession();
      
      // If we have a valid session, try to update the password
      if (data.session) {
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
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } else {
        setError('No active session. Please request a new password reset link.');
      }
    } catch (err: any) {
      console.error('Error in password reset:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

 // If the token is expired, show a special message with option to request new link
 if (hasExpiredToken) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Password Reset Link Expired</h1>
        <p className="mb-6">The password reset link you clicked has expired. These links are typically valid for a limited time for security reasons.</p>
        
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a New Reset Link</Link>
        </Button>
      </div>
    </div>
  );
}

return (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
    <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
      <p className="text-muted-foreground mb-6">Create a new password for your account</p>
      
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
          className="w-full mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </div>
  </div>
);
}

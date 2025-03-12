/*

reset password page

*/
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { Eye, EyeOff } from "lucide-react";
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
  const router = useRouter();
  const supabase = createClient();

  // Check if user is authenticated and in recovery mode
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          setCanResetPassword(true);
        } else {
          // No valid session - redirect to forgot password
          setError("No active session. Please request a new password reset link.");
          setTimeout(() => {
            router.push('/forgot-password');
          }, 3000);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError("Authentication error. Please try again.");
      }
    };
    
    checkAuthState();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (updateError) {
        // Check if the error is about using the same password
        if (updateError.message.includes('same password')) {
          setError("You cannot reuse your previous password. Please choose a different one.");
        } else {
          setError(updateError.message);
        }
      } else {
        setSuccess("Password updated successfully! Redirecting to home page...");
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(err.message || "An error occurred while resetting your password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a loading state or error if we're checking auth
  if (!canResetPassword && !error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-center">
          <p>Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md p-4 gap-2 mx-auto">
      <h1 className="text-2xl font-medium">Reset your password</h1>
      <p className="text-sm text-foreground/60 mb-4">
        Please enter your new password below.
      </p>
      
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
              placeholder="New password"
              required
              className="pr-10"
              disabled={!canResetPassword || isSubmitting}
            />
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              disabled={!canResetPassword || isSubmitting}
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
              placeholder="Confirm password"
              required
              className="pr-10"
              disabled={!canResetPassword || isSubmitting}
            />
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              disabled={!canResetPassword || isSubmitting}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={!canResetPassword || isSubmitting}
        >
          {isSubmitting ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
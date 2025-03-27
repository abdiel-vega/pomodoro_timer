'use client';

import { useState } from "react";
import { forgotPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPassword() {
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      // Call the server action and get the result
      const result = await forgotPasswordAction(formData);
      setMessage(result);
    } catch (error: any) {
      setMessage({ error: error.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                name="email" 
                id="email"
                placeholder="you@example.com" 
                type="email"
                required 
              />
            </div>
            
            {message && <FormMessage message={message} />}
            
            <Button 
              type="submit" 
              variant={"outline"}
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Remember your password?{" "}
            <Link className="text-secondary-foreground hover:underline" href="/sign-in">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
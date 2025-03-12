'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export function ExpiredTokenHandler() {
  const [hasExpiredToken, setHasExpiredToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the URL contains an expired token error
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('error=access_denied') && hash.includes('otp_expired')) {
        setHasExpiredToken(true);
        
        // Clean up the URL by removing the hash fragment
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, []);

  if (!hasExpiredToken) return null;

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Password Reset Link Expired</CardTitle>
        <CardDescription>
          The password reset link you clicked has expired or is invalid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          For security reasons, password reset links are only valid for a limited time.
          Please request a new password reset link to continue.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request New Reset Link</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
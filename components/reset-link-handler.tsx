'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ResetLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check for auth-related hash fragments in URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      
      // Log for debugging
      if (hash) {
        console.log('Found URL hash:', hash);
      }
      
      // Handle specific error cases
      if (hash.includes('error=access_denied') || 
          hash.includes('error_code=otp_expired') ||
          hash.includes('error_description=Token+has+expired')) {
        
        console.log('Detected expired token in URL');
        
        // Clean the URL by removing the hash
        if (window.history && window.history.replaceState) {
          window.history.replaceState(
            {}, 
            document.title, 
            window.location.pathname + '?error=Your+password+reset+link+has+expired.+Please+request+a+new+one.'
          );
        }
        
        // Force reload to apply the new URL
        router.refresh();
      }
    }
  }, [router]);

  // This component doesn't render anything
  return null;
}
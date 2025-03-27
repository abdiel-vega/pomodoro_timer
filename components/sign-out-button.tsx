'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOutIcon } from 'lucide-react';
import { signOutAction } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SignOutButton() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowConfirmation(true)}
        className='text-foreground hover:text-accent-foreground'
      >
        <LogOutIcon className="mr-2 h-4 w-4 text-foreground hover:text-accent-foreground" /> Sign Out
      </Button>
      
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Out Confirmation</DialogTitle>
            <DialogDescription>
              Do you wish to continue signing out?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                Sign Out
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
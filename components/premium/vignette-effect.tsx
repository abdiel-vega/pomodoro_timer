/*

 A utility component that adds a vignette effect when deep focus mode is active.
 This component doesn't render any UI elements directly but injects the vignette
 effect into the DOM when needed.
 
*/

'use client';

import { useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';

export default function VignetteEffect() {
  const { deepFocusMode, isPremium } = usePomodoroTimer();

  useEffect(() => {
    if (!isPremium) return;
    
    // Create vignette element only when needed
    if (deepFocusMode) {
      let vignette = document.querySelector('.vignette-overlay');
      
      // If it doesn't exist, create it
      if (!vignette) {
        vignette = document.createElement('div');
        vignette.className = 'vignette-overlay';
        document.body.appendChild(vignette);
        
        // Short delay to ensure the transition plays
        setTimeout(() => {
          if (vignette instanceof HTMLElement) {
            vignette.style.opacity = '1';
          }
        }, 10);
      }
    }
    
    return () => {
      // Cleanup when component unmounts or deepFocusMode becomes false
      if (!deepFocusMode) {
        const vignette = document.querySelector('.vignette-overlay');
        if (vignette) {
          // Fade out then remove
          if (vignette instanceof HTMLElement) {
            vignette.style.opacity = '0';
            setTimeout(() => {
              vignette.remove();
            }, 500); // Match the CSS transition duration
          } else {
            vignette.remove();
          }
        }
      }
    };
  }, [deepFocusMode, isPremium]);

  // This component doesn't render anything visible
  return null;
}
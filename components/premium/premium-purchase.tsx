'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';

export default function PremiumPurchase() {
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClient();
  const { refreshUserSettings } = usePomodoroTimer();
  const handlePurchase = async () => {
    setIsProcessing(true);
    
    try {
      // In a real app, you would integrate with Stripe or another payment processor here
      // For now, we'll simulate a successful purchase
      
      // Update the user's premium status in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be signed in to purchase premium features');
        return;
      }
      
      // Update the user record
      const { error } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_purchased_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh user settings to get the premium status
      await refreshUserSettings();
      
      toast.success('Premium features unlocked! Enjoy your enhanced Pomodoro experience.');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to process purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Upgrade to Premium
        </CardTitle>
        <CardDescription>
          Unlock all premium features with a one-time purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-2xl font-bold">$7.99</p>
          <p className="text-sm text-muted-foreground">One-time payment, no subscriptions</p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Animated focus visualizations</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Built-in ambient sounds (rainfall, coffee shop, forest)</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Focus music integration (lo-fi, classical, nature sounds)</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>"Deep focus" mode that dims everything except the timer</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Productivity analytics with heatmaps and insights</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Focus score tracking and trends</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handlePurchase}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Purchase Premium ($7.99)"}
        </Button>
      </CardFooter>
    </Card>
  );
}
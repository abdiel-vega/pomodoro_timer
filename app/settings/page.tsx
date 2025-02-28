/*

settings page

*/
import Settings from '@/components/pomodoro/settings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Timer Settings</h1>
      <Settings />
    </div>
  );
}
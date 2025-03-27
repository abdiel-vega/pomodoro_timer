/*

form message component

*/
import { AlertCircle, CheckCircle2 } from "lucide-react";

export type Message = Record<string, string> & {
  message?: string;
  error?: string;
  success?: string;
};

export function FormMessage({ message }: { message: Message }) {
  if (!message || Object.keys(message).length === 0) {
    return null;
  }

  if ("error" in message) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-accent-foreground">
        <AlertCircle className="h-4 w-4" />
        <p>{message.error}</p>
      </div>
    );
  }

  if ("success" in message) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-accent-foreground">
        <CheckCircle2 className="h-4 w-4" />
        <p>{message.success}</p>
      </div>
    );
  }

  if ("message" in message) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-primary/15 p-3 text-sm text-primary">
        <CheckCircle2 className="h-4 w-4" />
        <p>{message.message}</p>
      </div>
    );
  }

  return null;
}
import { Button } from "@/components/ui/button";
import { useGoogleCalendar } from "@/hooks";
import { SignInButton, SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { Calendar, LogIn } from "lucide-react";
import { FC, useState } from "react";
import { toast } from "sonner";

const GoogleCalendarSync: FC = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { hasGoogleConnected } = useGoogleCalendar();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      window.location.href = `https://accounts.clerk.dev/oauth_connect?provider=oauth_google&redirect_url=${encodeURIComponent(
        "https://just-deer-14.clerk.accounts.dev/v1/oauth_callback"
      )}`;
    } catch (error) {
      console.error("Failed to connect Google Calendar:", error);
      toast.error("Failed to connect Google Calendar");
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Calendar sync</span>
        <SignInButton mode="modal">
          <Button
            variant="ghost"
            size="sm"
            className="px-2 h-7 text-xs text-neutral-400 border cursor-pointer hover:text-neutral-200"
          >
            <LogIn size={12} className="mr-1.5" />
            Sign in
          </Button>
        </SignInButton>
      </div>
    );
  }

  if (!hasGoogleConnected()) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Calendar sync</span>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 h-7 text-xs text-neutral-400 border cursor-pointer hover:text-neutral-200"
          onClick={handleConnect}
          disabled={isLoading}
        >
          <Calendar size={12} className="mr-1.5" />
          Connect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
        <span className="text-xs text-neutral-400">Calendar connected</span>
      </div>
      <SignOutButton>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 h-7 border text-xs cursor-pointer text-neutral-400 hover:text-neutral-200"
        >
          Disconnect
        </Button>
      </SignOutButton>
    </div>
  );
};

export default GoogleCalendarSync;

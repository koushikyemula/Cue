import { Button } from "@/components/ui/button";
import { useGoogleCalendar } from "@/hooks";
import { SignInButton, SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { CalendarPlus, LogIn, LogOut } from "lucide-react";
import { FC, useState } from "react";
import { toast } from "sonner";

interface GoogleCalendarSyncProps {
  className?: string;
  variant?: "default" | "minimal";
}

const GoogleCalendarSync: FC<GoogleCalendarSyncProps> = ({
  className = "",
  variant = "default",
}) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { hasGoogleConnected } = useGoogleCalendar();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Use OAuth2 to connect to Google Calendar with the correct redirect URI
      window.location.href = `https://accounts.clerk.dev/oauth_connect?provider=oauth_google&redirect_url=${encodeURIComponent(
        "https://just-deer-14.clerk.accounts.dev/v1/oauth_callback"
      )}`;
    } catch (error) {
      console.error("Failed to connect Google Calendar:", error);
      toast.error("Failed to connect Google Calendar", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className={`flex flex-col items-start gap-2 ${className}`}>
        {variant === "default" && (
          <p className="text-xs text-muted-foreground">
            Sign in to sync tasks with Google Calendar
          </p>
        )}
        <SignInButton mode="modal">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-normal text-neutral-300 hover:text-foreground hover:bg-accent/30"
          >
            <LogIn size={14} />
            Sign in
          </Button>
        </SignInButton>
      </div>
    );
  }

  if (!hasGoogleConnected()) {
    return (
      <div className={`flex flex-col items-start gap-2 ${className}`}>
        {variant === "default" && (
          <p className="text-xs text-muted-foreground">
            Connect Google Calendar to sync tasks
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-normal text-neutral-300 hover:text-foreground hover:bg-accent/30"
          onClick={handleConnect}
          disabled={isLoading}
        >
          <CalendarPlus size={14} />
          Connect Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      {variant === "default" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Google Calendar connected
        </p>
      )}
      <SignOutButton>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-normal text-neutral-300 hover:text-foreground hover:bg-accent/30"
        >
          <LogOut size={14} />
          Disconnect
        </Button>
      </SignOutButton>
    </div>
  );
};

export default GoogleCalendarSync;

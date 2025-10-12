import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { useState } from "react";

interface ProfileCompletionBannerProps {
  onComplete: () => void;
}

const ProfileCompletionBanner = ({ onComplete }: ProfileCompletionBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <span className="font-semibold">Complete your profile</span> to get personalized AI health suggestions and track your progress effectively
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onComplete} size="sm" variant="default">
            Complete Profile
          </Button>
          <Button onClick={() => setDismissed(true)} size="sm" variant="ghost" className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompletionBanner;

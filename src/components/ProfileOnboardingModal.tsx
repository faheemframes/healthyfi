import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

interface ProfileOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

const ProfileOnboardingModal = ({ open, onComplete, userId }: ProfileOnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    height_cm: "",
    weight_kg: "",
    age: "",
    gender: "",
    activity_level: "",
    goal: "",
    daily_calorie_goal: "",
    daily_water_goal_ml: "2500",
  });

  const handleNext = () => {
    if (step === 1) {
      if (!profile.height_cm || !profile.weight_kg || !profile.age || !profile.gender) {
        toast({
          title: "Missing Information",
          description: "Please fill in all basic information",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!profile.activity_level || !profile.goal) {
      toast({
        title: "Missing Information",
        description: "Please select activity level and goal",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Exclude BMI from upsert since it's a generated column
      const profileData = {
        user_id: userId,
        height_cm: parseInt(profile.height_cm),
        weight_kg: parseFloat(profile.weight_kg),
        age: parseInt(profile.age),
        gender: profile.gender,
        activity_level: profile.activity_level,
        goal: profile.goal,
        daily_calorie_goal: profile.daily_calorie_goal ? parseInt(profile.daily_calorie_goal) : null,
        daily_water_goal_ml: parseInt(profile.daily_water_goal_ml),
      };

      const { error } = await supabase.from("user_profiles").upsert(profileData, { onConflict: 'user_id' });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Database error:", error);
        }
        throw error;
      }

      toast({
        title: "Welcome! 🎉",
        description: "Your profile has been set up successfully!",
      });
      onComplete();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error saving profile:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please check all fields are filled correctly.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onComplete()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to NutriDash!
          </DialogTitle>
          <DialogDescription>
            Let's personalize your experience with a quick setup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`h-2 w-20 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-secondary'}`} />
            <div className={`h-2 w-20 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`} />
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={profile.weight_kg}
                    onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full">Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Your Goals</h3>
              
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={profile.activity_level} onValueChange={(value) => setProfile({ ...profile, activity_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                    <SelectItem value="lightly_active">Lightly Active (1-3 days/week)</SelectItem>
                    <SelectItem value="moderately_active">Moderately Active (3-5 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
                    <SelectItem value="extremely_active">Extremely Active (athlete/intense daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Health Goal</Label>
                <Select value={profile.goal} onValueChange={(value) => setProfile({ ...profile, goal: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose_weight">Lose Weight</SelectItem>
                <SelectItem value="maintain">Maintain Weight</SelectItem>
                <SelectItem value="gain_weight">Gain Weight</SelectItem>
                <SelectItem value="build_muscle">Build Muscle</SelectItem>
              </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calorie-goal">Daily Calories (optional)</Label>
                  <Input
                    id="calorie-goal"
                    type="number"
                    placeholder="2000"
                    value={profile.daily_calorie_goal}
                    onChange={(e) => setProfile({ ...profile, daily_calorie_goal: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="water-goal">Daily Water (ml)</Label>
                  <Input
                    id="water-goal"
                    type="number"
                    placeholder="2500"
                    value={profile.daily_water_goal_ml}
                    onChange={(e) => setProfile({ ...profile, daily_water_goal_ml: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileOnboardingModal;

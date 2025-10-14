import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Scale, Ruler, Target, Activity, Bell } from "lucide-react";

interface UserProfileProps {
  userId: string;
  onProfileUpdated?: () => void;
}

interface UserProfileData {
  id?: string;
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: string | null;
  activity_level: string | null;
  goal: string | null;
  daily_calorie_goal: number | null;
  daily_water_goal_ml: number;
}

const UserProfile = ({ userId, onProfileUpdated }: UserProfileProps) => {
  const [profile, setProfile] = useState<UserProfileData>({
    user_id: userId,
    height_cm: null,
    weight_kg: null,
    age: null,
    gender: null,
    activity_level: null,
    goal: null,
    daily_calorie_goal: null,
    daily_water_goal_ml: 2500,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculate BMI
  const calculateBMI = () => {
    if (profile.height_cm && profile.weight_kg) {
      return (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1);
    }
    return null;
  };

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25) return { category: "Normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30) return { category: "Overweight", color: "bg-yellow-100 text-yellow-800" };
    return { category: "Obese", color: "bg-red-100 text-red-800" };
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Handle both old schema (goal_type) and new schema (goal)
        const normalizedData: any = {
          ...data,
          goal: (data as any).goal || (data as any).goal_type || null
        };
        setProfile(normalizedData);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Exclude BMI from upsert since it's a generated column
      const { bmi, ...profileToSave } = profile as any;
      
      const { error } = await supabase
        .from("user_profiles")
        .upsert(profileToSave, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      onProfileUpdated?.();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          Set up your profile to get personalized health recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BMI Display */}
        {bmi && (
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{bmi}</div>
                <div className="text-sm text-muted-foreground">BMI</div>
              </div>
            </div>
            {bmiCategory && (
              <Badge className={bmiCategory.color}>
                {bmiCategory.category}
              </Badge>
            )}
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="170"
              value={profile.height_cm || ""}
              onChange={(e) => setProfile({ ...profile, height_cm: parseInt(e.target.value) || null })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70.0"
              value={profile.weight_kg || ""}
              onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) || null })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={profile.age || ""}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender || ""}
              onValueChange={(value) => setProfile({ ...profile, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity Level */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Level
          </Label>
          <Select
            value={profile.activity_level || ""}
            onValueChange={(value) => setProfile({ ...profile, activity_level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select activity level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
              <SelectItem value="lightly_active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
              <SelectItem value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</SelectItem>
              <SelectItem value="very_active">Very Active (hard exercise 6-7 days/week)</SelectItem>
              <SelectItem value="extremely_active">Extremely Active (very hard exercise & physical job)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Health Goal
          </Label>
          <Select
            value={profile.goal || ""}
            onValueChange={(value) => setProfile({ ...profile, goal: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose_weight">Lose Weight</SelectItem>
              <SelectItem value="maintain">Maintain Weight</SelectItem>
              <SelectItem value="gain_weight">Gain Weight</SelectItem>
              <SelectItem value="build_muscle">Build Muscle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Daily Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calorie-goal">Daily Calorie Goal (optional)</Label>
            <Input
              id="calorie-goal"
              type="number"
              placeholder="2000"
              value={profile.daily_calorie_goal || ""}
              onChange={(e) => setProfile({ ...profile, daily_calorie_goal: parseInt(e.target.value) || null })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="water-goal">Daily Water Goal (ml)</Label>
            <Input
              id="water-goal"
              type="number"
              placeholder="2500"
              value={profile.daily_water_goal_ml}
              onChange={(e) => setProfile({ ...profile, daily_water_goal_ml: parseInt(e.target.value) || 2500 })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import WeeklyChart from "@/components/WeeklyChart";
import MealForm from "@/components/MealForm";
import WaterForm from "@/components/WaterForm";
import DietSuggestions from "@/components/DietSuggestions";
import UserProfile from "@/components/UserProfile";
import ReminderSystem from "@/components/ReminderSystem";
import EnhancedDashboard from "@/components/EnhancedDashboard";
import ProfileOnboardingModal from "@/components/ProfileOnboardingModal";
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Droplets, User, Bell, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalWater, setTotalWater] = useState(0);
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; calories: number; water: number }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setUserProfile(profile);

      // Check if profile is complete (handle both old and new schema)
      const goalField = (profile as any)?.goal || (profile as any)?.goal_type;
      if (!profile || !profile.height_cm || !profile.weight_kg || !profile.age || !profile.gender || !profile.activity_level || !goalField) {
        // Show onboarding for new users (no profile at all)
        if (!profile) {
          setShowOnboarding(true);
        } else {
          // Show banner for users with incomplete profiles
          setShowCompletionBanner(true);
        }
      }
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's meals
      const { data: meals, error: mealsError } = await supabase
        .from("meals")
        .select("calories")
        .eq("user_id", user.id)
        .gte("time", today.toISOString());

      if (mealsError) {
        toast({
          title: "Error",
          description: "Failed to fetch meal data",
          variant: "destructive",
        });
      } else {
        const total = meals?.reduce((sum, meal) => sum + meal.calories, 0) || 0;
        setTotalCalories(total);
      }

      // Fetch today's water
      const { data: water, error: waterError } = await supabase
        .from("water_intake")
        .select("amount_ml")
        .eq("user_id", user.id)
        .gte("time", today.toISOString());

      if (waterError) {
        toast({
          title: "Error",
          description: "Failed to fetch water data",
          variant: "destructive",
        });
      } else {
        const total = water?.reduce((sum, w) => sum + w.amount_ml, 0) || 0;
        setTotalWater(total);
      }

      // Fetch weekly data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weeklyMeals } = await supabase
        .from("meals")
        .select("calories, time")
        .eq("user_id", user.id)
        .gte("time", weekAgo.toISOString());

      const { data: weeklyWater } = await supabase
        .from("water_intake")
        .select("amount_ml, time")
        .eq("user_id", user.id)
        .gte("time", weekAgo.toISOString());

      // Process weekly data
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const chartData = Array(7)
        .fill(0)
        .map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            day: days[date.getDay()],
            calories: 0,
            water: 0,
          };
        });

      weeklyMeals?.forEach((meal) => {
        const date = new Date(meal.time);
        const dayIndex = ((date.getDay() - today.getDay() + 6) % 7);
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[dayIndex].calories += meal.calories;
        }
      });

      weeklyWater?.forEach((w) => {
        const date = new Date(w.time);
        const dayIndex = ((date.getDay() - today.getDay() + 6) % 7);
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[dayIndex].water += w.amount_ml;
        }
      });

      setWeeklyData(chartData);
    };

    fetchStats();
  }, [user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleProfileUpdated = () => {
    setShowOnboarding(false);
    setShowCompletionBanner(false);
    handleRefresh();
  };

  const handleCompleteProfile = () => {
    setActiveTab("profile");
    setShowCompletionBanner(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar user={user} />
      <ProfileOnboardingModal 
        open={showOnboarding} 
        onComplete={handleProfileUpdated} 
        userId={user.id}
      />
      <main className="container mx-auto px-4 py-8">
        {showCompletionBanner && (
          <ProfileCompletionBanner onComplete={handleCompleteProfile} />
        )}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Health Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your nutrition, monitor your progress, and achieve your health goals
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <EnhancedDashboard
              userId={user.id}
              userProfile={userProfile}
              totalCalories={totalCalories}
              totalWater={totalWater}
              weeklyData={weeklyData}
              onRefresh={handleRefresh}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DietSuggestions 
                calorieIntake={totalCalories} 
                waterIntake={totalWater}
                userProfile={userProfile}
              />
              <WeeklyChart data={weeklyData} />
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MealForm userId={user.id} onMealAdded={handleRefresh} />
              <WaterForm userId={user.id} onWaterAdded={handleRefresh} />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <UserProfile userId={user.id} onProfileUpdated={handleProfileUpdated} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ReminderSystem userId={user.id} userProfile={userProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;

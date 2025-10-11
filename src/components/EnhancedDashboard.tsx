import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Flame, 
  Droplets, 
  Target, 
  TrendingUp, 
  Calendar,
  Activity,
  Scale,
  Heart,
  Zap,
  Clock
} from "lucide-react";

interface EnhancedDashboardProps {
  userId: string;
  userProfile?: {
    height_cm: number | null;
    weight_kg: number | null;
    age: number | null;
    gender: string | null;
    activity_level: string | null;
    goal_type: string | null;
    daily_calorie_goal: number | null;
    daily_water_goal_ml: number;
  } | null;
  totalCalories: number;
  totalWater: number;
  weeklyData: Array<{ day: string; calories: number; water: number }>;
  onRefresh: () => void;
}

const EnhancedDashboard = ({ 
  userId, 
  userProfile, 
  totalCalories, 
  totalWater, 
  weeklyData,
  onRefresh 
}: EnhancedDashboardProps) => {
  const [streak, setStreak] = useState(0);
  const [weeklyAvg, setWeeklyAvg] = useState({ calories: 0, water: 0 });

  useEffect(() => {
    calculateWeeklyAverage();
    calculateStreak();
  }, [weeklyData, userId]);

  const calculateWeeklyAverage = () => {
    const totalCal = weeklyData.reduce((sum, day) => sum + day.calories, 0);
    const totalWat = weeklyData.reduce((sum, day) => sum + day.water, 0);
    
    setWeeklyAvg({
      calories: Math.round(totalCal / 7),
      water: Math.round(totalWat / 7)
    });
  };

  const calculateStreak = async () => {
    try {
      // Calculate consecutive days with logged meals
      const today = new Date();
      let streakCount = 0;
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        
        const { data } = await supabase
          .from("meals")
          .select("id")
          .eq("user_id", userId)
          .gte("time", checkDate.toISOString())
          .lt("time", new Date(checkDate.getTime() + 24 * 60 * 60 * 1000).toISOString());
        
        if (data && data.length > 0) {
          streakCount++;
        } else {
          break;
        }
      }
      
      setStreak(streakCount);
    } catch (error) {
      console.error("Error calculating streak:", error);
    }
  };

  const calorieProgress = userProfile?.daily_calorie_goal 
    ? Math.min((totalCalories / userProfile.daily_calorie_goal) * 100, 100)
    : 0;

  const waterProgress = (totalWater / (userProfile?.daily_water_goal_ml || 2500)) * 100;

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getBMICategory = () => {
    if (!userProfile?.height_cm || !userProfile?.weight_kg) return null;
    
    const bmi = userProfile.weight_kg / Math.pow(userProfile.height_cm / 100, 2);
    if (bmi < 18.5) return { category: "Underweight", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25) return { category: "Normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30) return { category: "Overweight", color: "bg-yellow-100 text-yellow-800" };
    return { category: "Obese", color: "bg-red-100 text-red-800" };
  };

  const bmiCategory = getBMICategory();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Calories</p>
                <p className="text-2xl font-bold text-orange-900">{totalCalories}</p>
                <p className="text-xs text-orange-600">
                  Goal: {userProfile?.daily_calorie_goal || 2000}
                </p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <Progress 
              value={calorieProgress} 
              className="mt-3 h-2"
            />
            <p className="text-xs text-orange-600 mt-1">
              {calorieProgress.toFixed(0)}% of daily goal
            </p>
          </CardContent>
        </Card>

        {/* Water Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Water</p>
                <p className="text-2xl font-bold text-blue-900">
                  {(totalWater / 1000).toFixed(1)}L
                </p>
                <p className="text-xs text-blue-600">
                  Goal: {(userProfile?.daily_water_goal_ml || 2500) / 1000}L
                </p>
              </div>
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
            <Progress 
              value={waterProgress} 
              className="mt-3 h-2"
            />
            <p className="text-xs text-blue-600 mt-1">
              {waterProgress.toFixed(0)}% of daily goal
            </p>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Streak</p>
                <p className="text-2xl font-bold text-purple-900">{streak}</p>
                <p className="text-xs text-purple-600">days logged</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-3">
              <Badge className="bg-purple-200 text-purple-800">
                Keep it up! 🔥
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* BMI Card */}
        {bmiCategory && (
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">BMI</p>
                  <p className="text-2xl font-bold text-green-900">
                    {((userProfile?.weight_kg || 0) / Math.pow((userProfile?.height_cm || 1) / 100, 2)).toFixed(1)}
                  </p>
                  <p className="text-xs text-green-600">Health status</p>
                </div>
                <Scale className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-3">
                <Badge className={bmiCategory.color}>
                  {bmiCategory.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Overview
          </CardTitle>
          <CardDescription>
            Your nutrition progress over the past 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{weeklyAvg.calories}</p>
                  <p className="text-sm text-muted-foreground">Avg Calories/Day</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {(weeklyAvg.water / 1000).toFixed(1)}L
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Water/Day</p>
                </div>
              </div>
              
              {/* Activity Level Indicator */}
              {userProfile?.activity_level && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium">Activity Level</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {userProfile.activity_level.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </div>

            {/* Daily Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium">Daily Breakdown</h4>
              {weeklyData.map((day, index) => {
                const dayCalorieProgress = userProfile?.daily_calorie_goal 
                  ? (day.calories / userProfile.daily_calorie_goal) * 100 
                  : 0;
                const dayWaterProgress = (day.water / (userProfile?.daily_water_goal_ml || 2500)) * 100;

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-12">{day.day}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="text-sm">{day.calories}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">{(day.water / 1000).toFixed(1)}L</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(dayCalorieProgress)}`}
                          style={{ width: `${Math.min(dayCalorieProgress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {dayCalorieProgress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={onRefresh}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Refresh Data</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Heart className="h-6 w-6" />
              <span>Log Meal</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Clock className="h-6 w-6" />
              <span>Set Reminder</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDashboard;

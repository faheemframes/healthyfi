import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Scan } from "lucide-react";

interface MealFormProps {
  userId: string;
  onMealAdded: () => void;
}

const MealForm = ({ userId, onMealAdded }: MealFormProps) => {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const commonMeals = [
    { name: "Oatmeal Bowl", calories: 300 },
    { name: "Grilled Chicken", calories: 250 },
    { name: "Caesar Salad", calories: 350 },
    { name: "Pasta Carbonara", calories: 550 },
    { name: "Greek Yogurt", calories: 150 },
    { name: "Protein Shake", calories: 200 },
    { name: "Salmon Fillet", calories: 400 },
    { name: "Veggie Wrap", calories: 320 },
  ];

  const addCommonMeal = (name: string, cal: number) => {
    setMealName(name);
    setCalories(cal.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("meals").insert({
      user_id: userId,
      name: mealName,
      calories: parseInt(calories),
      time: new Date().toISOString(),
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add meal. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meal added successfully!",
      });
      setMealName("");
      setCalories("");
      onMealAdded();
    }
  };

  const handleScan = async () => {
    setScanning(true);
    
    try {
      // Call the dummy ML API for demo purposes
      const { data, error } = await supabase.functions.invoke("scan-meal");

      if (error) {
        throw error;
      }

      if (data) {
        setMealName(data.food_name);
        setCalories(data.calories.toString());
        toast({
          title: "Scan Complete",
          description: `Detected: ${data.food_name} (${data.calories} cal)`,
        });
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Scan error:", error);
      }
      toast({
        title: "Scan Unavailable",
        description: "Food recognition is currently in demo mode. Please enter your meal manually.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Log Meal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-name">Meal Name</Label>
            <Input
              id="meal-name"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Chicken Salad"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g., 350"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Quick Add Common Meals</Label>
            <div className="grid grid-cols-2 gap-2">
              {commonMeals.map((meal) => (
                <Button
                  key={meal.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonMeal(meal.name, meal.calories)}
                  className="text-xs justify-start"
                >
                  {meal.name} <span className="ml-auto text-muted-foreground">{meal.calories}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Adding..." : "Add Meal"}
            </Button>
            <Button type="button" variant="outline" onClick={handleScan} disabled={scanning}>
              <Scan className="h-4 w-4 mr-2" />
              {scanning ? "Scanning..." : "Demo Scan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MealForm;

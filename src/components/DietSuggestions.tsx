import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DietSuggestionsProps {
  calorieIntake: number;
  waterIntake: number;
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
}

const DietSuggestions = ({ calorieIntake, waterIntake, userProfile }: DietSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("diet-suggestions", {
        body: { 
          calorieIntake, 
          waterIntake,
          userProfile: userProfile || null
        },
      });

      if (error) throw error;

      // Parse the AI response
      let parsedSuggestions: string[] = [];
      try {
        // Try to parse as JSON first
        if (typeof data.suggestions === 'string') {
          parsedSuggestions = JSON.parse(data.suggestions);
        } else if (Array.isArray(data.suggestions)) {
          parsedSuggestions = data.suggestions;
        } else {
          throw new Error('Invalid response format');
        }
      } catch {
        // If not valid JSON, split by newlines and filter
        const suggestionsText = typeof data.suggestions === 'string' ? data.suggestions : JSON.stringify(data.suggestions);
        parsedSuggestions = suggestionsText
          .split("\n")
          .filter((s: string) => s.trim().length > 0)
          .slice(0, 3);
      }

      setSuggestions(parsedSuggestions);
      toast({
        title: "Suggestions Generated",
        description: "AI has analyzed your intake and provided personalized tips.",
      });
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Health Suggestions
        </CardTitle>
        <CardDescription>
          Get personalized diet and hydration tips based on your daily intake
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={getSuggestions} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Get AI Suggestions"
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <p className="text-sm text-foreground">{suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DietSuggestions;

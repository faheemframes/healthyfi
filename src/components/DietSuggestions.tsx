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
    goal?: string | null;
    goal_type?: string | null;
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

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Edge function error:", error);
        }
        throw new Error(error.message || "Failed to generate suggestions");
      }

      if (!data?.suggestions) {
        throw new Error("No suggestions received from AI");
      }

      // Parse the AI response with better formatting handling
      let parsedSuggestions: string[] = [];
      
      if (typeof data.suggestions === 'string') {
        try {
          // Try to parse as JSON array first
          const parsed = JSON.parse(data.suggestions);
          parsedSuggestions = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If not JSON, split intelligently by periods or newlines
          parsedSuggestions = data.suggestions
            .split(/(?:\d+\.\s+|\n+)/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 20) // Filter out very short fragments
            .map((s: string) => s.replace(/^[\[\]"]+|[\[\]"]+$/g, '').trim()) // Clean quotes and brackets
            .slice(0, 5); // Limit to 5 suggestions
        }
      } else if (Array.isArray(data.suggestions)) {
        parsedSuggestions = data.suggestions;
      } else {
        parsedSuggestions = [String(data.suggestions)];
      }

      setSuggestions(parsedSuggestions.filter(s => s && s.length > 0));
      toast({
        title: "Suggestions Generated",
        description: "AI has analyzed your intake and provided personalized tips.",
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error getting suggestions:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to get AI suggestions. Please try again.",
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
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-5 bg-secondary/50 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed flex-1 text-foreground">{suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DietSuggestions;

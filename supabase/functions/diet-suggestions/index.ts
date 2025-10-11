import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calorieIntake, waterIntake, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate BMI if profile data is available
    let bmiInfo = "";
    let profileContext = "";
    
    if (userProfile && userProfile.height_cm && userProfile.weight_kg) {
      const bmi = (userProfile.weight_kg / Math.pow(userProfile.height_cm / 100, 2)).toFixed(1);
      let bmiCategory = "Normal";
      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
      else if (bmi >= 30) bmiCategory = "Obese";
      
      bmiInfo = `BMI: ${bmi} (${bmiCategory})`;
      
      profileContext = `
User Profile:
- ${bmiInfo}
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- Activity Level: ${userProfile.activity_level || 'Not specified'}
- Goal: ${userProfile.goal_type || 'Not specified'}
- Daily Calorie Goal: ${userProfile.daily_calorie_goal || 'Not set'} kcal
- Daily Water Goal: ${userProfile.daily_water_goal_ml || 2500}ml`;
    }

    const calorieGoal = userProfile?.daily_calorie_goal || 2000;
    const waterGoal = userProfile?.daily_water_goal_ml || 2500;
    const goalType = userProfile?.goal_type || 'maintain';

    const prompt = `You are a nutrition expert. Based on the user's daily intake and profile:
- Total calories: ${calorieIntake} kcal (Goal: ${calorieGoal} kcal)
- Total water: ${waterIntake}ml (Goal: ${waterGoal}ml)
- Weight goal: ${goalType}${profileContext}

Provide 3 personalized, actionable health tips to improve their diet and hydration. Keep each tip concise (1-2 sentences). Focus on:
1. Calorie balance analysis based on their goal (${goalType} weight)
2. Hydration assessment and recommendations
3. One specific nutrition habit based on their BMI and goals

Make suggestions specific to their profile data and current intake. Be encouraging and practical.

Format as a JSON array of strings.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful nutrition expert providing personalized health tips." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const suggestions = data.choices?.[0]?.message?.content;

    if (!suggestions) {
      throw new Error("No suggestions received from AI");
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in diet-suggestions function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

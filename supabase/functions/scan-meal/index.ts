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
    // Dummy ML API - returns random food items
    const foods = [
      { food_name: "Pasta", calories: 300 },
      { food_name: "Grilled Chicken", calories: 250 },
      { food_name: "Caesar Salad", calories: 180 },
      { food_name: "Pizza Slice", calories: 285 },
      { food_name: "Fruit Bowl", calories: 120 },
      { food_name: "Salmon Fillet", calories: 350 },
      { food_name: "Rice Bowl", calories: 220 },
      { food_name: "Veggie Wrap", calories: 200 },
    ];

    const randomFood = foods[Math.floor(Math.random() * foods.length)];

    return new Response(JSON.stringify(randomFood), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

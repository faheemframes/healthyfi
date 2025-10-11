-- Add user profiles table for height, weight, BMI, and goals
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type TEXT CHECK (goal_type IN ('maintain', 'lose', 'gain')),
  target_weight_kg DECIMAL(5,2),
  daily_calorie_goal INTEGER,
  daily_water_goal_ml INTEGER DEFAULT 2500,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_times TEXT[] DEFAULT ARRAY['09:00', '13:00', '18:00'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.user_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX user_profiles_user_id_idx ON public.user_profiles(user_id);

-- Create function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(height_cm INTEGER, weight_kg DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF height_cm IS NULL OR weight_kg IS NULL OR height_cm <= 0 OR weight_kg <= 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND((weight_kg / POWER(height_cm / 100.0, 2))::DECIMAL, 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate daily calorie needs (Harris-Benedict equation)
CREATE OR REPLACE FUNCTION calculate_daily_calories(
  weight_kg DECIMAL,
  height_cm INTEGER,
  age INTEGER,
  gender TEXT,
  activity_level TEXT
)
RETURNS INTEGER AS $$
DECLARE
  bmr DECIMAL;
  activity_multiplier DECIMAL;
  daily_calories INTEGER;
BEGIN
  -- Validate inputs
  IF weight_kg IS NULL OR height_cm IS NULL OR age IS NULL OR gender IS NULL OR activity_level IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate BMR using Harris-Benedict equation
  IF gender = 'male' THEN
    bmr := 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age);
  ELSIF gender = 'female' THEN
    bmr := 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age);
  ELSE
    -- Average of male and female for other
    bmr := (88.362 + 447.593) / 2 + ((13.397 + 9.247) / 2 * weight_kg) + ((4.799 + 3.098) / 2 * height_cm) - ((5.677 + 4.330) / 2 * age);
  END IF;
  
  -- Activity multipliers
  CASE activity_level
    WHEN 'sedentary' THEN activity_multiplier := 1.2;
    WHEN 'light' THEN activity_multiplier := 1.375;
    WHEN 'moderate' THEN activity_multiplier := 1.55;
    WHEN 'active' THEN activity_multiplier := 1.725;
    WHEN 'very_active' THEN activity_multiplier := 1.9;
    ELSE activity_multiplier := 1.375; -- Default to light activity
  END CASE;
  
  daily_calories := ROUND(bmr * activity_multiplier)::INTEGER;
  RETURN daily_calories;
END;
$$ LANGUAGE plpgsql;

-- Create function to update daily calorie goal when profile changes
CREATE OR REPLACE FUNCTION update_daily_calorie_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if we have all required fields
  IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL AND NEW.age IS NOT NULL 
     AND NEW.gender IS NOT NULL AND NEW.activity_level IS NOT NULL THEN
    NEW.daily_calorie_goal := calculate_daily_calories(
      NEW.weight_kg, 
      NEW.height_cm, 
      NEW.age, 
      NEW.gender, 
      NEW.activity_level
    );
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update calorie goals
CREATE TRIGGER update_calorie_goal_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_calorie_goal();

-- Create reminders table for tracking notification history
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('water', 'meal', 'goal')),
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for reminders
CREATE POLICY "Users can view their own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX reminders_scheduled_time_idx ON public.reminders(scheduled_time);
CREATE INDEX reminders_status_idx ON public.reminders(status);

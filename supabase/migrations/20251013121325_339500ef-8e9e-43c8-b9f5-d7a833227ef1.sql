-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS daily_calorie_goal integer,
ADD COLUMN IF NOT EXISTS daily_water_goal_ml integer DEFAULT 2500;
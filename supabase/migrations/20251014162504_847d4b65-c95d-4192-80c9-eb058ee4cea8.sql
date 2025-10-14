-- Add DELETE policy for user_profiles table
-- This allows users to delete their own profile data (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
ON user_profiles
FOR DELETE
USING (auth.uid() = user_id);
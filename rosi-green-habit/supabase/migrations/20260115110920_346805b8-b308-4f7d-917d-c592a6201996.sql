-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  total_waste_saved DECIMAL(10,2) DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scan_history table
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  waste_name TEXT NOT NULL,
  waste_category TEXT NOT NULL,
  is_valuable BOOLEAN DEFAULT false,
  estimated_price DECIMAL(10,2),
  recommendation TEXT,
  environmental_impact TEXT,
  points_earned INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Scan history policies
CREATE POLICY "Users can view their own scan history" 
ON public.scan_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans" 
ON public.scan_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans" 
ON public.scan_history FOR DELETE 
USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Pahlawan Hijau'));
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile stats after scan
CREATE OR REPLACE FUNCTION public.update_profile_after_scan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_scans = total_scans + 1,
    total_points = total_points + NEW.points_earned,
    total_waste_saved = total_waste_saved + COALESCE(NEW.estimated_price, 0) / 1000,
    level = CASE 
      WHEN total_points + NEW.points_earned >= 1000 THEN 5
      WHEN total_points + NEW.points_earned >= 500 THEN 4
      WHEN total_points + NEW.points_earned >= 200 THEN 3
      WHEN total_points + NEW.points_earned >= 50 THEN 2
      ELSE 1
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Trigger for scan history insert
CREATE TRIGGER on_scan_created
  AFTER INSERT ON public.scan_history
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_after_scan();
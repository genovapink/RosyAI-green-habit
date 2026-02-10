-- Create market_listings table
CREATE TABLE public.market_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight TEXT NOT NULL,
  price NUMERIC NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  image_emoji TEXT DEFAULT '♻️',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
ON public.market_listings
FOR SELECT
USING (status = 'active' OR auth.uid() = user_id);

-- Users can create their own listings
CREATE POLICY "Users can create their own listings"
ON public.market_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update their own listings"
ON public.market_listings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete their own listings"
ON public.market_listings
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_market_listings_user_id ON public.market_listings(user_id);
CREATE INDEX idx_market_listings_category ON public.market_listings(category);
CREATE INDEX idx_market_listings_status ON public.market_listings(status);
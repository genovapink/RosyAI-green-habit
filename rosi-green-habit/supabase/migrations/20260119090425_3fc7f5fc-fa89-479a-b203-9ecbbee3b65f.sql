-- Add images column to market_listings (array of image URLs, max 3)
ALTER TABLE public.market_listings 
ADD COLUMN images text[] DEFAULT '{}';

-- Create storage bucket for market listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('market-images', 'market-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view market images
CREATE POLICY "Anyone can view market images"
ON storage.objects FOR SELECT
USING (bucket_id = 'market-images');

-- Policy: Authenticated users can upload their own images
CREATE POLICY "Users can upload market images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'market-images' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own market images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'market-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own roles
CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own roles
CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
USING (auth.uid() = user_id);

-- Create properties table for listing/tokenizing
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL DEFAULT 'house',
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqft NUMERIC,
  images TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  is_tokenized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own properties"
ON public.properties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
USING (auth.uid() = user_id);

-- Public can view published properties
CREATE POLICY "Anyone can view published properties"
ON public.properties FOR SELECT
USING (status = 'published');

-- Create storage bucket for property files
INSERT INTO storage.buckets (id, name, public) VALUES ('property-files', 'property-files', true);

-- Storage policies for property files
CREATE POLICY "Users can upload property files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their property files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view property files"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-files');

-- Trigger for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- Users can read their own bank details
CREATE POLICY "Users can read own bank details"
ON public.bank_details FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own bank details
CREATE POLICY "Users can insert own bank details"
ON public.bank_details FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bank details
CREATE POLICY "Users can update own bank details"
ON public.bank_details FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Anyone authenticated can read seller bank details (for transactions)
CREATE POLICY "Authenticated users can read any bank details"
ON public.bank_details FOR SELECT TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_bank_details_updated_at
  BEFORE UPDATE ON public.bank_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

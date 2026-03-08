
-- Property tokens table: simulates NFT/digital deed ownership
CREATE TABLE public.property_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL UNIQUE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_wallet text NOT NULL,
  owner_user_id uuid NOT NULL,
  minted_by uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  minted_at timestamptz NOT NULL DEFAULT now(),
  transferred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.property_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can view tokens (public registry)
CREATE POLICY "Anyone can view tokens" ON public.property_tokens
  FOR SELECT TO authenticated USING (true);

-- Owner can update their own tokens (not needed client-side, but for edge functions via service role)

-- Trigger for updated_at
CREATE TRIGGER update_property_tokens_updated_at
  BEFORE UPDATE ON public.property_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

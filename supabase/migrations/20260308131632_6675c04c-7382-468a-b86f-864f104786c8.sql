
-- Create property_transactions table for reactive transaction system
CREATE TABLE public.property_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status TEXT NOT NULL DEFAULT 'PAYMENT_INITIATED',
  contract_id TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{"payment_confirmed": false, "buyer_signed": false, "seller_signed": false, "title_verified": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_transactions ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own transactions
CREATE POLICY "Buyers can view their transactions"
ON public.property_transactions FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

-- Sellers can view transactions on their properties
CREATE POLICY "Sellers can view their transactions"
ON public.property_transactions FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

-- Authenticated users can create transactions (as buyer)
CREATE POLICY "Users can create transactions"
ON public.property_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Buyers and sellers can update their transactions
CREATE POLICY "Buyers can update their transactions"
ON public.property_transactions FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Updated_at trigger
CREATE TRIGGER update_property_transactions_updated_at
  BEFORE UPDATE ON public.property_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_transactions;

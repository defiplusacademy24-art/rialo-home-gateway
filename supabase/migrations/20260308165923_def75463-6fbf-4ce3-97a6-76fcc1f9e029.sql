
-- Create payouts table for tracking Paystack transfer payouts to sellers
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.property_transactions(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  paystack_transfer_reference text,
  paystack_recipient_code text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (transaction_id)
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own payouts
CREATE POLICY "Sellers can view their payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Buyers can view payouts for their transactions
CREATE POLICY "Buyers can view payouts for their transactions"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_transactions pt
      WHERE pt.id = payouts.transaction_id AND pt.buyer_id = auth.uid()
    )
  );

-- Update updated_at trigger
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

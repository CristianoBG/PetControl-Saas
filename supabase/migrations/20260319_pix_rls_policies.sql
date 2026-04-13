-- ============================================================
-- Migration: RLS Policies for payment_transactions
-- Run this in Supabase SQL Editor or apply via supabase db push
-- ============================================================

-- Enable RLS on the table (safe to run if already enabled)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own transactions
-- This prevents any logged-in user from polling someone else's transaction_hash
CREATE POLICY "Users can view own transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can INSERT their own transactions (created via Edge Function with service role, so this is defense-in-depth)
CREATE POLICY "Users can insert own transactions"
  ON public.payment_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE allowed from the frontend — webhook uses service_role which bypasses RLS
-- This ensures only the backend (webhook) can flip status to "paid"

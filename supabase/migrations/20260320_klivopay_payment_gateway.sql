-- ============================================================
-- Migration: Add payment_gateway and payment_method columns
-- to payment_transactions to support multiple gateways.
-- ============================================================

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS payment_gateway text NOT NULL DEFAULT 'openpix',
  ADD COLUMN IF NOT EXISTS payment_method  text;

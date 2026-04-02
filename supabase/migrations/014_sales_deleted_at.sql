-- 014_sales_deleted_at.sql
-- Add missing deleted_at column to sales (soft delete support)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

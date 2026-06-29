
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  company TEXT,
  asset_name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  vendor TEXT,
  department TEXT,
  location TEXT,
  warranty_months INTEGER,
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO anon, authenticated;
GRANT ALL ON public.assets TO service_role;

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON public.assets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON public.assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.assets FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate asset_code like ASSET-YYYY-NNNNNN
CREATE SEQUENCE IF NOT EXISTS public.asset_code_seq START 1;

CREATE OR REPLACE FUNCTION public.set_asset_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' THEN
    NEW.asset_code := 'ASSET-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.asset_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_assets_code BEFORE INSERT ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.set_asset_code();

-- ============================================================
-- MÃO NA BRASA — SUPABASE
-- SQL seguro para a estrutura do site e do painel Admin.
-- Não apaga as tabelas existentes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.mnb_site_settings (
    id TEXT PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mnb_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    tag TEXT DEFAULT 'Na brasa',
    description TEXT DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image TEXT DEFAULT '',
    image_fit TEXT DEFAULT 'contain',
    image_position TEXT DEFAULT 'center',
    has_addons BOOLEAN NOT NULL DEFAULT false,
    available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mnb_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mnb_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'entrega',
    address TEXT,
    payment_method TEXT NOT NULL DEFAULT 'Pix',
    customer_note TEXT,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'novo',
    whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mnb_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.mnb_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.mnb_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    note TEXT DEFAULT '',
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mnb_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cria/atualiza o usuário administrador pelo e-mail.
INSERT INTO public.mnb_admins (user_id, email, name, active)
SELECT id, email, 'Administrador', true
FROM auth.users
WHERE lower(email) = lower('maonabrasa9@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    active = true;

CREATE OR REPLACE FUNCTION public.mnb_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.mnb_admins
        WHERE user_id = auth.uid() AND active = true
    );
$$;

ALTER TABLE public.mnb_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mnb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mnb_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mnb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mnb_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mnb_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mnb_public_read_settings" ON public.mnb_site_settings;
DROP POLICY IF EXISTS "mnb_admin_update_settings" ON public.mnb_site_settings;
DROP POLICY IF EXISTS "mnb_public_read_products" ON public.mnb_products;
DROP POLICY IF EXISTS "mnb_admin_read_products" ON public.mnb_products;
DROP POLICY IF EXISTS "mnb_admin_insert_products" ON public.mnb_products;
DROP POLICY IF EXISTS "mnb_admin_update_products" ON public.mnb_products;
DROP POLICY IF EXISTS "mnb_admin_delete_products" ON public.mnb_products;
DROP POLICY IF EXISTS "mnb_public_read_addons" ON public.mnb_addons;
DROP POLICY IF EXISTS "mnb_admin_read_addons" ON public.mnb_addons;
DROP POLICY IF EXISTS "mnb_admin_insert_addons" ON public.mnb_addons;
DROP POLICY IF EXISTS "mnb_admin_update_addons" ON public.mnb_addons;
DROP POLICY IF EXISTS "mnb_admin_delete_addons" ON public.mnb_addons;
DROP POLICY IF EXISTS "mnb_public_insert_orders" ON public.mnb_orders;
DROP POLICY IF EXISTS "mnb_admin_read_orders" ON public.mnb_orders;
DROP POLICY IF EXISTS "mnb_admin_update_orders" ON public.mnb_orders;
DROP POLICY IF EXISTS "mnb_public_insert_order_items" ON public.mnb_order_items;
DROP POLICY IF EXISTS "mnb_admin_read_order_items" ON public.mnb_order_items;
DROP POLICY IF EXISTS "mnb_admin_read_profile" ON public.mnb_admins;

CREATE POLICY "mnb_public_read_settings" ON public.mnb_site_settings
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "mnb_admin_update_settings" ON public.mnb_site_settings
FOR UPDATE TO authenticated USING (public.mnb_is_admin()) WITH CHECK (public.mnb_is_admin());

CREATE POLICY "mnb_public_read_products" ON public.mnb_products
FOR SELECT TO anon, authenticated USING (available = true);

CREATE POLICY "mnb_admin_read_products" ON public.mnb_products
FOR SELECT TO authenticated USING (public.mnb_is_admin());

CREATE POLICY "mnb_admin_insert_products" ON public.mnb_products
FOR INSERT TO authenticated WITH CHECK (public.mnb_is_admin());

CREATE POLICY "mnb_admin_update_products" ON public.mnb_products
FOR UPDATE TO authenticated USING (public.mnb_is_admin()) WITH CHECK (public.mnb_is_admin());

CREATE POLICY "mnb_admin_delete_products" ON public.mnb_products
FOR DELETE TO authenticated USING (public.mnb_is_admin());

CREATE POLICY "mnb_public_read_addons" ON public.mnb_addons
FOR SELECT TO anon, authenticated USING (available = true);

CREATE POLICY "mnb_admin_read_addons" ON public.mnb_addons
FOR SELECT TO authenticated USING (public.mnb_is_admin());

CREATE POLICY "mnb_admin_insert_addons" ON public.mnb_addons
FOR INSERT TO authenticated WITH CHECK (public.mnb_is_admin());

CREATE POLICY "mnb_admin_update_addons" ON public.mnb_addons
FOR UPDATE TO authenticated USING (public.mnb_is_admin()) WITH CHECK (public.mnb_is_admin());

CREATE POLICY "mnb_admin_delete_addons" ON public.mnb_addons
FOR DELETE TO authenticated USING (public.mnb_is_admin());

CREATE POLICY "mnb_public_insert_orders" ON public.mnb_orders
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "mnb_admin_read_orders" ON public.mnb_orders
FOR SELECT TO authenticated USING (public.mnb_is_admin());

CREATE POLICY "mnb_admin_update_orders" ON public.mnb_orders
FOR UPDATE TO authenticated USING (public.mnb_is_admin()) WITH CHECK (public.mnb_is_admin());

CREATE POLICY "mnb_public_insert_order_items" ON public.mnb_order_items
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "mnb_admin_read_order_items" ON public.mnb_order_items
FOR SELECT TO authenticated USING (public.mnb_is_admin());

CREATE POLICY "mnb_admin_read_profile" ON public.mnb_admins
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Confirmação final.
SELECT 'ADMIN' AS tabela, COUNT(*) AS registros FROM public.mnb_admins
UNION ALL SELECT 'PRODUTOS', COUNT(*) FROM public.mnb_products
UNION ALL SELECT 'ADICIONAIS', COUNT(*) FROM public.mnb_addons
UNION ALL SELECT 'PEDIDOS', COUNT(*) FROM public.mnb_orders;

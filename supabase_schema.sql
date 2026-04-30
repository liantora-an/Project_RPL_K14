-- Botani Mart schema for Supabase Auth + catalog + cart.
-- Jalankan di Supabase SQL editor. Script ini reset tabel aplikasi.

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Pelanggan Botani Mart',
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    rating NUMERIC(2, 1) DEFAULT 4.9 CHECK (rating >= 0 AND rating <= 5),
    pickup_method TEXT DEFAULT 'Ambil di toko',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, product_id)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_time NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    midtrans_transaction_id TEXT,
    payment_type TEXT,
    gross_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'Pelanggan'), '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_select_own" ON admins
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "categories_public_select" ON categories
FOR SELECT USING (true);

CREATE POLICY "products_public_select" ON products
FOR SELECT USING (true);

CREATE POLICY "categories_admin_insert" ON categories
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE admins.profile_id = auth.uid())
);

CREATE POLICY "products_admin_insert" ON products
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE admins.profile_id = auth.uid())
);

CREATE POLICY "products_admin_update" ON products
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.profile_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE admins.profile_id = auth.uid())
);

CREATE POLICY "cart_select_own" ON cart_items
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "cart_insert_own" ON cart_items
FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "cart_update_own" ON cart_items
FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "cart_delete_own" ON cart_items
FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "transactions_select_own" ON transactions
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "transactions_insert_own" ON transactions
FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "transaction_items_select_own" ON transaction_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_items.transaction_id
    AND transactions.profile_id = auth.uid()
  )
);

CREATE POLICY "payments_select_own" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = payments.transaction_id
    AND transactions.profile_id = auth.uid()
  )
);

INSERT INTO categories (name, slug) VALUES
('Bibit Buah', 'bibit-buah'),
('Tanaman Hias', 'tanaman-hias'),
('Pupuk & Pestisida', 'pupuk-pestisida'),
('Media Tanam', 'media-tanam'),
('Pot & Alat Berkebun', 'pot-alat-berkebun')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, stock, image_url, rating, pickup_method)
SELECT id, 'Bibit Buah Mangga', 'bibit-buah-mangga', 'Bibit buah mangga sehat siap tanam.', 20000, 30, '/cat-tanaman-buah.jpg', 4.9, 'Ambil di toko'
FROM categories WHERE slug = 'bibit-buah'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, stock, image_url, rating, pickup_method)
SELECT id, 'Bunga Matahari', 'bunga-matahari', 'Tanaman hias bunga matahari untuk halaman rumah.', 56000, 18, '/cat-tanaman-hias.jpg', 4.7, 'Ambil di toko'
FROM categories WHERE slug = 'tanaman-hias'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, price, stock, image_url, rating, pickup_method)
SELECT id, 'Bibit Alpukat', 'bibit-alpukat', 'Paket bibit alpukat pilihan.', 23000, 42, '/cat-bibit-buah.jpg', 4.9, 'Ambil di toko'
FROM categories WHERE slug = 'bibit-buah'
ON CONFLICT (slug) DO NOTHING;

-- Setelah user admin dibuat lewat Supabase Auth, jalankan ini dengan email admin kamu:
-- INSERT INTO admins (profile_id)
-- SELECT id FROM profiles WHERE email = 'admin@email.com'
-- ON CONFLICT (profile_id) DO NOTHING;

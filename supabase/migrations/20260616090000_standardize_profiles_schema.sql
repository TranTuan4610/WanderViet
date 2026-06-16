-- Standardize public.profiles so admin and user pages use one Supabase schema.
-- Fixes missing columns such as profiles.name / profiles.full_name and keeps auth.users in sync.

-- 1) Ensure role enum exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- 2) Ensure profiles exists with the canonical columns used by the app.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  full_name text,
  phone text,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  status text NOT NULL DEFAULT 'active',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'user'::public.app_role;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- If a previous version created role as text, convert it safely to the app_role enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
      AND udt_name <> 'app_role'
  ) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN role TYPE public.app_role
      USING CASE WHEN role::text = 'admin'
        THEN 'admin'::public.app_role ELSE 'user'::public.app_role END;
  END IF;
END $$;

UPDATE public.profiles
SET
  email = lower(nullif(trim(email), '')),
  name = nullif(trim(coalesce(name, full_name, email)), ''),
  full_name = nullif(trim(coalesce(full_name, name, email)), ''),
  status = coalesce(nullif(trim(status), ''), 'active'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

UPDATE public.profiles SET role = 'user'::public.app_role WHERE role IS NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::public.app_role;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'banned'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (status);

-- 3) Keep updated_at correct.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Ensure user_roles still exists for legacy code / has_role() policies.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  )
$$;

-- 5) Auth trigger: every auth.users row creates/updates public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
  v_name text;
  v_full_name text;
  v_phone text;
  v_avatar_url text;
  v_role public.app_role;
  v_status text;
BEGIN
  v_email := lower(nullif(trim(NEW.email), ''));
  v_full_name := nullif(trim(coalesce(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(coalesce(NEW.email, ''), '@', 1)
  )), '');
  v_name := nullif(trim(coalesce(
    NEW.raw_user_meta_data ->> 'name',
    v_full_name,
    split_part(coalesce(NEW.email, ''), '@', 1)
  )), '');
  v_phone := nullif(trim(NEW.raw_user_meta_data ->> 'phone'), '');
  v_avatar_url := nullif(trim(NEW.raw_user_meta_data ->> 'avatar_url'), '');
  v_role := CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'admin'
    THEN 'admin'::public.app_role ELSE 'user'::public.app_role END;
  v_status := CASE
    WHEN NEW.raw_user_meta_data ->> 'status' IN ('active', 'inactive', 'banned')
      THEN NEW.raw_user_meta_data ->> 'status'
    ELSE 'active'
  END;

  INSERT INTO public.profiles (
    id, email, name, full_name, phone, role, status, avatar_url, created_at, updated_at
  ) VALUES (
    NEW.id, v_email, v_name, coalesce(v_full_name, v_name), v_phone, v_role, v_status, v_avatar_url, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    name = coalesce(nullif(public.profiles.name, ''), excluded.name),
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name, excluded.name),
    phone = coalesce(nullif(public.profiles.phone, ''), excluded.phone),
    role = coalesce(public.profiles.role, excluded.role),
    status = coalesce(nullif(public.profiles.status, ''), excluded.status),
    avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) Backfill users that registered before the trigger/schema was fixed.
INSERT INTO public.profiles (
  id, email, name, full_name, phone, role, status, avatar_url, created_at, updated_at
)
SELECT
  u.id,
  lower(u.email),
  nullif(trim(coalesce(
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(u.email, ''), '@', 1)
  )), ''),
  nullif(trim(coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(coalesce(u.email, ''), '@', 1)
  )), ''),
  nullif(trim(u.raw_user_meta_data ->> 'phone'), ''),
  CASE WHEN u.raw_user_meta_data ->> 'role' = 'admin'
    THEN 'admin'::public.app_role ELSE 'user'::public.app_role END,
  CASE
    WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'banned'
    WHEN u.raw_user_meta_data ->> 'status' IN ('active', 'inactive', 'banned') THEN u.raw_user_meta_data ->> 'status'
    ELSE 'active'
  END,
  nullif(trim(u.raw_user_meta_data ->> 'avatar_url'), ''),
  coalesce(u.created_at, now()),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = excluded.email,
  name = coalesce(nullif(public.profiles.name, ''), excluded.name),
  full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name, excluded.name),
  phone = coalesce(nullif(public.profiles.phone, ''), excluded.phone),
  role = coalesce(public.profiles.role, excluded.role),
  status = CASE
    WHEN excluded.status = 'banned' THEN 'banned'
    ELSE coalesce(nullif(public.profiles.status, ''), excluded.status)
  END,
  avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url),
  updated_at = now();

-- Preserve existing admin assignments stored in user_roles.
UPDATE public.profiles p
SET role = 'admin'::public.app_role, updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'admin'::public.app_role
);

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role FROM public.profiles p
ON CONFLICT (user_id, role) DO NOTHING;

-- 7) Compatibility object for any future/old code reading public.users.
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    EXECUTE $view$
      CREATE VIEW public.users AS
      SELECT id, email, name, full_name, phone, role, status, avatar_url, created_at, updated_at
      FROM public.profiles
    $view$;
  ELSIF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users' AND c.relkind IN ('v', 'm')
  ) THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.users AS
      SELECT id, email, name, full_name, phone, role, status, avatar_url, created_at, updated_at
      FROM public.profiles
    $view$;
  END IF;
END $$;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO service_role;

-- 8) RLS policies for profiles. Server functions with service role bypass RLS; users can read/update own profile.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select own or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update own or admin" ON public.profiles;

CREATE POLICY "Profiles select own or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Profiles update own or admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "User roles select own or admin" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;

CREATE POLICY "User roles select own or admin"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage user roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

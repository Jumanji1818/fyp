-- Procura PostgreSQL schema. Apply with: npm run migrate (see backend README).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('sole_proprietorship','enterprise','mega_corporation')),
  industry text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL,
  approval_threshold numeric(18,2) NOT NULL DEFAULT 0 CHECK (approval_threshold >= 0),
  currency char(3) NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  annual_budget numeric(18,2) NOT NULL DEFAULT 0 CHECK (annual_budget >= 0),
  spent numeric(18,2) NOT NULL DEFAULT 0 CHECK (spent >= 0),
  committed numeric(18,2) NOT NULL DEFAULT 0 CHECK (committed >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name),
  UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  department_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('Organization Admin','Request Officer','Department Head','Procurement Officer','Finance Officer','Approving Authority','Vendor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','deactivated')),
  vendor_id uuid,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, department_id) REFERENCES departments(organization_id, id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users(lower(email));
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS users_org_role_idx ON users(organization_id, role);

CREATE TABLE IF NOT EXISTS procurement_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('request','tender','bid','purchase_order','delivery','payment','vendor','award','notification')),
  reference_number text,
  status text NOT NULL DEFAULT 'Draft',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS procurement_records_org_type_idx ON procurement_records(organization_id, record_type, created_at DESC);
CREATE INDEX IF NOT EXISTS procurement_records_org_status_idx ON procurement_records(organization_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS procurement_records_org_reference_unique
  ON procurement_records(organization_id, record_type, reference_number)
  WHERE reference_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_org_created_idx ON audit_events(organization_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS procurement_records_touch_updated_at ON procurement_records;
CREATE TRIGGER procurement_records_touch_updated_at BEFORE UPDATE ON procurement_records
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
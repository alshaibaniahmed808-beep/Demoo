/*
  # Novro Core Schema - Multi-Tenant Queue Management

  ## Overview
  Complete schema for the Novro SaaS platform supporting multi-tenant clinic queue management.

  ## New Tables

  ### 1. `clinics`
  - Primary tenant entity. Each row represents one clinic.
  - Fields: id (UUID PK), slug (unique URL identifier), name, logo_url, primary_color, secondary_color, accent_color, text_color, phone, email, address, subscription_plan, is_active, metadata (JSONB), timestamps.

  ### 2. `doctors`
  - Doctors linked to a specific clinic via clinic_id FK.
  - Fields: id, clinic_id (FK -> clinics), name, specialization, email, phone, is_active, registration_number, profile_image_url, average_consultation_time_minutes, timestamps.
  - Unique constraint: (clinic_id, email).

  ### 3. `queue_items`
  - Core queue rows. Each row is one patient visit linked to a doctor and clinic.
  - Fields: id, clinic_id (FK), doctor_id (FK), patient_name, patient_phone, patient_id_number, ticket_number (auto-sequential per doctor per day), status (Enum: waiting/calling/active/done), position_in_queue, called_at, started_at, completed_at, notes, timestamps.

  ### 4. `receptionist_sessions`
  - Active sessions for clinic staff. Used as the RLS trust anchor.
  - Fields: id, clinic_id (FK), doctor_id (FK), user_id (auth.uid), session_token, is_active, last_activity, ip_address, user_agent, timestamps, expires_at.

  ### 5. `queue_analytics`
  - Daily aggregated stats per doctor per clinic.
  - Fields: id, clinic_id, doctor_id, date, counters, avg times, timestamps.
  - Unique constraint: (clinic_id, doctor_id, date).

  ## Indexes
  - Composite index on (clinic_id, doctor_id) for queue_items — primary hot path query.
  - Index on queue_items.status — for filtering by waiting/calling/active.
  - Index on queue_items.created_at DESC — for chronological ordering.
  - Index on doctors.clinic_id.
  - Index on receptionist_sessions.clinic_id.
  - Index on queue_analytics composite.

  ## Security
  - RLS enabled on ALL tables.
  - clinics: authenticated users can read; only session-owning users can update.
  - doctors: session-scoped SELECT and INSERT only for own clinic.
  - queue_items: session-scoped SELECT, INSERT, UPDATE for own clinic.
  - receptionist_sessions: users can only see/manage their own sessions.
  - queue_analytics: session-scoped SELECT for own clinic.

  ## Functions & Triggers
  - `generate_next_ticket_number(doctor_id, clinic_id)` — returns MAX(ticket_number)+1 for today.
  - `calculate_queue_position(doctor_id, queue_item_id)` — returns count of items ahead.
  - `update_updated_at_column()` trigger function — keeps updated_at fresh on every UPDATE.
  - Triggers applied to clinics, doctors, queue_items.

  ## Seed Data
  - One demo clinic inserted (slug: novro-clinic-demo) for testing — uses ON CONFLICT DO NOTHING.
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM ('waiting', 'calling', 'active', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: clinics
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             VARCHAR(255) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  logo_url         TEXT,
  primary_color    VARCHAR(7)  DEFAULT '#03A9F4',
  secondary_color  VARCHAR(7)  DEFAULT '#1F2937',
  accent_color     VARCHAR(7)  DEFAULT '#1DD1A1',
  text_color       VARCHAR(7)  DEFAULT '#FFFFFF',
  phone            VARCHAR(20),
  email            VARCHAR(255),
  address          TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  metadata         JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- TABLE: doctors
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id                       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name                            VARCHAR(255) NOT NULL,
  specialization                  VARCHAR(255),
  email                           VARCHAR(255),
  phone                           VARCHAR(20),
  is_active                       BOOLEAN DEFAULT true,
  registration_number             VARCHAR(100),
  profile_image_url               TEXT,
  average_consultation_time_minutes INT DEFAULT 15,
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, email)
);

-- ============================================
-- TABLE: queue_items
-- ============================================
CREATE TABLE IF NOT EXISTS queue_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name        VARCHAR(255) NOT NULL,
  patient_phone       VARCHAR(20),
  patient_id_number   VARCHAR(50),
  ticket_number       INT NOT NULL,
  status              queue_status DEFAULT 'waiting',
  position_in_queue   INT,
  called_at           TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: receptionist_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS receptionist_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================
-- TABLE: queue_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS queue_analytics (
  id                                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id                         UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id                         UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date                              DATE NOT NULL,
  total_patients                    INT DEFAULT 0,
  completed_patients                INT DEFAULT 0,
  average_wait_time_minutes         INT DEFAULT 0,
  average_consultation_time_minutes INT DEFAULT 0,
  no_show_count                     INT DEFAULT 0,
  created_at                        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, doctor_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id
  ON doctors(clinic_id);

-- Primary hot-path: fetch queue for a specific doctor in a clinic
CREATE INDEX IF NOT EXISTS idx_queue_items_clinic_doctor
  ON queue_items(clinic_id, doctor_id);

-- Filter by status (waiting / calling / active)
CREATE INDEX IF NOT EXISTS idx_queue_items_status
  ON queue_items(status);

-- Chronological ordering
CREATE INDEX IF NOT EXISTS idx_queue_items_created_at
  ON queue_items(created_at DESC);

-- Lookup by clinic only (for admin views)
CREATE INDEX IF NOT EXISTS idx_queue_items_clinic_id
  ON queue_items(clinic_id);

-- Lookup by doctor only
CREATE INDEX IF NOT EXISTS idx_queue_items_doctor_id
  ON queue_items(doctor_id);

CREATE INDEX IF NOT EXISTS idx_receptionist_sessions_clinic_id
  ON receptionist_sessions(clinic_id);

CREATE INDEX IF NOT EXISTS idx_receptionist_sessions_user_id
  ON receptionist_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_queue_analytics_composite
  ON queue_analytics(clinic_id, doctor_id, date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE clinics               ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_analytics       ENABLE ROW LEVEL SECURITY;

-- clinics: any authenticated user can read clinic info (needed for branding endpoint)
CREATE POLICY "Authenticated users can read clinics"
  ON clinics FOR SELECT
  TO authenticated
  USING (true);

-- clinics: only staff of that clinic can update
CREATE POLICY "Clinic staff can update own clinic"
  ON clinics FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- doctors: staff can read doctors of their own clinic
CREATE POLICY "Clinic staff can read own doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- doctors: staff can insert doctors into their clinic
CREATE POLICY "Clinic staff can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- doctors: staff can update doctors of their clinic
CREATE POLICY "Clinic staff can update own doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- queue_items: staff SELECT scoped to own clinic
CREATE POLICY "Clinic staff can read own queue items"
  ON queue_items FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- queue_items: staff INSERT scoped to own clinic
CREATE POLICY "Clinic staff can insert queue items"
  ON queue_items FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- queue_items: staff UPDATE scoped to own clinic
CREATE POLICY "Clinic staff can update own queue items"
  ON queue_items FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- queue_items: staff DELETE scoped to own clinic
CREATE POLICY "Clinic staff can delete own queue items"
  ON queue_items FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- receptionist_sessions: users manage only their own sessions
CREATE POLICY "Users can read own sessions"
  ON receptionist_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON receptionist_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON receptionist_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON receptionist_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- queue_analytics: staff SELECT scoped to own clinic
CREATE POLICY "Clinic staff can read own analytics"
  ON queue_analytics FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM receptionist_sessions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION generate_next_ticket_number(
  p_doctor_id UUID,
  p_clinic_id UUID
)
RETURNS INT AS $$
DECLARE
  next_ticket INT;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
    INTO next_ticket
    FROM queue_items
   WHERE doctor_id  = p_doctor_id
     AND clinic_id  = p_clinic_id
     AND DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE;
  RETURN next_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_queue_position(
  p_doctor_id    UUID,
  p_queue_item_id UUID
)
RETURNS INT AS $$
DECLARE
  position INT;
  item_created_at TIMESTAMPTZ;
BEGIN
  SELECT created_at INTO item_created_at
    FROM queue_items WHERE id = p_queue_item_id;

  SELECT COUNT(*) + 1
    INTO position
    FROM queue_items
   WHERE doctor_id  = p_doctor_id
     AND status     IN ('waiting', 'calling')
     AND created_at <= item_created_at
     AND id         != p_queue_item_id;

  RETURN position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_queue_items_updated_at ON queue_items;
CREATE TRIGGER update_queue_items_updated_at
  BEFORE UPDATE ON queue_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO clinics (slug, name, primary_color, secondary_color, accent_color, text_color, phone, email, address)
VALUES (
  'novro-demo',
  'عيادة نوفرو التجريبية',
  '#03A9F4',
  '#1F2937',
  '#1DD1A1',
  '#FFFFFF',
  '920000000',
  'info@novro.clinic',
  'الرياض، المملكة العربية السعودية'
) ON CONFLICT (slug) DO NOTHING;

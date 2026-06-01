-- ============================================
-- NOVRO QUEUE MANAGEMENT SYSTEM
-- Supabase PostgreSQL Schema
-- Multi-Tenant Architecture (SaaS)
-- ============================================

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. جدول العيادات (Clinics) - الجذر الرئيسي
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1F2937',
    accent_color VARCHAR(7) DEFAULT '#10B981',
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- 2. جدول الأطباء (Doctors)
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    registration_number VARCHAR(100),
    profile_image_url TEXT,
    average_consultation_time_minutes INT DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, email)
);

-- ============================================
-- 3. Enum Type لحالات طابور الانتظار
-- ============================================
CREATE TYPE queue_status AS ENUM (
    'waiting',
    'calling',
    'active',
    'done'
);

-- ============================================
-- 4. جدول طابور الانتظار (Queue Items)
-- ============================================
CREATE TABLE IF NOT EXISTS queue_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20),
    patient_id_number VARCHAR(50),
    ticket_number INT NOT NULL,
    status queue_status DEFAULT 'waiting',
    position_in_queue INT,
    called_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. جدول الجلسات (Sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS receptionist_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================
-- 6. جدول الإحصائيات والتحليلات
-- ============================================
CREATE TABLE IF NOT EXISTS queue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_patients INT DEFAULT 0,
    completed_patients INT DEFAULT 0,
    average_wait_time_minutes INT DEFAULT 0,
    average_consultation_time_minutes INT DEFAULT 0,
    no_show_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, doctor_id, date)
);

-- ============================================
-- الفهارس (Indexes)
-- ============================================
CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX idx_queue_items_clinic_id ON queue_items(clinic_id);
CREATE INDEX idx_queue_items_doctor_id ON queue_items(doctor_id);
CREATE INDEX idx_queue_items_status ON queue_items(status);
CREATE INDEX idx_queue_items_clinic_doctor ON queue_items(clinic_id, doctor_id);
CREATE INDEX idx_queue_items_created_at ON queue_items(created_at DESC);
CREATE INDEX idx_receptionist_sessions_clinic_id ON receptionist_sessions(clinic_id);
CREATE INDEX idx_queue_analytics_clinic_doctor_date ON queue_analytics(clinic_id, doctor_id, date);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinics_authenticated_users_can_read" ON clinics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clinics_only_clinic_admin_can_update" ON clinics
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT user_id::text FROM receptionist_sessions 
            WHERE clinic_id = clinics.id AND is_active = true
        )
    );

CREATE POLICY "doctors_select_own_clinic" ON doctors
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "doctors_insert_own_clinic" ON doctors
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "queue_items_select_own_clinic" ON queue_items
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "queue_items_insert_own_clinic" ON queue_items
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "queue_items_update_own_clinic" ON queue_items
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    ) WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ============================================
-- الدوال المساعدة (Functions)
-- ============================================
CREATE OR REPLACE FUNCTION generate_next_ticket_number(
    p_doctor_id UUID,
    p_clinic_id UUID
)
RETURNS INT AS $$
DECLARE
    next_ticket INT;
BEGIN
    SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO next_ticket
    FROM queue_items
    WHERE doctor_id = p_doctor_id 
        AND clinic_id = p_clinic_id
        AND DATE(created_at) = CURRENT_DATE;
    
    RETURN next_ticket;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_queue_position(
    p_doctor_id UUID,
    p_queue_item_id UUID
)
RETURNS INT AS $$
DECLARE
    position INT;
BEGIN
    SELECT COUNT(*) + 1 INTO position
    FROM queue_items
    WHERE doctor_id = p_doctor_id 
        AND status IN ('waiting', 'calling')
        AND created_at <= (SELECT created_at FROM queue_items WHERE id = p_queue_item_id)
        AND id != p_queue_item_id;
    
    RETURN position;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- المشغلات (Triggers)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_items_updated_at BEFORE UPDATE ON queue_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- البيانات الأولية (Seed Data)
-- ============================================
INSERT INTO clinics (slug, name, primary_color, secondary_color, accent_color, text_color, phone, email, address)
VALUES (
    'novro-clinic-demo',
    'عيادة نوفرو التجريبية',
    '#3B82F6',
    '#1F2937',
    '#10B981',
    '#FFFFFF',
    '920000000',
    'info@novro.clinic',
    'الرياض، المملكة العربية السعودية'
) ON CONFLICT (slug) DO NOTHING;
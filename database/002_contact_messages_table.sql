-- ============================================
-- Contact Messages Table
-- جدول الرسائل والتواصل
-- ============================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'support', -- support, bug, feature
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_messages_clinic_id ON contact_messages(clinic_id);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_read ON contact_messages(read);
CREATE INDEX idx_contact_messages_type ON contact_messages(type);

-- Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_messages_select_own_clinic" ON contact_messages
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "contact_messages_insert_any" ON contact_messages
    FOR INSERT WITH CHECK (true); -- أي شخص يمكنه إرسال رسالة

CREATE POLICY "contact_messages_update_own_clinic" ON contact_messages
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

-- Trigger to update updated_at
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

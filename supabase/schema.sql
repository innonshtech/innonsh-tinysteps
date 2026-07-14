-- ==========================================
-- PRE-PRIMARY ERP - SUPABASE POSTGRES SCHEMA
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- SAAS MULTI-TENANCY LAYER
-- ==========================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    school_name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_details JSONB,
    logo VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CORE USERS & ROLES
-- ==========================================

-- General users table (Admins, Parents, Staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers Profile
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subjects TEXT[],
    qualifications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    room_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name, section)
);

-- Teacher-Class Assignment (Many-to-Many)
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (teacher_id, class_id)
);

-- Students Profile
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    password VARCHAR(255),
    dob DATE,
    gender VARCHAR(20),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    admission_no VARCHAR(100) UNIQUE,
    admission_date DATE,
    medical_allergies TEXT[],
    medical_notes TEXT,
    pickup_person VARCHAR(100),
    pickup_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student-Parent relationships (Normalized)
CREATE TABLE IF NOT EXISTS student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    relation VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Documents
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ATTENDANCE
-- ==========================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    marked_by_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    marked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- ==========================================
-- FEES
-- ==========================================

CREATE TABLE IF NOT EXISTS fee_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'recurring',
    default_amount NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    fine_per_day NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_structure_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'monthly',
    due_date_day INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS fee_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
    amount_due NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    fine_amount NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'due',
    due_date DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_meta JSONB,
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES fee_transactions(id) ON DELETE CASCADE,
    head VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS fee_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES fee_transactions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ADMISSIONS & INQUIRIES
-- ==========================================

CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    parent_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255),
    parent_phone VARCHAR(50),
    child_name VARCHAR(255),
    child_dob DATE,
    preferred_class VARCHAR(100),
    message TEXT,
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    admission_no VARCHAR(100) UNIQUE,
    child_first_name VARCHAR(100) NOT NULL,
    child_last_name VARCHAR(100),
    dob DATE,
    gender VARCHAR(20),
    preferred_class VARCHAR(100),
    applied_by_parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_school VARCHAR(255),
    status VARCHAR(50) DEFAULT 'submitted',
    admin_note TEXT,
    admission_fee_paid BOOLEAN DEFAULT FALSE,
    converted_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admission_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    relation VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS admission_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- EVENTS & NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'notification',
    start_date DATE NOT NULL,
    end_date DATE,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    location VARCHAR(255),
    image TEXT,
    target_audience VARCHAR(50) DEFAULT 'all',
    status VARCHAR(50) DEFAULT 'draft',
    notify BOOLEAN DEFAULT TRUE,
    notification_type VARCHAR(50) DEFAULT 'all',
    fcm_sent BOOLEAN DEFAULT FALSE,
    fcm_sent_at TIMESTAMP WITH TIME ZONE,
    fcm_recipient_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_class_targets (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, class_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    recipient_id UUID, -- References User or Student depending on role
    type VARCHAR(50) NOT NULL,
    fcm_category VARCHAR(50) DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_model VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(50) DEFAULT 'normal',
    action_url TEXT,
    icon VARCHAR(100),
    metadata JSONB,
    fcm_sent BOOLEAN DEFAULT FALSE,
    fcm_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References User/Student
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) DEFAULT 'android',
    device_id VARCHAR(255),
    app_version VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    fcm_token TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    fcm_message_id TEXT,
    error_code TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- GALLERY
-- ==========================================

CREATE TABLE IF NOT EXISTS gallery_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    album_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    event_date DATE,
    event_location VARCHAR(255),
    visibility VARCHAR(50) DEFAULT 'parents',
    is_published BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'image',
    caption TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gallery_image_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES gallery_images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ACADEMICS & EXAMS
-- ==========================================

CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subjects TEXT[],
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_marks NUMERIC DEFAULT 100,
    passing_marks NUMERIC DEFAULT 35,
    exam_type VARCHAR(50) DEFAULT 'unit-test',
    status VARCHAR(50) DEFAULT 'scheduled',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    room_number VARCHAR(50),
    instructions TEXT
);

CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC,
    percentage NUMERIC,
    grade VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending',
    remarks TEXT,
    UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    term VARCHAR(100),
    cognitive TEXT,
    motor TEXT,
    social TEXT,
    notes TEXT,
    score JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_remarks TEXT,
    attachment TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS substitute_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    leave_id UUID NOT NULL REFERENCES teacher_leaves(id) ON DELETE CASCADE,
    original_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    substitute_teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'assigned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- MEAL PLANS
-- ==========================================

CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    meal_type VARCHAR(50) DEFAULT 'lunch',
    cost NUMERIC,
    vendor VARCHAR(255),
    vendor_contact VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_plan_classes (
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (meal_plan_id, class_id)
);

CREATE TABLE IF NOT EXISTS meal_plan_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_day_id UUID REFERENCES meal_plan_days(id) ON DELETE CASCADE,
    meal_plan_special_id UUID, -- For special meals
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    nutrition_info TEXT,
    allergens TEXT[],
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS meal_plan_specials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    occasion VARCHAR(255)
);

-- ==========================================
-- TRANSPORT
-- ==========================================

CREATE TABLE IF NOT EXISTS transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    route_code VARCHAR(100) UNIQUE,
    description TEXT,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    vehicle_number VARCHAR(100),
    vehicle_type VARCHAR(50) DEFAULT 'bus',
    capacity INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transport_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    pickup_time VARCHAR(10),
    drop_time VARCHAR(10),
    sequence INTEGER,
    lat NUMERIC,
    lng NUMERIC
);

CREATE TABLE IF NOT EXISTS transport_student_assignments (
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (route_id, student_id)
);

-- ==========================================
-- SETTINGS & LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
    school_name VARCHAR(255),
    school_logo VARCHAR(500),
    school_address TEXT,
    school_phone VARCHAR(50),
    school_email VARCHAR(255),
    principal_name VARCHAR(255),
    academic_year VARCHAR(20),
    subjects TEXT[],
    term_dates JSONB,
    holidays JSONB,
    leave_quotas JSONB,
    feature_flags JSONB,
    payment_gateway JSONB,
    email_settings JSONB,
    notification_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    actor_id UUID,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    result VARCHAR(20) NOT NULL,
    message TEXT,
    ip VARCHAR(50),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- UTILITIES & FUNCTIONS
-- ==========================================

-- Sequence for Admission Numbers
CREATE SEQUENCE IF NOT EXISTS admission_seq START 1;

CREATE OR REPLACE FUNCTION next_admission_no() RETURNS text AS $$
BEGIN
  RETURN 'ADM-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('admission_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ANALYTICS VIEWS
-- ==========================================

CREATE OR REPLACE VIEW v_student_count_by_class AS
SELECT 
    c.school_id,
    c.id as class_id,
    c.name as class_name,
    c.section,
    COUNT(s.id) as student_count
FROM classes c
LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
GROUP BY c.id, c.school_id;

CREATE OR REPLACE VIEW v_fee_collection_summary AS
SELECT 
    school_id,
    status,
    payment_method,
    SUM(amount_paid) as total_collected,
    SUM(amount_due - amount_paid) as total_pending
FROM fee_transactions
GROUP BY school_id, status, payment_method;

-- ==========================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to main tables
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_teachers_modtime BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_classes_modtime BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_modified_column();
-- (Can be extended to all tables as needed)

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    fcm_category VARCHAR(50) DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_model VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal',
    action_url VARCHAR(500),
    icon VARCHAR(100),
    metadata JSONB,
    fcm_sent BOOLEAN DEFAULT FALSE,
    fcm_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    fcm_message_id TEXT,
    error_code TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notif_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_status ON notification_delivery_logs(user_id, status);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
-- RLS can be enforced by repositories since service role bypasses RLS
-- and anon key will not be directly used for db writes by clients.
-- If required, ENABLE ROW LEVEL SECURITY on specific tables here.

-- ==========================================
-- TIMETABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    day VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetable_class_id ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON timetable(teacher_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) LOCKDOWN
-- ==========================================
-- Enabling RLS on all tables to prevent direct client access using anon key.
-- Since the application routes requests through Next.js API using the Service Role key,
-- these operations bypass RLS and function normally.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_class_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_image_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_activities ENABLE ROW LEVEL SECURITY;

-- Allow read-only access to notifications for realtime subscriptions
CREATE POLICY "Allow realtime notification reads" ON notifications
  FOR SELECT USING (true);

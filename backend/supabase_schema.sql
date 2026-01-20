-- Supabase Schema for School Manager
-- This SQL file creates all tables needed for the application
-- IMPORTANT: Tables are ordered to respect foreign key constraints

-- ===================== CAMPUSES TABLE =====================
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== ACADEMIC YEARS TABLE =====================
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== FORMATIONS TABLE =====================
CREATE TABLE IF NOT EXISTS formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== FILIERES TABLE =====================
CREATE TABLE IF NOT EXISTS filieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== FILIERE_FORMATIONS TABLE (Many-to-Many) =====================
CREATE TABLE IF NOT EXISTS filiere_formations (
    filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE,
    formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
    PRIMARY KEY (filiere_id, formation_id)
);

-- ===================== LEVELS TABLE =====================
CREATE TABLE IF NOT EXISTS levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== CLASSES TABLE =====================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
    filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, academic_year_id, campus_id)
);

-- ===================== SUBJECTS TABLE =====================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    credits INTEGER DEFAULT 2,
    coefficient FLOAT DEFAULT 1.0,
    formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
    filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== USERS TABLE =====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'secretary',
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PROFESSORS TABLE =====================
CREATE TABLE IF NOT EXISTS professors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialty VARCHAR(255),
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PROFESSOR HOURS TABLE =====================
CREATE TABLE IF NOT EXISTS professor_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID REFERENCES professors(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
    filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    total_hours_planned FLOAT NOT NULL,
    total_hours_done FLOAT DEFAULT 0,
    hours_remaining FLOAT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_done FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== STAFF TABLE =====================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    birth_place VARCHAR(255),
    "function" VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== STUDENTS TABLE =====================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricule VARCHAR(50) UNIQUE NOT NULL,
    permanent_id VARCHAR(100) NOT NULL,
    photo TEXT,
    matricule_bac VARCHAR(50),
    numero_table_bac VARCHAR(50),
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    formation_id UUID REFERENCES formations(id) ON DELETE CASCADE,
    filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'non_affecté',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(255),
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    nationality VARCHAR(50) DEFAULT 'Ivoirienne',
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    tuition_amount FLOAT DEFAULT 0,
    tuition_paid FLOAT DEFAULT 0,
    is_exonerated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== GRADES TABLE =====================
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    value FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== TRANSACTIONS TABLE =====================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount FLOAT NOT NULL,
    description TEXT,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== ARCHIVES TABLE =====================
CREATE TABLE IF NOT EXISTS archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(100) NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    downloaded_by VARCHAR(255),
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== STUDENT ABSENCES TABLE =====================
CREATE TABLE IF NOT EXISTS student_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours FLOAT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_campus_id ON users(campus_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_campus ON students(campus_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_campus ON transactions(campus_id);
CREATE INDEX IF NOT EXISTS idx_transactions_academic_year ON transactions(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_professor_hours_academic_year ON professor_hours(academic_year_id);

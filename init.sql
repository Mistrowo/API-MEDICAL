-- ============================================================
-- Script de creación de base de datos - API Citas Médicas
-- Motor: PostgreSQL 14+
-- ============================================================

-- Eliminar tablas si existen (orden inverso por dependencias)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- Tabla: users
-- Descripción: Almacena pacientes y médicos del sistema.
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  UNIQUE NOT NULL,
    role        VARCHAR(20)   NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR')),
    specialty   VARCHAR(100),                          -- Solo aplica a médicos
    token       VARCHAR(255)  UNIQUE NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Tabla: appointments
-- Descripción: Registro de citas médicas con su ciclo de vida.
-- Estados: PENDING_PAYMENT → PAID → CONFIRMED / REJECTED
-- ============================================================
CREATE TABLE appointments (
    id              SERIAL PRIMARY KEY,
    patient_id      INT           NOT NULL REFERENCES users(id),
    doctor_id       INT           NOT NULL REFERENCES users(id),
    date_time       TIMESTAMP     NOT NULL,
    reason          VARCHAR(255),                      -- Motivo de la consulta
    status          VARCHAR(20)   DEFAULT 'PENDING_PAYMENT'
                                  CHECK (status IN ('PENDING_PAYMENT','PAID','CONFIRMED','REJECTED')),
    transaction_id  VARCHAR(100),
    amount          DECIMAL(10,2) DEFAULT 0.00,        -- Monto pagado
    notes           TEXT,                              -- Notas del médico
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas frecuentes
CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, date_time);
CREATE INDEX idx_appointments_patient     ON appointments (patient_id);
CREATE INDEX idx_appointments_status      ON appointments (status);

-- ============================================================
-- Datos de prueba (Seed)
-- ============================================================
INSERT INTO users (name, email, role, specialty, token) VALUES
('Alex Paciente',    'alex@mail.com',    'PATIENT', NULL,               'patient-token-123'),
('María López',      'maria@mail.com',   'PATIENT', NULL,               'patient-token-456'),
('Dr. House',        'house@clinic.com', 'DOCTOR',  'Medicina General',  'doctor-token-789'),
('Dra. Nino',        'nino@clinic.com',  'DOCTOR',  'Cardiología',       'doctor-token-012');
/**
 * @module domain/Appointment
 * @description Entidad de dominio que representa una cita médica.
 * Define los estados posibles y la estructura de datos de una cita.
 */

/** Estados válidos del ciclo de vida de una cita */
export type AppointmentStatus = 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'REJECTED';

/**
 * Interfaz que modela una cita médica en el sistema.
 *
 * Ciclo de vida:
 *   PENDING_PAYMENT → (pago) → PAID → (médico confirma) → CONFIRMED
 *                                    → (médico rechaza)  → REJECTED
 */
export interface Appointment {
    id?: number;
    patientId: number;
    doctorId: number;
    dateTime: Date;
    reason?: string;
    status: AppointmentStatus;
    transactionId?: string;
    amount?: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
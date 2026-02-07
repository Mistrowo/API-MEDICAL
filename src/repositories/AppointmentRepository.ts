/**
 * @module repositories/AppointmentRepository
 * @description Repositorio para acceso a datos de citas médicas.
 * Implementa el patrón Repository para abstraer la capa de persistencia.
 * Principio de inversión de dependencias (DIP): los servicios dependen
 * de esta abstracción, no de la implementación directa de SQL.
 */

import { db } from '../config/db';
import { Appointment, AppointmentStatus } from '../domain/Appointment';

export class AppointmentRepository {

    /**
     * Busca una cita por doctor y fecha/hora exacta.
     * Se usa para validar que no exista conflicto de horario.
     * @param doctorId - ID del médico.
     * @param dateTime - Fecha y hora de la cita.
     * @returns La cita encontrada o undefined.
     */
    async findByDoctorAndDate(doctorId: number, dateTime: string): Promise<any | undefined> {
        const result = await db.query(
            `SELECT * FROM appointments
             WHERE doctor_id = $1
               AND date_time = $2
               AND status NOT IN ('REJECTED')`,
            [doctorId, dateTime]
        );
        return result.rows[0];
    }

    /**
     * Busca una cita por su ID.
     * @param id - ID de la cita.
     * @returns La cita encontrada o undefined.
     */
    async findById(id: number): Promise<any | undefined> {
        const result = await db.query(
            'SELECT * FROM appointments WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    /**
     * Persiste una nueva cita en la base de datos.
     * @param appt - Datos de la cita a crear.
     * @returns La cita creada con su ID asignado.
     */
    async save(appt: Appointment): Promise<any> {
        const result = await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, date_time, reason, amount)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [appt.patientId, appt.doctorId, appt.dateTime, appt.reason || null, appt.amount || 0]
        );
        return result.rows[0];
    }

    /**
     * Actualiza el estado de una cita y opcionalmente el ID de transacción.
     * @param id - ID de la cita.
     * @param status - Nuevo estado.
     * @param txnId - ID de transacción del pago (opcional).
     * @returns La cita actualizada.
     */
    async updateStatus(id: number, status: AppointmentStatus, txnId?: string): Promise<any> {
        const result = await db.query(
            `UPDATE appointments
             SET status = $1, transaction_id = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [status, txnId || null, id]
        );
        return result.rows[0];
    }

    /**
     * Agrega notas del médico a una cita.
     * @param id - ID de la cita.
     * @param notes - Notas a agregar.
     */
    async addNotes(id: number, notes: string): Promise<any> {
        const result = await db.query(
            `UPDATE appointments
             SET notes = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [notes, id]
        );
        return result.rows[0];
    }

    /**
     * Lista las citas de un médico en una fecha específica.
     * Ordenadas cronológicamente.
     * @param doctorId - ID del médico.
     * @param date - Fecha en formato YYYY-MM-DD.
     * @returns Array de citas del día.
     */
    async findByDoctorAndDay(doctorId: number, date: string): Promise<any[]> {
        const result = await db.query(
            `SELECT a.*, u.name AS patient_name, u.email AS patient_email
             FROM appointments a
             JOIN users u ON a.patient_id = u.id
             WHERE a.doctor_id = $1
               AND DATE(a.date_time) = $2
             ORDER BY a.date_time ASC`,
            [doctorId, date]
        );
        return result.rows;
    }

    /**
     * Lista todas las citas de un paciente (historial / correlación).
     * @param patientId - ID del paciente.
     * @returns Array de citas del paciente ordenadas por fecha.
     */
    async findByPatient(patientId: number): Promise<any[]> {
        const result = await db.query(
            `SELECT a.*, u.name AS doctor_name, u.specialty AS doctor_specialty
             FROM appointments a
             JOIN users u ON a.doctor_id = u.id
             WHERE a.patient_id = $1
             ORDER BY a.date_time DESC`,
            [patientId]
        );
        return result.rows;
    }
}
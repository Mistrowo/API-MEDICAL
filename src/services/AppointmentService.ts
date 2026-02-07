/**
 * @module services/AppointmentService
 * @description Servicio de lógica de negocio para citas médicas.
 * Orquesta las validaciones, reglas de negocio y comunicación
 * entre repositorio y pasarela de pago.
 *
 * Principios aplicados:
 * - SRP: Solo contiene lógica de negocio de citas.
 * - OCP: Extensible sin modificar (ej: cambiar pasarela de pago).
 * - DIP: Depende de abstracciones (Repository, PaymentService).
 */

import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { PaymentService } from './PaymentService';
import { TimeValidator } from '../utils/TimeValidator';

/** Monto por defecto de una consulta médica */
const DEFAULT_FEE = parseFloat(process.env.DEFAULT_APPOINTMENT_FEE || '50.00');

export class AppointmentService {
    private repo: AppointmentRepository;
    private payService: PaymentService;

    constructor() {
        this.repo = new AppointmentRepository();
        this.payService = new PaymentService();
    }

    /**
     * Crea una nueva cita médica.
     * Validaciones:
     *  1. La fecha debe ser futura.
     *  2. La hora debe estar dentro del horario de atención.
     *  3. El horario no debe estar ocupado para ese médico.
     *
     * @param patientId - ID del paciente.
     * @param doctorId - ID del médico.
     * @param dateIso - Fecha/hora en formato ISO 8601.
     * @param reason - Motivo de la consulta (opcional).
     * @returns La cita creada.
     */
    async create(patientId: number, doctorId: number, dateIso: string, reason?: string) {
        const date = new Date(dateIso);

        // Validar formato de fecha
        if (isNaN(date.getTime())) {
            throw new Error('Formato de fecha inválido. Use ISO 8601 (ej: 2025-06-15T09:00:00Z)');
        }

        // Validar que la fecha sea futura
        if (!TimeValidator.isFutureDate(date)) {
            throw new Error('No se puede agendar una cita en el pasado');
        }

        // Validar horario de atención
        if (!TimeValidator.isValid(date)) {
            throw new Error(
                `Horario no permitido. Horario de atención: ${TimeValidator.getScheduleDescription()}`
            );
        }

        // Validar disponibilidad del médico
        const existing = await this.repo.findByDoctorAndDate(doctorId, dateIso);
        if (existing) {
            throw new Error('El médico ya tiene una cita agendada en ese horario');
        }

        return await this.repo.save({
            patientId,
            doctorId,
            dateTime: date,
            reason,
            status: 'PENDING_PAYMENT',
            amount: DEFAULT_FEE,
        });
    }

    /**
     * Procesa el pago de una cita.
     * Validaciones:
     *  1. La cita debe existir.
     *  2. La cita debe estar en estado PENDING_PAYMENT.
     *
     * @param appointmentId - ID de la cita a pagar.
     * @returns La cita actualizada con datos de transacción.
     */
    async pay(appointmentId: number) {
        const appointment = await this.repo.findById(appointmentId);

        if (!appointment) {
            throw new Error('Cita no encontrada');
        }

        if (appointment.status !== 'PENDING_PAYMENT') {
            throw new Error(`No se puede pagar una cita con estado: ${appointment.status}`);
        }

        const fee = appointment.amount || DEFAULT_FEE;
        const paymentResult = await this.payService.process(fee);

        return await this.repo.updateStatus(
            appointmentId,
            'PAID',
            paymentResult.transactionId
        );
    }

    /**
     * Confirma una cita (acción del médico).
     * Validación: la cita debe estar pagada (estado PAID).
     *
     * @param appointmentId - ID de la cita.
     * @param notes - Notas opcionales del médico.
     * @returns La cita confirmada.
     */
    async confirm(appointmentId: number, notes?: string) {
        const appointment = await this.repo.findById(appointmentId);

        if (!appointment) {
            throw new Error('Cita no encontrada');
        }

        if (appointment.status !== 'PAID') {
            throw new Error('Solo se pueden confirmar citas que ya han sido pagadas');
        }

        const updated = await this.repo.updateStatus(appointmentId, 'CONFIRMED');

        // Si el médico agregó notas, guardarlas
        if (notes) {
            return await this.repo.addNotes(appointmentId, notes);
        }

        return updated;
    }

    /**
     * Rechaza una cita (acción del médico).
     * Validación: solo citas PAID o PENDING_PAYMENT pueden ser rechazadas.
     *
     * @param appointmentId - ID de la cita.
     * @param notes - Motivo del rechazo.
     * @returns La cita rechazada.
     */
    async reject(appointmentId: number, notes?: string) {
        const appointment = await this.repo.findById(appointmentId);

        if (!appointment) {
            throw new Error('Cita no encontrada');
        }

        if (appointment.status === 'CONFIRMED') {
            throw new Error('No se puede rechazar una cita ya confirmada');
        }

        if (appointment.status === 'REJECTED') {
            throw new Error('La cita ya fue rechazada');
        }

        const updated = await this.repo.updateStatus(appointmentId, 'REJECTED');

        if (notes) {
            return await this.repo.addNotes(appointmentId, notes);
        }

        return updated;
    }

    /**
     * Lista las citas del día de un médico (agenda diaria).
     * @param doctorId - ID del médico.
     * @param date - Fecha en formato YYYY-MM-DD.
     * @returns Array de citas del día.
     */
    async listDaily(doctorId: number, date: string) {
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }

        return await this.repo.findByDoctorAndDay(doctorId, date);
    }

    /**
     * Correlación de citas por paciente (historial completo).
     * @param patientId - ID del paciente.
     * @returns Historial de citas del paciente.
     */
    async listByPatient(patientId: number) {
        return await this.repo.findByPatient(patientId);
    }
}
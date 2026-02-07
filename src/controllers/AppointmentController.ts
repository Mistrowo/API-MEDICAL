/**
 * @module controllers/AppointmentController
 * @description Controlador de citas médicas.
 * Maneja las peticiones HTTP y delega la lógica al servicio.
 * Separado de las rutas para cumplir con el principio SRP.
 */

import { Request, Response } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { User } from '../domain/User';

export class AppointmentController {
    private service: AppointmentService;

    constructor() {
        this.service = new AppointmentService();
    }

    /**
     * POST /appointments
     * Crea una nueva cita médica (solo pacientes).
     * Body: { doctorId, date, reason? }
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const user: User = res.locals.user;
            const { doctorId, date, reason } = req.body;

            if (!doctorId || !date) {
                res.status(400).json({ error: 'Se requiere doctorId y date' });
                return;
            }

            const result = await this.service.create(user.id, doctorId, date, reason);
            res.status(201).json({
                message: 'Cita creada exitosamente. Pendiente de pago.',
                data: result,
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    };

    /**
     * POST /appointments/:id/pay
     * Procesa el pago de una cita (solo pacientes).
     */
    pay = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.pay(Number(req.params.id));
            res.json({
                message: 'Pago procesado exitosamente (Sandbox)',
                data: result,
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    };

    /**
     * PATCH /appointments/:id/confirm
     * Confirma una cita pagada (solo médicos).
     * Body: { notes? }
     */
    confirm = async (req: Request, res: Response): Promise<void> => {
        try {
            const { notes } = req.body;
            const result = await this.service.confirm(Number(req.params.id), notes);
            res.json({
                message: 'Cita confirmada por el médico',
                data: result,
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    };

    /**
     * PATCH /appointments/:id/reject
     * Rechaza una cita (solo médicos).
     * Body: { notes? }
     */
    reject = async (req: Request, res: Response): Promise<void> => {
        try {
            const { notes } = req.body;
            const result = await this.service.reject(Number(req.params.id), notes);
            res.json({
                message: 'Cita rechazada por el médico',
                data: result,
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    };

    /**
     * GET /appointments/agenda?date=YYYY-MM-DD
     * Lista las citas del día del médico autenticado.
     */
    agenda = async (req: Request, res: Response): Promise<void> => {
        try {
            const user: User = res.locals.user;
            const date = req.query.date as string;

            if (!date) {
                res.status(400).json({ error: 'Se requiere el parámetro ?date=YYYY-MM-DD' });
                return;
            }

            const result = await this.service.listDaily(user.id, date);
            res.json({
                doctor: user.name,
                date,
                total: result.length,
                appointments: result,
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    };

    /**
     * GET /appointments/history
     * Historial de citas del paciente autenticado (correlación).
     */
    history = async (req: Request, res: Response): Promise<void> => {
        try {
            const user: User = res.locals.user;
            const result = await this.service.listByPatient(user.id);
            res.json({
                patient: user.name,
                total: result.length,
                appointments: result,
            });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    };
}
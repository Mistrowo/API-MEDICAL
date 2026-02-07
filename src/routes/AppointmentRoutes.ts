/**
 * @module routes/AppointmentRoutes
 * @description Definición de rutas para el recurso de citas médicas.
 * Cada ruta aplica autenticación (auth) y autorización por rol (authorize).
 * La lógica de negocio está delegada al AppointmentController.
 *
 * Endpoints:
 *   POST   /appointments              → Crear cita (PATIENT)
 *   POST   /appointments/:id/pay      → Pagar cita (PATIENT)
 *   PATCH  /appointments/:id/confirm  → Confirmar cita (DOCTOR)
 *   PATCH  /appointments/:id/reject   → Rechazar cita (DOCTOR)
 *   GET    /appointments/agenda       → Agenda del día (DOCTOR)
 *   GET    /appointments/history      → Historial del paciente (PATIENT)
 */

import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import { AppointmentController } from '../controllers/AppointmentController';

const router = Router();
const controller = new AppointmentController();

// ── Endpoints del Paciente ─────────────────────────────────
router.post('/',        auth, authorize('PATIENT'), controller.create);
router.post('/:id/pay', auth, authorize('PATIENT'), controller.pay);
router.get('/history',  auth, authorize('PATIENT'), controller.history);

// ── Endpoints del Médico ───────────────────────────────────
router.patch('/:id/confirm', auth, authorize('DOCTOR'), controller.confirm);
router.patch('/:id/reject',  auth, authorize('DOCTOR'), controller.reject);
router.get('/agenda',        auth, authorize('DOCTOR'),  controller.agenda);

export default router;
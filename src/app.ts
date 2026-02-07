/**
 * @module app
 * @description Configuración principal de la aplicación Express.
 * Registra middlewares de seguridad, parseo de JSON y rutas.
 */

import express from 'express';
import helmet from 'helmet';
import appointmentRoutes from './routes/AppointmentRoutes';

const app = express();

// ── Middlewares globales ────────────────────────────────────
app.use(helmet());                // Headers de seguridad
app.use(express.json());          // Parseo de JSON en body

// ── Rutas ───────────────────────────────────────────────────
app.use('/appointments', appointmentRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Manejo global de errores ────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
/**
 * @module middleware/auth
 * @description Middleware de autenticación por token.
 * Valida el token enviado en el header Authorization y adjunta
 * la información del usuario autenticado en res.locals.user.
 *
 * Uso: Se aplica a todas las rutas protegidas.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { User } from '../domain/User';

/**
 * Middleware que autentica al usuario mediante token en el header.
 * - Si no se envía token → 401 Unauthorized
 * - Si el token no existe en BD → 403 Forbidden
 * - Si es válido → almacena el usuario en res.locals.user
 */
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            res.status(401).json({ error: 'Token de autenticación requerido' });
            return;
        }

        const result = await db.query('SELECT * FROM users WHERE token = $1', [token]);

        if (result.rowCount === 0) {
            res.status(403).json({ error: 'Token inválido o expirado' });
            return;
        }

        // Se almacena en res.locals (no en req.body) para no contaminar el body
        const row = result.rows[0];
        const user: User = {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            specialty: row.specialty,
            token: row.token,
        };
        res.locals.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error interno de autenticación' });
    }
};

/**
 * Factory de middleware que restringe el acceso según el rol del usuario.
 * @param roles - Roles permitidos para acceder al recurso.
 * @returns Middleware que valida el rol.
 *
 * @example
 *   router.get('/agenda', auth, authorize('DOCTOR'), controller.agenda);
 */
export const authorize = (...roles: string[]) => {
    return (_req: Request, res: Response, next: NextFunction): void => {
        const user: User = res.locals.user;

        if (!roles.includes(user.role)) {
            res.status(403).json({
                error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
            });
            return;
        }

        next();
    };
};
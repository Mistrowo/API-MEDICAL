/**
 * @module config/db
 * @description Configuración de conexión a PostgreSQL usando el patrón Singleton.
 * Garantiza una única instancia del Pool de conexiones en toda la aplicación.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

class Database {
    private static instance: Pool;

    private constructor() {}

    /**
     * Retorna la instancia única del Pool de conexiones.
     * Si no existe, la crea con la URL de la variable de entorno DATABASE_URL.
     */
    public static getInstance(): Pool {
        if (!Database.instance) {
            Database.instance = new Pool({
                connectionString: process.env.DATABASE_URL,
            });
        }
        return Database.instance;
    }
}

export const db = Database.getInstance();
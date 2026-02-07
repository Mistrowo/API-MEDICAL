/**
 * @module config/db
 * @description Configuración de conexión a MySQL usando el patrón Singleton.
 * Garantiza una única instancia del Pool de conexiones en toda la aplicación.
 * Compatible con XAMPP (MySQL/MariaDB).
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
    private static instance: mysql.Pool;

    private constructor() {}

    /**
     * Retorna la instancia única del Pool de conexiones.
     * Si no existe, la crea con las variables de entorno configuradas.
     */
    public static getInstance(): mysql.Pool {
        if (!Database.instance) {
            Database.instance = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'medical_api',
                waitForConnections: true,
                connectionLimit: 10,
            });
        }
        return Database.instance;
    }
}

export const db = Database.getInstance();
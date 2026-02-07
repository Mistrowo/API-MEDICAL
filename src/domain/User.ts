/**
 * @module domain/User
 * @description Entidad de dominio que representa un usuario del sistema.
 * Los usuarios pueden tener rol de PATIENT (paciente) o DOCTOR (médico).
 */

/** Roles disponibles en el sistema */
export type UserRole = 'PATIENT' | 'DOCTOR';

/** Interfaz que modela un usuario */
export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    specialty?: string;
    token: string;
    createdAt?: Date;
}
/**
 * @module utils/TimeValidator
 * @description Validador de horarios de atención médica.
 * Horario permitido: 7:00–12:00 (mañana) y 14:00–18:00 (tarde).
 * Aplica el principio de responsabilidad única (SRP).
 */

export class TimeValidator {
    /** Hora de inicio del turno matutino */
    private static readonly MORNING_START = 7;
    /** Hora de fin del turno matutino (exclusivo) */
    private static readonly MORNING_END = 12;
    /** Hora de inicio del turno vespertino */
    private static readonly AFTERNOON_START = 14;
    /** Hora de fin del turno vespertino (exclusivo) */
    private static readonly AFTERNOON_END = 18;

    /**
     * Valida que la fecha proporcionada caiga dentro del horario de atención.
     * @param date - Fecha y hora a validar.
     * @returns true si el horario es válido, false en caso contrario.
     */
    static isValid(date: Date): boolean {
        if (isNaN(date.getTime())) return false;

        const hour = date.getUTCHours();
        const isMorning = hour >= this.MORNING_START && hour < this.MORNING_END;
        const isAfternoon = hour >= this.AFTERNOON_START && hour < this.AFTERNOON_END;

        return isMorning || isAfternoon;
    }

    /**
     * Valida que la fecha no sea en el pasado.
     * @param date - Fecha a validar.
     * @returns true si la fecha es futura.
     */
    static isFutureDate(date: Date): boolean {
        return date.getTime() > Date.now();
    }

    /**
     * Retorna una descripción legible del horario de atención.
     */
    static getScheduleDescription(): string {
        return `Lunes a Viernes: ${this.MORNING_START}:00–${this.MORNING_END}:00 y ${this.AFTERNOON_START}:00–${this.AFTERNOON_END}:00`;
    }
}
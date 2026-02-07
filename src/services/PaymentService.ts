/**
 * @module services/PaymentService
 * @description Servicio de pasarela de pago en modo Sandbox.
 * Simula el procesamiento de un pago generando un ID de transacción único.
 *
 * Patrón Strategy: esta clase podría ser reemplazada por una
 * implementación real (Stripe, PayPal, etc.) sin afectar el servicio
 * de citas, cumpliendo con el principio abierto/cerrado (OCP).
 */

import { v4 as uuidv4 } from 'uuid';

/** Resultado de un pago procesado */
export interface PaymentResult {
    transactionId: string;
    amount: number;
    currency: string;
    status: 'APPROVED' | 'REJECTED';
    gateway: string;
    processedAt: Date;
}

export class PaymentService {

    private readonly gateway = 'SANDBOX';
    private readonly currency = 'USD';

    /**
     * Procesa un pago en el ambiente sandbox.
     * En producción, aquí se conectaría con la API de la pasarela real.
     *
     * @param amount - Monto a cobrar.
     * @returns Resultado del pago con ID de transacción.
     * @throws Error si el monto es inválido.
     */
    async process(amount: number): Promise<PaymentResult> {
        // Validación del monto
        if (amount <= 0) {
            throw new Error('El monto del pago debe ser mayor a 0');
        }

        // Simulación de latencia de pasarela (50-200ms)
        await this.simulateGatewayLatency();

        // Generar transacción exitosa (sandbox siempre aprueba)
        const result: PaymentResult = {
            transactionId: `TXN-${uuidv4()}`,
            amount,
            currency: this.currency,
            status: 'APPROVED',
            gateway: this.gateway,
            processedAt: new Date(),
        };

        return result;
    }

    /**
     * Simula la latencia de una pasarela de pago real.
     */
    private async simulateGatewayLatency(): Promise<void> {
        const delay = Math.floor(Math.random() * 150) + 50;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}
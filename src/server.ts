/**
 * @module server
 * @description Punto de entrada de la aplicación.
 * Inicia el servidor Express en el puerto configurado.
 */

import app from './app';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});
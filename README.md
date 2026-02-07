# 🏥 API RESTful — Citas Médicas

API para gestión de citas médicas con autenticación por token, pasarela de pago sandbox y control de roles (Paciente / Médico).

---

## 📋 Tabla de Contenido

1. [Tecnologías](#tecnologías)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Patrones y Principios Aplicados](#patrones-y-principios-aplicados)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Base de Datos](#base-de-datos)
6. [Endpoints de la API](#endpoints-de-la-api)
7. [Autenticación y Roles](#autenticación-y-roles)
8. [Validaciones](#validaciones)
9. [Pruebas Unitarias](#pruebas-unitarias)
10. [Estrategia de Ramas (Git Flow)](#estrategia-de-ramas-git-flow)

---

## Tecnologías

| Tecnología   | Versión  | Uso                          |
|-------------|----------|------------------------------|
| Node.js     | 18+      | Runtime                      |
| TypeScript  | 5.3      | Lenguaje tipado              |
| Express     | 4.18     | Framework HTTP               |
| PostgreSQL  | 14+      | Base de datos relacional     |
| Helmet      | 7.1      | Headers de seguridad HTTP    |
| Jest        | 29.7     | Framework de pruebas         |
| uuid        | 9.0      | Generación de IDs de transacción |

---

## Arquitectura del Proyecto

```
medical-appointments-api/
├── src/
│   ├── config/
│   │   └── db.ts                  # Conexión a PostgreSQL (Singleton)
│   ├── controllers/
│   │   └── AppointmentController.ts  # Manejo de peticiones HTTP
│   ├── domain/
│   │   ├── Appointment.ts         # Entidad de cita médica
│   │   └── User.ts               # Entidad de usuario
│   ├── middleware/
│   │   └── auth.ts               # Autenticación y autorización
│   ├── repositories/
│   │   └── AppointmentRepository.ts  # Acceso a datos (SQL)
│   ├── routes/
│   │   └── AppointmentRoutes.ts   # Definición de rutas
│   ├── services/
│   │   ├── AppointmentService.ts  # Lógica de negocio
│   │   └── PaymentService.ts     # Pasarela de pago sandbox
│   ├── utils/
│   │   └── TimeValidator.ts      # Validación de horarios
│   ├── app.ts                    # Configuración de Express
│   └── server.ts                 # Punto de entrada
├── tests/
│   ├── AppointmentService.test.ts
│   ├── PaymentService.test.ts
│   └── TimeValidator.test.ts
├── init.sql                       # Script de creación de BD
├── .env.example                   # Variables de entorno (plantilla)
├── .gitignore
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Patrones y Principios Aplicados

### Patrones de Diseño

| Patrón      | Ubicación                | Descripción                                                  |
|------------|--------------------------|--------------------------------------------------------------|
| Repository | `AppointmentRepository`  | Abstrae el acceso a datos, desacoplando la lógica de SQL     |
| Singleton  | `config/db.ts`           | Una única instancia del Pool de conexiones a PostgreSQL      |
| Strategy   | `PaymentService`         | Intercambiable por una pasarela real sin modificar el servicio|
| MVC        | Controllers/Routes/Services | Separación de responsabilidades por capas                 |

### Principios SOLID

| Principio                      | Aplicación                                                                 |
|-------------------------------|----------------------------------------------------------------------------|
| **S** — Responsabilidad Única | Cada clase tiene un propósito definido (Controller, Service, Repository)   |
| **O** — Abierto/Cerrado       | PaymentService puede ser reemplazado sin modificar AppointmentService      |
| **L** — Sustitución de Liskov | Los servicios respetan contratos de interfaces                            |
| **I** — Segregación de Interfaces | Interfaces pequeñas y específicas (Appointment, User)                 |
| **D** — Inversión de Dependencias | Los servicios dependen de abstracciones (Repository), no de SQL directo|

---

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd medical-appointments-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los datos de tu PostgreSQL

# 4. Crear la base de datos y ejecutar el script
psql -U postgres -c "CREATE DATABASE medical_api;"
psql -U postgres -d medical_api -f init.sql

# 5. Ejecutar en modo desarrollo
npm run dev

# 6. Ejecutar pruebas
npm test
```

### Scripts Disponibles

| Comando          | Descripción                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Inicia el servidor en modo desarrollo    |
| `npm run build` | Compila TypeScript a JavaScript          |
| `npm start`     | Ejecuta la versión compilada (producción)|
| `npm test`      | Ejecuta las pruebas unitarias con cobertura |
| `npm run test:watch` | Ejecuta pruebas en modo watch       |

---

## Base de Datos

Motor: **PostgreSQL**

### Diagrama de Tablas

```
┌──────────────────────────┐       ┌──────────────────────────────┐
│         users            │       │       appointments           │
├──────────────────────────┤       ├──────────────────────────────┤
│ id          SERIAL PK    │──┐    │ id              SERIAL PK    │
│ name        VARCHAR(100) │  │    │ patient_id      INT FK ──────│──→ users.id
│ email       VARCHAR(150) │  │    │ doctor_id       INT FK ──────│──→ users.id
│ role        VARCHAR(20)  │  └────│ date_time       TIMESTAMP    │
│ specialty   VARCHAR(100) │       │ reason          VARCHAR(255) │
│ token       VARCHAR(255) │       │ status          VARCHAR(20)  │
│ created_at  TIMESTAMP    │       │ transaction_id  VARCHAR(100) │
└──────────────────────────┘       │ amount          DECIMAL(10,2)│
                                   │ notes           TEXT          │
                                   │ created_at      TIMESTAMP    │
                                   │ updated_at      TIMESTAMP    │
                                   └──────────────────────────────┘
```

### Estados de una Cita (Ciclo de Vida)

```
PENDING_PAYMENT  ──(pago)──→  PAID  ──(médico confirma)──→  CONFIRMED
                                    ──(médico rechaza)───→  REJECTED
```

---

## Endpoints de la API

### Base URL: `http://localhost:3000`

### 1. Crear Cita — `POST /appointments`

**Rol requerido:** PATIENT

```bash
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: patient-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": 3,
    "date": "2025-07-15T09:00:00Z",
    "reason": "Dolor de cabeza persistente"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "message": "Cita creada exitosamente. Pendiente de pago.",
  "data": {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 3,
    "date_time": "2025-07-15T09:00:00.000Z",
    "reason": "Dolor de cabeza persistente",
    "status": "PENDING_PAYMENT",
    "amount": "50.00"
  }
}
```

### 2. Pagar Cita — `POST /appointments/:id/pay`

**Rol requerido:** PATIENT

```bash
curl -X POST http://localhost:3000/appointments/1/pay \
  -H "Authorization: patient-token-123"
```

**Respuesta exitosa (200):**
```json
{
  "message": "Pago procesado exitosamente (Sandbox)",
  "data": {
    "id": 1,
    "status": "PAID",
    "transaction_id": "TXN-a1b2c3d4-e5f6-..."
  }
}
```

### 3. Confirmar Cita — `PATCH /appointments/:id/confirm`

**Rol requerido:** DOCTOR

```bash
curl -X PATCH http://localhost:3000/appointments/1/confirm \
  -H "Authorization: doctor-token-789" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Traer estudios previos" }'
```

**Respuesta exitosa (200):**
```json
{
  "message": "Cita confirmada por el médico",
  "data": { "id": 1, "status": "CONFIRMED", "notes": "Traer estudios previos" }
}
```

### 4. Rechazar Cita — `PATCH /appointments/:id/reject`

**Rol requerido:** DOCTOR

```bash
curl -X PATCH http://localhost:3000/appointments/1/reject \
  -H "Authorization: doctor-token-789" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "No tengo disponibilidad esa fecha" }'
```

**Respuesta exitosa (200):**
```json
{
  "message": "Cita rechazada por el médico",
  "data": { "id": 1, "status": "REJECTED", "notes": "No tengo disponibilidad esa fecha" }
}
```

### 5. Agenda del Día — `GET /appointments/agenda?date=YYYY-MM-DD`

**Rol requerido:** DOCTOR

```bash
curl http://localhost:3000/appointments/agenda?date=2025-07-15 \
  -H "Authorization: doctor-token-789"
```

**Respuesta exitosa (200):**
```json
{
  "doctor": "Dr. House",
  "date": "2025-07-15",
  "total": 2,
  "appointments": [
    { "id": 1, "patient_name": "Alex Paciente", "date_time": "2025-07-15T09:00:00Z", "status": "CONFIRMED" },
    { "id": 2, "patient_name": "María López", "date_time": "2025-07-15T10:00:00Z", "status": "PAID" }
  ]
}
```

### 6. Historial del Paciente — `GET /appointments/history`

**Rol requerido:** PATIENT

```bash
curl http://localhost:3000/appointments/history \
  -H "Authorization: patient-token-123"
```

**Respuesta exitosa (200):**
```json
{
  "patient": "Alex Paciente",
  "total": 3,
  "appointments": [
    { "id": 3, "doctor_name": "Dra. Grey", "doctor_specialty": "Cardiología", "date_time": "2025-07-20T14:00:00Z", "status": "PENDING_PAYMENT" },
    { "id": 1, "doctor_name": "Dr. House", "doctor_specialty": "Medicina General", "date_time": "2025-07-15T09:00:00Z", "status": "CONFIRMED" }
  ]
}
```

### 7. Health Check — `GET /health`

```bash
curl http://localhost:3000/health
```

---

## Autenticación y Roles

La autenticación se realiza mediante un **token estático** enviado en el header `Authorization`.

| Usuario          | Rol     | Token               |
|-----------------|---------|---------------------|
| Alex Paciente   | PATIENT | `patient-token-123` |
| María López     | PATIENT | `patient-token-456` |
| Dr. House       | DOCTOR  | `doctor-token-789`  |
| Dra. Grey       | DOCTOR  | `doctor-token-012`  |

### Permisos por Rol

| Acción             | PATIENT | DOCTOR |
|-------------------|---------|--------|
| Crear cita        | ✅       | ❌      |
| Pagar cita        | ✅       | ❌      |
| Ver historial     | ✅       | ❌      |
| Confirmar cita    | ❌       | ✅      |
| Rechazar cita     | ❌       | ✅      |
| Ver agenda del día| ❌       | ✅      |

---

## Validaciones

| Validación                                         | Endpoint afectado        |
|---------------------------------------------------|--------------------------|
| Token de autenticación requerido                   | Todos                    |
| Token válido y existente en BD                     | Todos                    |
| Solo pacientes pueden crear citas                  | POST /appointments       |
| Solo pacientes pueden pagar citas                  | POST /appointments/:id/pay |
| Solo médicos pueden confirmar/rechazar             | PATCH /appointments/:id/* |
| Fecha en formato ISO 8601 válido                   | POST /appointments       |
| Fecha debe ser futura                              | POST /appointments       |
| Horario de atención: 7:00–12:00 y 14:00–18:00     | POST /appointments       |
| No se puede agendar en horario ya ocupado          | POST /appointments       |
| Solo se paga una cita con estado PENDING_PAYMENT   | POST /appointments/:id/pay |
| Solo se confirma una cita con estado PAID          | PATCH /appointments/:id/confirm |
| No se puede rechazar una cita ya confirmada        | PATCH /appointments/:id/reject |
| Formato de fecha YYYY-MM-DD para agenda            | GET /appointments/agenda |

---
## Estrategia de Ramas (Git Flow)

### Ramas Principales

| Rama   | Propósito                                                    |
|--------|--------------------------------------------------------------|
| `main` | Código en producción, estable y listo para despliegue        |
| `dev`  | Rama de integración donde se consolidan las features         |

### Ramas de Feature

Cada funcionalidad se desarrolla en una rama independiente creada desde `dev`:

```
main
 └── dev
      ├── feature/init-project
      ├── feature/database-setup
      ├── feature/auth-middleware
      ├── feature/create-appointment
      ├── feature/payment-sandbox
      ├── feature/api-endpoints
      ├── feature/unit-tests
      └── feature/documentation
```

### Flujo de Trabajo

```
feature/xxx  ──(merge)──→  dev  ──(merge)──→  main
```

### Convención de Commits

Se utiliza [Conventional Commits](https://www.conventionalcommits.org/):

| Prefijo    | Uso                                      |
|-----------|------------------------------------------|
| `feat:`   | Nueva funcionalidad                      |
| `fix:`    | Corrección de errores                    |
| `test:`   | Agregar o corregir pruebas               |
| `docs:`   | Cambios en documentación                 |
| `chore:`  | Tareas de mantenimiento                  |
| `refactor:` | Refactorización sin cambio funcional   |

---

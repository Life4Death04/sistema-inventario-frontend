# Sistema de Gestión de Inventario — HighMeds Pharmacy

## Descripción General

Sistema web de gestión de inventario para farmacia, diseñado para administrar productos, categorías, proveedores, usuarios, movimientos de stock, alertas de inventario y solicitudes de reposición. El sistema sigue una arquitectura de dos capas desacopladas (frontend y backend) que se comunican mediante una API REST.

# Arquitectura General del Sistema

La arquitectura del sistema está dividida en tres capas principales que interactúan entre sí para garantizar un flujo de datos eficiente y estructurado.

## 1. Frontend (Interfaz de Cliente)
* **Tecnologías base:** Desarrollado utilizando **React 18** junto con **TypeScript** para asegurar un código robusto y tipado.
* **Manejo de datos:** Implementa **TanStack Query** para optimizar la gestión del estado asíncrono y la caché de la aplicación.
* **Conectividad:** Utiliza el cliente HTTP **Axios** para gestionar las peticiones hacia el servidor.

## 2. Backend (Servidor y Base de Datos)
* **Servidor:** Construido sobre el framework **Express 4** e implementando **TypeScript** para la lógica de negocio.
* **Gestión de datos:** Emplea **PostgreSQL 15** como motor de base de datos relacional.
* **Integración de datos:** Utiliza **Prisma ORM** como puente seguro y eficiente para que el servidor interactúe con la base de datos PostgreSQL.

## 3. Servicios Externos
* El sistema cuenta con una integración a la **API de Twilio**, dedicada a la gestión y salida de comunicaciones externas.

## 4. Flujo de Comunicación
* El Frontend se comunica con el Backend mediante una arquitectura **API REST**, intercambiando información estructurada en formato **JSON**.
* Cuando el sistema lo requiere, el Backend se encarga de comunicarse con la API de Twilio para disparar el envío de **notificaciones vía WhatsApp**.

---

## Diagrama de Arquitectura

```mermaid
graph LR
    subgraph Frontend
        A[React 18 + TypeScript] --> B[TanStack Query]
        B --> C[Axios HTTP Client]
    end
    subgraph Backend
        D[Express 4 + TypeScript] --> E[Prisma ORM]
        E --> F[PostgreSQL 15]
    end
    subgraph External
        G[Twilio API]
    end
    C -->|REST API JSON| D
    D -->|WhatsApp notifications| G

### Frontend (`sistema-inventario-frontend`)

| Capa           | Tecnología                          |
|----------------|-------------------------------------|
| Framework      | React 18 + TypeScript 5.9           |
| Build tool     | Vite 7 + SWC                        |
| Routing        | React Router DOM 7                  |
| Estado server  | TanStack Query 5                    |
| Estado global  | Zustand 5                           |
| Forms          | React Hook Form 7 + Zod 4           |
| Estilos        | Tailwind CSS 4 + Lucide React icons |
| Tablas         | TanStack React Table 8              |
| Notificaciones | React Hot Toast                     |
| E2E tests      | Playwright 1.61                     |

### Backend (`sistema-inventario-backend`)

| Capa              | Tecnología                         |
|-------------------|------------------------------------|
| Runtime           | Node.js 20 LTS                     |
| Framework         | Express 4 + TypeScript 5.4         |
| ORM               | Prisma 5 + PostgreSQL 15           |
| Validación        | Zod 3                              |
| Autenticación     | JWT (HS256) + Refresh Token cookie |
| Logging           | Pino + pino-http                   |
| Rate limiting     | express-rate-limit                 |
| Seguridad         | Helmet + CORS configurable         |
| Notificaciones    | Twilio (WhatsApp)                  |
| Test unitarios    | Vitest 1.6 + Supertest 7           |
| Calidad           | ESLint + Prettier + Husky          |

## Modelo de Datos — 7 modelos, 6 enums

| Modelo                    | Descripción                                      |
|---------------------------|--------------------------------------------------|
| `User`                    | Administradores, gerentes y operadores del sistema |
| `RefreshToken`            | Allowlist de tokens JWT refresh en BD             |
| `Category`                | Clasificación de productos (Analgésicos, etc.)    |
| `Product`                 | Productos farmacéuticos con código, stock, precio |
| `Supplier`                | Proveedores con RIF, WhatsApp y dirección         |
| `ProductSupplier`         | Join explícito M:N con precio de referencia       |
| `InventoryMovement`       | Auditoría inmutable de cambios de stock           |
| `Alert`                   | Alertas LOW_STOCK / OUT_OF_STOCK por producto     |
| `ReplenishmentRequest`    | Solicitudes de reposición a proveedores           |
| `ReplenishmentRequestItem`| Productos dentro de una solicitud de reposición   |

**IDs**: `cuid()` — k-sorted, URL-safe, sin leak de cantidad de registros.

## Módulos del Backend — API REST

| Módulo                    | Endpoints principales                                  |
|---------------------------|--------------------------------------------------------|
| `auth`                    | Login, refresh, logout, GET /me                        |
| `health`                  | GET /api/health (pública, verifica DB)                 |
| `categories`              | CRUD completo (POST, GET, PATCH, DELETE)               |
| `suppliers`               | CRUD completo + soft-delete + búsqueda                 |
| `users`                   | CRUD completo + guards (último admin, auto-modificación) |
| `products`                | CRUD completo + attach/detach proveedores              |
| `inventory-movements`     | Creación inmutable + listado por producto              |
| `alerts`                  | Listado + detalle + crear reposición desde alerta      |
| `replenishment-requests`  | CRUD + state machine: PENDING → SENT → RECEIVED / CANCELLED |

### Matriz de permisos

| Rol        | Lecturas | Mutaciones | Usuarios |
|------------|----------|------------|----------|
| `ADMIN`    | ✅ Todas | ✅ Todas   | ✅ Full  |
| `MANAGER`  | ✅ Todas | ✅ Todas   | ❌       |
| `OPERATOR` | ✅ Todas | ❌         | ❌       |

## Módulos del Frontend — 5 páginas principales

| Página           | Ruta              | Funcionalidad                                    |
|------------------|-------------------|--------------------------------------------------|
| Dashboard        | `/dashboard`      | Resumen del sistema                              |
| Productos        | `/productos`      | Catálogo CRUD con búsqueda y proveedores         |
| Categorías       | (modal global)    | Gestión de categorías con slider lateral         |
| Proveedores      | `/proveedores`    | CRUD con filtros activos/inactivos               |
| Usuarios         | `/usuarios`       | CRUD de usuarios del sistema                     |
| Inventario       | `/inventario`     | Existencias derivadas de productos + movimientos |
| Movimientos      | `/movimientos`    | Auditoría de cambios de stock                    |
| Alertas          | `/alertas`        | Alertas LOW_STOCK / OUT_OF_STOCK derivadas       |
| Reposición       | `/reposicion`     | Solicitudes de reposición + state machine        |

## Plan de Pruebas

### Backend — Smoke tests funcionales (Vitest + Supertest)

| Suite                  | Escenarios | Cobertura principal                                    |
|------------------------|------------|--------------------------------------------------------|
| `health`               | 3          | DB up/down, sin autenticación                          |
| `auth`                 | 14         | Login, refresh, logout, me, requireRole                |
| `categories`           | 16         | CRUD, duplicados, borrado con productos asociados      |
| `suppliers`            | 18         | CRUD, RIF duplicado/nulo, soft-delete                  |
| `users`                | 15         | CRUD, último admin, auto-modificación, password oculto |
| `products`             | 18+        | CRUD, attach/detach proveedor, filtros, rol matrix     |
| `inventory-movements`  | 34+        | Creación (15 escenarios), inmutabilidad, rollback      |
| `alerts`               | 15+        | Listado, detalle, create-replenishment, reconcile      |
| `replenishment-requests` | 12+      | CRUD, state machine SEND/RECEIVE/CANCEL, notificación  |

### Frontend — E2E (Playwright, modo serial)

| Suite                    | Flujo                                              |
|--------------------------|----------------------------------------------------|
| `login`                  | Autenticación admin, verificación de token JWT     |
| `admin-connected`        | CRUD categorías → proveedores → usuarios → productos|

## Flujo de Autenticación

```
POST /api/auth/login { email, password }
  → 200 { user, token: accessJwt } + Set-Cookie: refresh_token (HttpOnly)

Protected requests → Authorization: Bearer <accessJwt>
  → authenticate middleware: verifica HS256 + expiry + setea req.user

POST /api/auth/refresh (cookie enviada automáticamente)
  → Verifica JWT + lookup jti en BD → rota token → nuevas credenciales

POST /api/auth/logout → Revoca jti + limpia cookie → 204
```

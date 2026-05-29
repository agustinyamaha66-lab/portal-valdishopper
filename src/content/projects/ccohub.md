---
title: "CCOHUB - Central de Control Operativo"
type: "Fullstack"
status: "Completado"
technologies: ["React", "Node.js", "PostgreSQL", "Tailwind CSS", "GCP"]
gcp_cost: "$120,777"
gcp_cost_previous: "$172,538"
gcp_cost_trend: "down"
gcp_cost_change: "30%"
repo: github.com/deploy-vs2026
screenshots: [ccohub-inicio.png, ccohub-portal.png, ccohub-reteador.png]
---

# Documentación Técnica y Arquitectura del Proyecto CCOHUB

## 1. Visión General
El proyecto **CCOHUB (Central de Control Operativo)** es una plataforma web orientada a la gestión y monitoreo logístico, de transporte, operaciones y finanzas para Valdishopper. Su propósito principal es proveer a los equipos operativos, supervisores y personal administrativo herramientas centralizadas para controlar flotas (catastro de patentes), gestionar devoluciones (mediante carga manual o de Excel), realizar seguimiento de rutas y puntualidad (Torre de Control), así como generar reportes financieros y operativos. El objetivo es optimizar la trazabilidad de la operación diaria, mejorar la calidad de datos logísticos y facilitar la toma de decisiones.

## 2. Stack Tecnológico
El proyecto utiliza una arquitectura moderna basada en JavaScript/TypeScript, separando claramente el frontend del backend:

### Frontend
- **Framework Core:** React 19 y Vite para un empaquetado ultra-rápido y Hot Module Replacement (HMR).
- **Enrutamiento:** React Router DOM (v7) con soporte para lazy loading de módulos.
- **Estilos y UI:** Tailwind CSS y PostCSS, apoyados por Lucide React para la iconografía.
- **Mapas y Geolocalización:** Leaflet (`react-leaflet`) y Google Maps (`@react-google-maps/api`) para el ruteo y visualización en mapa de los transportes.
- **Gráficos y Visualización de Datos:** Chart.js a través de `react-chartjs-2`.
- **Exportación e Integración de Documentos:** `xlsx` y `xlsx-js-style` para el procesamiento de hojas de cálculo, junto a `jspdf` y `html2canvas` para reportes en PDF.
- **Notificaciones:** `sonner` para las notificaciones estilo "toast".

### Backend
- **Entorno y Servidor:** Node.js utilizando el framework Express (v5.x).
- **Seguridad y Autenticación:** `bcrypt` para el hashing de contraseñas, middleware personalizado para autorización basada en roles (RBAC) y control de tasa con `express-rate-limit`.
- **Integraciones en la Nube:** Google Cloud Storage (`@google-cloud/storage`) para el manejo de archivos (como evidencias fotográficas) y `google-auth-library` para integraciones de autenticación.
- **Utilidades Adicionales:** `nodemailer` para el envío de correos (ej. links de recuperación y notificaciones) y `uuid` para generación de identificadores únicos.

## 3. Base de Datos
El sistema utiliza **PostgreSQL** como motor de base de datos relacional. 

- **Integración:** El backend se conecta mediante la librería `pg`, estableciendo un "Connection Pool" configurado en el archivo `server/db.js` utilizando variables de entorno (`DATABASE_URL`, `DB_USER`, etc.).
- **Propósito:** Almacenar de manera estructurada y segura la información crítica del negocio, lo que incluye usuarios, roles, catastro de patentes, registros de rutas operativas, bitácoras y registros financieros. 
- **Evolución:** El esquema de la base de datos se maneja mediante scripts de migración en SQL plano (ubicados en `server/migrations/`), lo que permite mantener un control de versiones de la estructura (ej. tablas para RBAC, restablecimiento de contraseñas, operaciones y devoluciones).

## 4. Desglose de Componentes
La arquitectura del proyecto está estructurada en un enfoque cliente-servidor (SPA + API REST). Sus componentes principales son:

- **Frontend (SPA en `/src`):**
  - **Componentes de Layout (`/src/components/layout`):** Manejan la estructura principal visual como la barra lateral (`Sidebar`) y la barra superior (`Topbar`).
  - **Módulos de Negocio (`/src/features` y `/src/pages`):** Cada dominio de la aplicación está encapsulado, por ejemplo: `admin` (usuarios y roles), `bitacora`, `catastro-patente`, `devoluciones` (incluye la importación compleja vía Excel), `ruteo` (con mapas interactivos) y `transporte`.
  - **Contextos y Rutas:** Utiliza Context API (`AuthContext`) para manejar el estado de la sesión y permisos. El enrutamiento maneja restricciones de acceso (ProtectedRoute) validando roles.
  
- **Backend API (`/server`):**
  - **Enrutadores (`/server/routes`):** Exponen los endpoints por dominio de negocio: `/auth`, `/admin`, `/transportes`, `/ruteo`, `/devoluciones`, `/finanzas`, etc.
  - **Middlewares (`/server/middleware`):** Capas intermedias que interceptan las peticiones para verificar la autenticación (`requireAuth.js`) y capturar de manera global los errores (`errorHandler.js`).
  - **Capa de Datos:** Conexión directa a PostgreSQL mediante el "Pool" (`db.js`) para resolver las consultas requeridas por los controladores.

- **Servicios Externos / Infraestructura:**
  - Archivos de configuración para contenedores (Docker), integración continua (Cloud Build de GCP) y despliegues serverless o estáticos (Vercel).
  - Almacenamiento en Google Cloud Storage para servir evidencias fotográficas y adjuntos mediante un proxy local (`mediaProxy.js`).

## 5. Importancia de Cada Elemento en la Arquitectura

* **React + Vite (Frontend):** Provee una experiencia de usuario (UX) sumamente fluida ("Single Page Application") esencial para herramientas de gestión interna donde el personal operativo requiere interactuar con mapas, gráficas grandes o tablas de datos sin recargar la página constantemente. Vite minimiza los tiempos de construcción, acelerando el desarrollo.
* **Express en Node.js (Backend):** Ofrece una capa de API ligera y asíncrona, altamente eficiente para manejar operaciones de entrada/salida rápidas, procesar archivos de Excel subidos por los usuarios, y comunicarse con APIs de Google o la base de datos sin bloquear el hilo principal.
* **PostgreSQL (Base de Datos):** Fundamental para asegurar la integridad transaccional de los datos. En un sistema de ruteo, devoluciones y finanzas, evitar inconsistencias e implementar un robusto sistema de roles/permisos (RBAC) es obligatorio, siendo una base relacional la mejor opción técnica.
* **Librerías de Mapeo (Leaflet / Google Maps):** Son el corazón de la "Torre de Control", permitiendo a los supervisores georreferenciar incidentes, trazar zonas logísticas y monitorear la distribución visualmente.
* **Procesadores de Excel/PDF:** Integrados directamente en el navegador (`xlsx`, `jspdf`), permiten un importante ahorro de costos computacionales en el backend, distribuyendo la carga de procesar y descargar reportes directamente hacia los dispositivos cliente de los analistas de operaciones.
* **Google Cloud Storage (GCS):** Externaliza el manejo de archivos pesados (fotos de devoluciones) para que no sobrecarguen la base de datos principal, permitiendo escalabilidad en el almacenamiento a bajo costo y con alta disponibilidad.

---

## 6. Costos de Infraestructura GCP (Mayo 2026)

| Métrica | Valor |
| :--- | ---: |
| Costo por uso | $121,051 |
| Otros ahorros | -$274 |
| **Subtotal** | **$120,777** |
| Variación mes anterior | ↓ 30% |

> Proyecto GCP: `ccohub` — ID `715015149871`
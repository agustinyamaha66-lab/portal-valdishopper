---
title: "Rotor - Gestión de Fuerza Laboral"
type: "Fullstack"
status: "Activo"
technologies: ["Next.js", "TypeScript", "Python", "PostgreSQL", "Redis", "GCP", "Tailwind CSS", "Firestore"]
description: "Sistema WFM con motor de optimización matemática de turnos, cumplimiento Subcontrataley e IA que integra datos de Buk para gestión integral de colaboradores."
gcp_cost: "$86,518"
gcp_cost_previous: ""
gcp_svc_names: [Cloud SQL, Redis, Networking, Gemini API, Artifact Registry, Cloud Scheduler, Otros]
gcp_svc_costs: [121380, 36627, 24808, 19322, 6615, 1555, 520]
gcp_svc_changes: [-29, -9, -10, 12, 4, 10, 0]
screenshots: [rotor.png, rotor2.png]
repo: github.com/deploy-vs2026
---

# Documento de Arquitectura y Visión del Proyecto: Rotor

## 1. Visión General del Proyecto
**Rotor** es un sistema integral avanzado para la gestión de fuerza laboral (Workforce Management), focalizado en la orquestación, optimización y seguimiento del ciclo completo de los colaboradores (turnos, asistencia, ausencias, cumplimiento laboral y métricas de desempeño). 

El núcleo funcional del sistema recae en un **Motor de Optimización** matemáticamente modelado que asigna y orquesta horarios según reglas de negocio, requerimientos legales (Subcontrataley) y demanda. Además, el sistema incorpora capacidades analíticas y de inteligencia artificial (**AI Advisor**) para proponer mejoras en la plantilla, alertar sobre brechas operativas y unificar la información fragmentada proveniente de plataformas de Recursos Humanos (como Buk) y otras normativas. 

## 2. Detalle del Stack Tecnológico

*   **Frontend (Cliente Web):** 
    *   **Framework:** Next.js (React) utilizando App Router.
    *   **Lenguaje:** TypeScript, garantizando tipado estricto y reduciendo errores en tiempo de compilación.
    *   **Estilos:** Tailwind CSS con PostCSS, empleando un sistema de tokens propio (`rotor-tokens.css`).
*   **Backend (API & Motor Lógico):** 
    *   **Framework/Lenguaje:** Python (FastAPI) para la exposición de endpoints REST.
    *   **Caché y Mensajería:** Redis (para la implementación del patrón Cache-Aside y posibles colas).
*   **Infraestructura y Despliegue (DevOps):**
    *   **Contenedores:** Dockerizado integralmente (imágenes separadas para `frontend` y `backend`).
    *   **Cloud Provider:** Google Cloud Platform (GCP). Integración Continua a través de **Google Cloud Build** (`cloudbuild.yaml`).
*   **Integraciones Externas:** APIs de recursos humanos (Buk), herramientas de comunicación (WhatsApp Service) e ingesta de planillas nativas (Google Sheets).

## 3. Arquitectura de la Base de Datos

*   **Base de Datos Relacional Principal (SQL):** GCP Cloud SQL (PostgreSQL) como única fuente de verdad para datos transaccionales, perfiles de empleados (`employee.py`) y esquemas de turnos (`schedule.py`).
*   **Base de Datos Local / Operacional Ligera:** SQLite (`optimizador_runs.db`) como caché de ejecuciones del motor de optimización.
*   **Base de Datos NoSQL (Documental):** Google Cloud Firestore (`firestore_client.py`) para registros flexibles, notificaciones en tiempo real y modelos del AI Advisor.
*   **Capa de Caché Estratégica:** Redis con el patrón `Cache-Aside` (`redis_cache.py`) para mitigar picos de lectura en paneles de visualización y maestras temporales.

## 4. Desglose de Componentes Principales

### A. Next.js Web App (Frontend UI)
Interfaz operativa principal para analistas y administradores. Componentes clave: `ScheduleGrid`, `PerformanceDashboard`, `MaestroBukPanel`, `TurnosPanel`, `RelevoTacticoPanel`. Hooks personalizados (`useTurnos.ts`, `useAsistenciaBuk.ts`) aíslan la lógica de data-fetching del estado visual.

### B. Core API Services (Backend)
Ubicado en `backend/app/api`; recibe, valida y encamina todas las solicitudes REST. Maneja autorización (`auth.py`), validación de payloads y orquestación hacia el motor de optimización.

### C. Motor de Optimización (`optimization/engine.py`)
Resuelve el problema matemático de asignación óptima de turnos. Toma restricciones duras (horarios máximos legales) y objetivos flexibles (minimizar costos, maximizar cobertura) usando `solver_service.py`.

### D. AI Advisor y Notificaciones (`models/ai_advisor.py`, `notification_engine.py`)
Procesa métricas para brindar insights descriptivos de la operación. Alerta en tiempo real vía `whatsapp_service.py` sobre desbalances, ausentismo de última hora y brechas operativas.

### E. Capa de Integraciones (`integrations/`, `infrastructure/external/`)
Sincroniza ausencias (`ausencias_buk.py`), hojas maestras (`sheets_empleados_activos.py`) y flujos de preingreso (`preingreso_workflow_transform.py`). Implementa resiliencia con reintentos para aislar la API central de caídas de terceros.

---

## 5. Costos de Infraestructura GCP (Mayo 2026)

| Métrica | Valor |
| :--- | ---: |
| Costo por uso | $89,334 |
| Créditos | -$2,817 |
| Ahorro | 3.15% |
| **Subtotal** | **$86,518** |

> Proyecto GCP: `rotor` — mismo tenant que `ccohub` (ID `715015149871`)

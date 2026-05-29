# Documento de Arquitectura y Visión del Proyecto: Rotor

## 1. Visión General del Proyecto
**Rotor** es un sistema integral avanzado para la gestión de fuerza laboral (Workforce Management), focalizado en la orquestación, optimización y seguimiento del ciclo completo de los colaboradores (turnos, asistencia, ausencias, cumplimiento laboral y métricas de desempeño). 

El núcleo funcional del sistema recae en un **Motor de Optimización** matemáticamente modelado que asigna y orquesta horarios según reglas de negocio, requerimientos legales (Subcontrataley) y demanda. Además, el sistema incorpora capacidades analíticas y de inteligencia artificial (**AI Advisor**) para proponer mejoras en la plantilla, alertar sobre brechas operativas y unificar la información fragmentada proveniente de plataformas de Recursos Humanos (como Buk) y otras normativas. 

## 2. Detalle del Stack Tecnológico
La solución ha sido diseñada bajo una arquitectura moderna, modular y desacoplada, separando claramente las responsabilidades en capas especializadas:

*   **Frontend (Cliente Web):** 
    *   **Framework:** Next.js (React) utilizando App Router.
    *   **Lenguaje:** TypeScript, garantizando tipado estricto y reduciendo errores en tiempo de compilación.
    *   **Estilos:** Tailwind CSS con PostCSS, empleando un sistema de tokens propio (`rotor-tokens.css`).
*   **Backend (API & Motor Lógico):** 
    *   **Framework/Lenguaje:** Python (probablemente FastAPI o Flask para la exposición de endpoints REST).
    *   **Caché y Mensajería:** Redis (para la implementación del patrón Cache-Aside y posibles colas).
*   **Infraestructura y Despliegue (DevOps):**
    *   **Contenedores:** Dockerizado integralmente (imágenes separadas para `frontend` y `backend`).
    *   **Cloud Provider:** Google Cloud Platform (GCP). Integración Continua a través de **Google Cloud Build** (`cloudbuild.yaml`).
*   **Integraciones Externas:** APIs de recursos humanos (Buk), herramientas de comunicación (WhatsApp Service) e ingesta de planillas nativas (Google Sheets).

## 3. Arquitectura de la Base de Datos
La persistencia de datos del sistema está pensada para la alta escalabilidad y el manejo de distintos paradigmas de información según el contexto de uso:

*   **Base de Datos Relacional Principal (SQL):** Utilizada como la única fuente de la verdad para datos transaccionales, perfiles de empleados (`employee.py`), esquemas de turnos (`schedule.py`) y trazabilidad operacional. Se aloja en GCP Cloud SQL (PostgreSQL/MySQL), interactuando con el backend mediante un ORM y motores dedicados (`appvs_engine.py`, `engine.py`).
*   **Base de Datos Local / Operacional Ligera:** Uso de SQLite (`optimizador_runs.db`) como base local o para caché de ejecuciones del motor de optimización sin sobrecargar el clúster principal.
*   **Base de Datos NoSQL (Documental):** Uso de **Google Cloud Firestore** (`firestore_client.py`) para el manejo de registros flexibles, notificaciones en tiempo real, eventos de auditoría y almacenamiento rápido de modelos no estructurados vinculados al AI Advisor.
*   **Capa de Caché Estratégica:** Clúster de **Redis** implementado con el patrón `Cache-Aside` (`CACHE_ASIDE_REDIS.md`, `redis_cache.py`) para mitigar picos de lectura, salvaguardar la base de datos principal ante consultas repetitivas (ej. paneles de visualización y maestras temporales).

## 4. Desglose de Componentes Principales

Cada módulo dentro del sistema está acotado a un contexto específico ("Bounded Context"):

### A. Next.js Web App (Frontend UI)
*   **Importancia:** Actúa como la interfaz operativa principal para analistas y administradores.
*   **Rol Técnico:** Administra el estado global, la sesión del usuario y la representación de datos de alta densidad a través de componentes clave como `ScheduleGrid`, `PerformanceDashboard` y paneles altamente especializados (`MaestroBukPanel`, `TurnosPanel`, `RelevoTacticoPanel`). Usa *Custom Hooks* (`hooks/useTurnos.ts`, `hooks/useAsistenciaBuk.ts`) para aislar la lógica de *data-fetching* y el estado de los componentes visuales.

### B. Core API Services (Backend)
*   **Importancia:** Intermediario principal entre los clientes (Frontend/Móviles) y las reglas de negocio.
*   **Rol Técnico:** Ubicado en `backend/app/api`, recibe, valida y encamina todas las solicitudes REST. Se encarga de la autorización (`auth.py`), validación de payloads y orquestación de llamadas hacia la capa de infraestructura o el motor de optimización.

### C. Motor de Optimización (`optimization/engine.py`)
*   **Importancia:** Es el "cerebro" del producto. Resuelve el problema matemático de la asignación óptima de turnos.
*   **Rol Técnico:** Toma una serie de restricciones duras (`constraints`) como horarios máximos legales, y objetivos flexibles (`objectives`) como minimizar costos o maximizar cobertura, y utiliza un _solver_ (`solver_service.py`) para computar las mallas de turnos resultantes. 

### D. AI Advisor y Servicios de Notificación (`models/ai_advisor.py`, `notification_engine.py`)
*   **Importancia:** Componente que eleva a "Rotor" más allá de un simple CRUD, convirtiéndolo en un asistente proactivo.
*   **Rol Técnico:** Recibe métricas desde los reportes y las procesa para brindar *insights* descriptivos de las operaciones. El motor de notificaciones puede luego usar canales externos como `whatsapp_service.py` para alertar en tiempo real a los interesados de desbalances en la operación, ausentismo de última hora, etc.

### E. Capa de Integraciones (`integrations/`, `infrastructure/external/`)
*   **Importancia:** Garantiza que los silos de datos de la empresa conversen y coincidan.
*   **Rol Técnico:** Sincroniza las ausencias (`ausencias_buk.py`), hojas de cálculo maestras (`sheets_empleados_activos.py`) y transforma el flujo pre-ingreso de los trabajadores (`preingreso_workflow_transform.py`). Aíslan a la API central de caídas de los servicios de terceros mediante resiliencia y reintentos (Retries).

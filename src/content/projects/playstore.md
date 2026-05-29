---
title: "Inventario Valdishopper - App Android"
type: "Mobile App"
status: "Completado"
technologies: ["Kotlin", "Android SDK", "Google Sheets", "Apps Script", "ZXing", "OkHttp3"]
description: "Aplicación Android nativa para gestión logística y trazabilidad de activos (bolsos, coolers, kits) mediante escaneo QR e integración con Google Sheets como backend."
screenshots: [playstore-app.png]
---

# Documentación Técnica: Inventario Valdishopper (v1.4)

## 1. Visión General del Proyecto

**Inventario Valdishopper** es una solución móvil nativa diseñada para la gestión logística y control de trazabilidad de activos (bolsos, coolers y productos) de la empresa. El sistema permite el registro de ingresos y entregas en tiempo real, integrando escaneo de códigos QR para asegurar que los activos críticos (como los Kits Iniciales de Shoppers) se entreguen y rastreen correctamente entre las distintas salas y prestadores.

El objetivo principal es eliminar la pérdida de activos mediante un control estricto de trazabilidad y proporcionar visibilidad inmediata del stock en cada ubicación.

---

## 2. Detalle del Stack Tecnológico

### Frontend (Móvil)

- **Lenguaje:** Kotlin 1.9+
- **Framework Base:** Android SDK (API 35 - Android 15)
- **UI/UX:** XML con componentes de Material Design 3. Implementación de *Edge-to-Edge* para cumplimiento de estándares de Android 15.
- **Gestión de Ciclo de Vida:** ViewModel y LifecycleScope para operaciones asíncronas seguras.
- **Librerías Clave:**
  - `ZXing Android Embedded`: Para el procesamiento y escaneo de códigos QR/Barras.
  - `OkHttp3`: Para la capa de comunicación de red.
  - `Coroutines`: Para la ejecución de tareas en segundo plano sin bloquear la UI.

### Backend (Serverless & Proxy)

- **Motor Lógico:** Google Apps Script (GAS)
- **Protocolo:** REST API (JSON)
- **Rol:** Actúa como un middleware que procesa la lógica de negocio, valida sesiones y gestiona la persistencia de datos de forma transaccional.

---

## 3. Arquitectura de Datos

El sistema utiliza un modelo de persistencia basado en **Google Sheets** como motor de base de datos relacional simulada, lo que permite una consulta rápida y edición colaborativa por parte de la administración.

**Tablas Principales:**

| Tabla | Descripción |
| :--- | :--- |
| **Productos** | Maestro de SKUs, descripciones y banderas de validación (`req_qr`, `pide_cant`). |
| **Movimientos** | Historial transaccional de todas las entradas y salidas. |
| **Usuarios/Sesiones** | Control de acceso mediante RUT y token de autenticación. |
| **Stock Consolidado** | Vista dinámica que calcula las existencias por Local ID. |
| **Beetrack** | Tabla de referencia para validación de prestadores y patentes. |

---

## 4. Componentes Principales y Roles Técnicos

### A. Módulo de Trazabilidad (`EntregarProductoActivity`)

- **Rol:** Es el núcleo transaccional. Gestiona la lógica compleja de salida de activos.
- **Importancia Técnica:** Implementa una **máquina de estados dinámica**. Dependiendo del SKU seleccionado, el componente activa o desactiva validaciones (como el escaneo obligatorio de QR o la entrada de cantidad manual). Es crucial para asegurar que un "Bolso Shopper" no salga del sistema sin su identificador único.

### B. Capa de Red (`MovimientosApi` / `AuthApi`)

- **Rol:** Abstracción de la comunicación con el servidor.
- **Importancia Técnica:** Centraliza las peticiones HTTP. Utiliza el patrón de "Repository" para desacoplar la interfaz de usuario de la procedencia de los datos, permitiendo que la app maneje errores de conexión de forma elegante mediante excepciones controladas.

### C. Gestor de Sesiones (`Session Class`)

- **Rol:** Persistencia de estado local mediante `SharedPreferences`.
- **Importancia Técnica:** Garantiza la seguridad en el dispositivo. Almacena el `token`, `localid` y `role` del usuario. Su rol es vital para la personalización de la experiencia (ej. filtrar productos que solo el usuario actual puede ver) y para la expiración automática de accesos.

### D. Componente de Escaneo (`IntentIntegrator`)

- **Rol:** Interfaz con el hardware de la cámara.
- **Importancia Técnica:** Proporciona una entrada de datos rápida y sin errores. En el flujo de "Ingreso de Caja", este componente parsea estructuras JSON embebidas en los QR para cargar múltiples datos (lote, SKU, cantidad) con un solo escaneo.

### E. Soporte Edge-to-Edge (Android 15)

- **Rol:** Adaptación visual al sistema operativo.
- **Importancia Técnica:** Asegura la longevidad de la aplicación. Al utilizar `enableEdgeToEdge()` y `fitsSystemWindows`, la arquitectura garantiza compatibilidad con las nuevas políticas de Google Play, evitando que el contenido se superponga con las áreas de navegación del sistema.

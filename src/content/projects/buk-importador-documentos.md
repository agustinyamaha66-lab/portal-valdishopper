---
title: "RPA - Importador Buk"
type: "Automation / RPA"
status: "Completado"
technologies: ["Python", "Selenium", "Google Cloud", "Docker"]
---

# Documentación del Proyecto: Buk Importador de Documentos

## 1. Visión general del proyecto
El proyecto consiste en una automatización o bot (RPA) diseñado para procesar de forma masiva y programada la subida de documentos a la plataforma de recursos humanos Buk. El sistema interactúa con Google Drive para localizar y descargar archivos PDF pendientes. Luego, mediante un flujo automatizado de navegador (headless), inicia sesión en Buk, navega al módulo de importadores de documentos y sube los archivos aplicando configuraciones específicas (como marcarlos como "visibles", requerir firma digital y configurar un flujo de firma automático). Finalmente, traslada los documentos procesados en Google Drive desde una carpeta origen a una de destino, asegurando que no se vuelvan a procesar. Se despliega en la nube y se ejecuta diariamente de manera desatendida a las 19:00 (hora de Chile).

## 2. Detalle del stack tecnológico
El ecosistema tecnológico del sistema se compone de herramientas de backend orientadas a la automatización de procesos y el ecosistema en la nube de Google Cloud:
* **Lenguaje:** Python 3.11
* **Frameworks y Librerías Principales:**
  * `selenium`: Control del navegador web, extracción de información del DOM e interacción con componentes visuales (incluyendo librerías reactivas como Vue en el frontend de Buk).
  * `google-api-python-client` / `google-auth`: Autenticación e integración directa con las APIs de Google (Drive).
  * `requests`: Manejo de subida de archivos directos al endpoint de la API usando peticiones HTTP como un mecanismo *fallback* o *headless* eficiente.
  * `schedule`: Programación de tareas dentro del ciclo local (en caso de no usarse un trigger de la nube).
* **Infraestructura y Despliegue (GCP):**
  * **Docker:** Contenerización de la aplicación (incluyendo binarios de Google Chrome y ChromeDriver).
  * **Google Cloud Build:** Pipeline de CI/CD para compilar y empujar la imagen al registro.
  * **Google Cloud Run (Jobs):** Entorno de ejecución *serverless* para correr el bot de manera aislada como un contenedor.
  * **Google Cloud Scheduler:** Equivalente a *Cron* en la nube que detona el Cloud Run Job todos los días a las 19:00 horas.

## 3. Arquitectura de la base de datos
Este proyecto cuenta con una arquitectura de almacenamiento *stateless* a nivel transaccional y no emplea un motor de base de datos relacional (como MySQL o PostgreSQL) ni NoSQL tradicional. 
* **Fuente de verdad y estado (Storage):** El sistema utiliza **Google Drive** como mecanismo de control de estado. El estado "Pendiente" lo da la presencia del archivo en el directorio de `Origen`. El estado "Procesado" ocurre al hacer el movimiento atómico hacia el directorio de `Destino`. 
* **Persistencia local:** Utiliza almacenamiento en el sistema de archivos (`session_cookies.json`) como caché para mantener la sesión de autenticación activa entre ejecuciones, ahorrando iteraciones de login y evitando bloqueos de seguridad por parte de Buk.

## 4. Desglose de componentes principales

### A. Orquestador Principal (`buk_importador_documentos.py`)
* **Rol:** Es el cerebro del bot.
* **Importancia Técnica:** Controla la secuencia lógica de todo el proceso en fases (1. Drive, 2. Descargas, 3. Login, 4. Interacción con Plataforma, 5. Movimiento Drive). Encapsula el manejo de errores y asegura la finalización limpia de los recursos (como el cierre del WebDriver o borrado de carpetas temporales). 

### B. Módulo de Integración con Google Drive API
* **Rol:** Proveedor de Archivos.
* **Importancia Técnica:** Usa el patrón de paginación para obtener la lista de documentos (`listar_archivos_drive`), administra el *download stream* a través de `MediaIoBaseDownload`, y realiza mutaciones atómicas (`mover_archivos_drive`) que son esenciales para evitar errores lógicos donde un mismo contrato o documento se intente cargar a Buk múltiples veces.

### C. Módulo UI Automation / Scraper (Selenium Webdriver)
* **Rol:** Agente de Interacción.
* **Importancia Técnica:** Soluciona el desafío de automatizar un frontend complejo. Se encarga de instanciar Chrome ignorando banderas de automatización para evitar mecanismos anti-bot. Controla interacciones asíncronas con temporizadores implícitos (`WebDriverWait`) y scripts de ejecución nativa (ej. `driver.execute_script`) para sobreponerse a capas de React/Vue que interceptan los eventos clásicos, administrando selects (`Select2`), subida a dropzones y modales emergentes.

### D. Infraestructura Contenerizada (Dockerfile + Cloudbuild.yaml)
* **Rol:** Entorno de Ejecución Aislado.
* **Importancia Técnica:** Resuelve el infierno de dependencias ("funciona en mi máquina"). Al definir una imagen Docker (`Dockerfile`) que instala dependencias a nivel SO de bibliotecas de video (necesarias para Chrome) emparejadas exactamente con una versión de ChromeDriver, garantiza la estabilidad en cualquier entorno donde corra. `cloudbuild.yaml` define la automatización de infraestructura como código (IaC), permitiendo actualizar el Job y el Scheduler de GCP transparentemente al empujar un cambio.
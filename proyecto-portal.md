# Información del Proyecto — VALDISHOPPER PORTAL

---

## 1. Visión General

**VALDISHOPPER PORTAL** es una aplicación web interna que centraliza el acceso a proyectos, reportes y herramientas de análisis de datos de la organización Valdishopper. Funciona como un hub unificado donde los empleados autenticados pueden visualizar dashboards de Power BI, scripts de Google Apps Script, iframes embebidos y otros recursos, todo desde una interfaz organizada en carpetas y proyectos.

El sistema implementa un modelo de roles (administrador / usuario estándar) con autenticación exclusiva a través de Google OAuth, restringida a cuentas del dominio `@valdishopper.com`. Los administradores gestionan el catálogo de proyectos y carpetas; los usuarios estándar solo consumen el contenido que tienen permitido visualizar.

**Problema que resuelve:** evitar que los equipos deban recordar múltiples URLs de reportes, scripts y tableros dispersos, consolidándolos en un único punto de acceso seguro y organizado.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|------|-----------|---------|-----|
| Frontend | React | 18.3 | Librería de UI basada en componentes |
| Lenguaje | TypeScript | 5.4 | Tipado estático sobre JavaScript |
| Router | React Router DOM | 6.23 | Navegación SPA client-side |
| Bundler / Dev Server | Vite | 5.2 | Compilación y hot-reload en desarrollo |
| Backend / BaaS | Supabase | — | Base de datos, autenticación y API REST/RLS |
| Base de datos | PostgreSQL (vía Supabase) | — | Persistencia relacional con Row Level Security |
| Autenticación | Supabase Auth + Google OAuth | — | SSO restringido al dominio corporativo |
| Iconografía | Lucide React | 0.383 | Íconos SVG consistentes en toda la UI |
| Despliegue | Netlify (netlify.toml presente) | — | Hosting estático con CI/CD |

### Decisiones de diseño relevantes

- **Sin backend propio:** Supabase provee tanto la API de datos como la autenticación. Esto elimina la necesidad de un servidor Node/Express dedicado y reduce la superficie de mantenimiento.
- **Vite sobre CRA:** tiempo de arranque y HMR significativamente más rápidos en desarrollo.
- **TypeScript estricto:** los tipos de dominio (`AppUser`, `Project`, `Folder`) se definen en `src/types/` y se comparten entre componentes y hooks, evitando errores de contrato en tiempo de desarrollo.

---

## 3. Arquitectura de la Base de Datos

La base de datos vive en Supabase (PostgreSQL). El esquema está definido en `supabase/migrations/001_initial.sql`.

### Diagrama de entidades

```
folders
  ├── id           UUID PK
  ├── name         TEXT
  ├── created_by   TEXT (email del admin creador)
  ├── order_index  INTEGER
  └── created_at   TIMESTAMPTZ

projects
  ├── id           UUID PK
  ├── title        TEXT
  ├── url          TEXT           ← URL del recurso embebido
  ├── type         TEXT           ← 'iframe' | 'powerbi' | 'script' | 'other'
  ├── folder_id    UUID FK → folders.id (nullable, SET NULL on delete)
  ├── created_by   TEXT
  ├── is_public    BOOLEAN
  ├── order_index  INTEGER
  ├── description  TEXT
  └── created_at   TIMESTAMPTZ

permissions
  ├── id           UUID PK
  ├── user_email   TEXT
  ├── project_id   UUID FK → projects.id (CASCADE on delete)
  ├── granted_by   TEXT
  └── UNIQUE (user_email, project_id)
```

### Relaciones

- Un `folder` puede contener **cero o muchos** `projects`.
- Un `project` puede existir **sin carpeta** (`folder_id` nullable).
- `permissions` es una tabla pivote que relaciona usuarios (por email) con proyectos específicos, permitiendo control de acceso granular.

### Seguridad a nivel de base de datos (Row Level Security)

Todas las tablas tienen RLS habilitado. La política activa en las tres tablas exige que `auth.email()` termine en `@valdishopper.com`, lo que significa que **aunque alguien obtuviera las claves públicas de Supabase, no podría leer ni escribir datos desde fuera del dominio corporativo**.

---

## 4. Componentes Principales

### 4.1 `src/App.tsx` — Controlador de rutas y autenticación global

**Rol:** es el punto de entrada de la aplicación. Orquesta el estado de autenticación y decide qué renderizar según si el usuario está logueado y cuál es su rol.

**Importancia técnica:**
- Consume el hook `useAuth` para obtener `user`, `loading` y los métodos `signInWithGoogle` / `signOut`.
- Implementa protección de rutas: la ruta `/admin` es accesible solo si `user.role === 'admin'`; cualquier otra ruta inexistente redirige a `/`.
- Al centralizar la lógica de autenticación aquí, el resto de componentes reciben al usuario como prop sin necesidad de acceder a Supabase directamente.

---

### 4.2 `src/hooks/useAuth` — Hook de autenticación

**Rol:** abstrae toda la comunicación con Supabase Auth y expone un contrato limpio al resto de la aplicación.

**Importancia técnica:**
- Gestiona la suscripción al evento `onAuthStateChange` de Supabase, manteniendo el estado de sesión sincronizado en tiempo real (refresco de token, cierre de sesión en otra pestaña, etc.).
- Enriquece el objeto de usuario de Supabase con el campo `role` (obtenido de la tabla de configuración o metadata), devolviendo un `AppUser` tipado.
- Restringe el login a cuentas `@valdishopper.com` antes de completar el flujo de autenticación.

---

### 4.3 `src/components/layout/Header.tsx` — Barra de navegación superior

**Rol:** identifica visualmente al usuario activo y proporciona acceso rápido al panel de administración.

**Importancia técnica:**
- Muestra condicionalmente el botón "Admin" solo si `user.role === 'admin'`, evitando que usuarios estándar descubran la ruta de administración.
- Actúa como toggle entre la vista de Dashboard y la vista de Admin sin recargar la página.
- Muestra el avatar de Google OAuth del usuario cuando está disponible, mejorando la percepción de identidad y confianza.

---

### 4.4 `src/components/layout/Sidebar.tsx` — Árbol de navegación de proyectos

**Rol:** es el componente de navegación principal; presenta la jerarquía de carpetas y proyectos y permite a los admins crear nuevos recursos en línea.

**Importancia técnica:**
- Implementa un árbol colapsable con estado local (`expanded: Set<string>`), sin librerías externas, manteniendo el bundle pequeño.
- Diferencia visualmente el tipo de proyecto (`powerbi`, `script`, `iframe`) con íconos distintos, ayudando al usuario a anticipar el contenido antes de abrirlo.
- Los controles de creación de carpetas y proyectos (`FolderPlus`, `Plus`) solo se renderizan para administradores, siguiendo el principio de mínimo privilegio en la UI.
- Delega las operaciones de mutación (`createFolder`, `createProject`, `deleteProject`, `deleteFolder`) al hook `useProjects` del padre, manteniéndose como componente puramente presentacional con side-effects controlados.

---

### 4.5 `src/components/projects/AddProjectModal.tsx` y `AddFolderModal.tsx` — Modales de creación

**Rol:** formularios modales que permiten a los administradores registrar nuevos proyectos y carpetas.

**Importancia técnica:**
- `AddProjectModal` captura los campos críticos del recurso: `title`, `url`, `type` y `description`. El campo `type` determina cómo la vista principal renderizará el contenido (iframe nativo, embed de Power BI, ejecución de script, etc.).
- Ambos modales reciben callbacks `onAdd` y `onClose` como props, desacoplándose completamente del mecanismo de persistencia. Esto los hace testables en aislamiento y reutilizables si en el futuro se añade edición de proyectos.

---

### 4.6 `src/pages/Dashboard` — Vista principal de contenido

**Rol:** renderiza el proyecto actualmente seleccionado desde la barra lateral, adaptando el método de visualización al `type` del proyecto.

**Importancia técnica:**
- Es el núcleo de valor del portal: en función del tipo, embebe un `<iframe>`, muestra un reporte de Power BI, o lanza un script de Google Apps Script / Apps Script embebido.
- Gestiona el estado de proyecto activo en coordinación con el Sidebar, actuando como consumidor del hook `useProjects`.

---

### 4.7 `src/pages/Admin` — Panel de administración

**Rol:** interfaz exclusiva para administradores que permite gestionar el catálogo completo de proyectos, carpetas y permisos de usuario.

**Importancia técnica:**
- Ruta protegida a nivel de `App.tsx`; cualquier acceso no autorizado es redirigido al Dashboard.
- Centraliza operaciones CRUD que afectan a la tabla `permissions`, permitiendo asignar o revocar acceso a proyectos por email de usuario.

---

### 4.8 `supabase/migrations/001_initial.sql` — Esquema y políticas de seguridad

**Rol:** define la estructura de datos y las reglas de acceso que son la fuente de verdad del sistema.

**Importancia técnica:**
- Las políticas RLS son la última línea de defensa: incluso si la lógica del frontend fuera bypasseada, Supabase rechaza a nivel de base de datos cualquier operación de un email fuera del dominio `@valdishopper.com`.
- El uso de `UUID` como PK y `gen_random_uuid()` evita la enumeración de recursos por ID secuencial.
- El `ON DELETE CASCADE` en `permissions` garantiza consistencia referencial: si un proyecto se elimina, sus permisos asociados desaparecen automáticamente, evitando huérfanos de acceso.

---

## 5. Flujo de datos resumido

```
Usuario accede → Google OAuth (Supabase Auth)
    ↓
useAuth valida dominio @valdishopper.com
    ↓
App.tsx determina rol → renderiza Dashboard o Admin
    ↓
useProjects fetcha folders + projects desde Supabase
    ↓
Sidebar muestra árbol → usuario selecciona proyecto
    ↓
Dashboard embebe URL del proyecto (iframe / Power BI / script)
```

---

*Documento generado el 2026-05-26 — VALDISHOPPER PORTAL v1.0.0*

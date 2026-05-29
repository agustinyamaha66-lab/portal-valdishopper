---
title: "Valdishopper Portal"
type: "Fullstack"
status: "Completado"
technologies: ["React", "TypeScript", "Supabase", "PostgreSQL", "Vite", "Tailwind CSS", "Netlify"]
description: "Hub web interno que centraliza dashboards de Power BI, scripts y reportes de la organización, con autenticación Google OAuth restringida al dominio corporativo y control de acceso granular por rol."
---

# Información del Proyecto — VALDISHOPPER PORTAL

## 1. Visión General

**VALDISHOPPER PORTAL** es una aplicación web interna que centraliza el acceso a proyectos, reportes y herramientas de análisis de datos de la organización Valdishopper. Funciona como un hub unificado donde los empleados autenticados pueden visualizar dashboards de Power BI, scripts de Google Apps Script, iframes embebidos y otros recursos, todo desde una interfaz organizada en carpetas y proyectos.

El sistema implementa un modelo de roles (administrador / usuario estándar) con autenticación exclusiva a través de Google OAuth, restringida a cuentas del dominio `@valdishopper.com`. Los administradores gestionan el catálogo de proyectos y carpetas; los usuarios estándar solo consumen el contenido que tienen permitido visualizar.

**Problema que resuelve:** evitar que los equipos deban recordar múltiples URLs de reportes, scripts y tableros dispersos, consolidándolos en un único punto de acceso seguro y organizado.

## 2. Stack Tecnológico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Frontend | React 18.3 + TypeScript 5.4 | UI basada en componentes con tipado estricto |
| Router | React Router DOM 6.23 | Navegación SPA client-side |
| Bundler | Vite 5.2 | Compilación y hot-reload en desarrollo |
| Backend / BaaS | Supabase | Base de datos, autenticación y API REST/RLS |
| Base de datos | PostgreSQL (vía Supabase) | Persistencia relacional con Row Level Security |
| Autenticación | Supabase Auth + Google OAuth | SSO restringido al dominio corporativo |
| Iconografía | Lucide React | Íconos SVG consistentes en toda la UI |
| Despliegue | Netlify | Hosting estático con CI/CD |

**Sin backend propio:** Supabase provee tanto la API de datos como la autenticación, eliminando la necesidad de un servidor Node/Express dedicado.

## 3. Arquitectura de la Base de Datos

Esquema definido en `supabase/migrations/001_initial.sql`:

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
  ├── folder_id    UUID FK → folders.id (nullable)
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

RLS habilitado en las 3 tablas: solo emails `@valdishopper.com` pueden leer o escribir datos, incluso si alguien obtuviera las claves públicas de Supabase.

## 4. Componentes Principales

- **`src/App.tsx`** — Controlador de rutas y autenticación global. Protege `/admin` con `user.role === 'admin'`.
- **`src/hooks/useAuth`** — Suscripción a `onAuthStateChange`, enriquece usuario con `role`, restringe dominio corporativo.
- **`src/components/layout/Header.tsx`** — Muestra botón "Admin" condicionalmente según rol.
- **`src/components/layout/Sidebar.tsx`** — Árbol colapsable de carpetas/proyectos; diferencia tipo por ícono (`powerbi`, `script`, `iframe`). Solo admins ven controles de creación.
- **`src/components/projects/AddProjectModal.tsx` y `AddFolderModal.tsx`** — Formularios modales desacoplados via callbacks `onAdd`/`onClose`.
- **`src/pages/Dashboard`** — Renderiza el proyecto activo adaptando la visualización al `type` (iframe nativo / Power BI / script de Apps Script).
- **`src/pages/Admin`** — CRUD de proyectos, carpetas y permisos por email (ruta protegida, solo admins).

## 5. Flujo de Datos

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

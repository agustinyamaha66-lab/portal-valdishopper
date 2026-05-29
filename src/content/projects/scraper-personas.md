---
title: "Scraper Personas Asociadas"
type: "Web Scraping"
status: "En Pausa (Local)"
technologies: ["Python", "Google Cloud", "Playwright", "GCP Scheduler"]
---

# Resumen Técnico — Scraper Personas Asociadas
**Fecha:** 2026-05-12

---

## ¿Qué hace el scraper?

Descarga automáticamente la tabla de registrados desde `controltienda.com` y la sube al bucket de Google Cloud Storage `gs://personas_asociadas/`. El archivo queda con nombre `personas_asociadas_YYYYMMDD_HHMMSS.xlsx`.

**Flujo:**
1. Abre Chrome automáticamente
2. Hace login en `controltienda.com`
3. Navega a la página de registrados
4. Hace clic en "Exportar Excel"
5. Espera que el archivo se descargue
6. Lo sube a Google Cloud Storage

---

## Estado actual

El scraper **funciona correctamente en local** (PC con Windows). El archivo se descarga y sube a GCS sin problemas.

**Problema en Google Cloud Run:** El sitio `controltienda.com` está protegido por **Cloudflare Turnstile** (sistema anti-bot). Cloudflare detecta que las IPs de los servidores de Google Cloud son de datacenter y bloquea el acceso exigiendo verificación humana ("Verify you are human"), lo cual no puede resolverse automáticamente.

---

## Solución temporal (en uso)

Correr el scraper desde una **PC local** usando Windows Task Scheduler. Dado que la IP de la oficina es residencial, Cloudflare no bloquea el acceso.

**Infraestructura en Google Cloud pausada temporalmente** (el scheduler está pausado, el bucket y el job siguen creados).

---

## Opciones a largo plazo

| Opción | Costo extra | Confiabilidad | Complejidad |
|--------|------------|---------------|-------------|
| PC local + Task Scheduler (actual) | $0 | Media (depende de que la PC esté encendida) | Baja |
| Proxy residencial (Bright Data, etc.) + Cloud Run | ~$10-30/mes | Alta | Media |
| VM en la nube con IP fija residencial | ~$10-20/mes | Alta | Media |
| Servicio anti-Cloudflare (FlareSolverr) | $0 infra, pero complejo | Media-Alta | Alta |

### Recomendación

Si se necesita que el scraper corra sin depender de una PC encendida, la opción más costo-efectiva es un **proxy residencial** (pago por GB, uso mínimo para esta tarea = centavos por ejecución).

---

## Infraestructura GCP creada

| Recurso | Detalle |
|---------|---------|
| Cloud Run Job | `scraper-personas-asociadas` — región `southamerica-west1` |
| Cloud Scheduler | `scraper-personas-asociadas-horario` — región `southamerica-east1` — **PAUSADO** |
| GCS Bucket | `gs://personas_asociadas/` |
| Proyecto GCP | `rotor-488517` |

---

## Comandos útiles

**Reactivar scheduler (cuando se resuelva el problema de Cloudflare):**
```powershell
gcloud scheduler jobs resume scraper-personas-asociadas-horario --project=rotor-488517 --location=southamerica-east1
```

**Correr manualmente en Cloud:**
```powershell
gcloud run jobs execute scraper-personas-asociadas --region=southamerica-west1 --project=rotor-488517
```

**Ver screenshot de error en Cloud:**
```powershell
gcloud storage cp gs://personas_asociadas/debug/error_screenshot.png ./error_screenshot.png --project=rotor-488517
```

**Correr localmente:**
```powershell
cd "C:\Users\agust\OneDrive\VALDISHOPPER\PROYECTOS\scraper-personas-asociadas"
.venv\Scripts\Activate.ps1
$env:HEADLESS="false"; python test.py
```


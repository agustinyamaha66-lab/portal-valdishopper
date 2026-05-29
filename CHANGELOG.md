# Changelog

## 2026-05-26 — Rediseño Project List (drop-in)

### Archivos nuevos
- `src/components/Icons.jsx` — Iconos SVG inline, sin dependencias externas (reemplaza `lucide-react`)
- `src/components/markdown.js` — Mini parser de Markdown propio (reemplaza `react-markdown` + `remark-gfm`)
- `src/components/ProjectModal.jsx` — Modal con 3 tabs: Overview (readme), Stack tecnológico y Costos GCP
- `src/ProjectList.css` — Hoja de estilos del listado, cards, modal y gráfico GCP (movido de `src/components/`)

### Archivos reemplazados
- `src/index.css` — Sistema completo de tokens CSS (`--bg`, `--text`, `--accent`, `--border`, radii, sombras, fuentes Inter + JetBrains Mono, glow atmosférico, animaciones `fade-in` / `stagger`)
- `src/App.css` — Estilos de TopNav sticky con backdrop-blur y Hero con status-dot animado
- `src/App.jsx` — Shell con `TopNav` + `Hero` + `ProjectList`. Mantiene `import.meta.glob` para leer los archivos `.md` de `src/content/projects/` y mapea el frontmatter al nuevo shape del componente
- `src/components/ProjectList.jsx` — Rediseño completo: cards con gradiente de acento en hover, barra de filtros con búsqueda, counter de resultados, 3 variantes de grid (`default` / `compact` / `bento`), modal integrado

### Archivos eliminados
- `src/components/ProjectList.css` — Reemplazado por `src/ProjectList.css`
- `vite-drop-in/` — Carpeta del drop-in, aplicada e integrada al proyecto

### Detalles del mapeo de datos (frontmatter → nuevo shape)
| Campo antiguo | Campo nuevo | Notas |
| :--- | :--- | :--- |
| `title` | `title` | Sin cambio |
| `type` (string libre) | `type` (enum) | `web-app` / `automation` / `etl` / `design-system` / `archive` |
| `status` (string libre) | `status` (enum) | `active` / `paused` / `archived` |
| `technologies` | `tech` | Array directo |
| `gcp_cost` (string "$1,050") | `gcpCost.current` (número) | Parseado a float; `previous=0`, `breakdown=[]` por ahora |
| contenido del `.md` | `readme` | Renderizado en tab Overview via `renderMarkdown` |

### Dependencias que ya no se usan
- `lucide-react` — Reemplazada por `Icons.jsx`
- `react-markdown` + `remark-gfm` — Reemplazados por `markdown.js`

> No se requieren dependencias nuevas. El proyecto sigue usando solo React + Vite.

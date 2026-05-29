// src/components/ProjectList.jsx
import React, { useState, useMemo } from 'react';
import { Icon, typeIcon, typeLabel } from './Icons.jsx';
import { fmtUSD, pct } from './markdown.js';
import ProjectModal from './ProjectModal.jsx';
import '../ProjectList.css';

/* ---------- Card individual ---------- */
function ProjectCard({ project, onOpen }) {
  const gcp = project.gcpCost || { current: 0, previous: 0 };
  const trend = pct(gcp.current, gcp.previous);
  const trendClass = Math.abs(trend) < 1 ? 'trend-flat' : trend < 0 ? 'trend-down' : 'trend-up';
  const TrendIcon = Math.abs(trend) < 1 ? Icon.Flat : trend < 0 ? Icon.TrendDown : Icon.TrendUp;

  const tech = project.tech || [];
  const visibleTech = tech.slice(0, 4);
  const moreCount = tech.length - visibleTech.length;

  return (
    <article
      className="project-card"
      data-status={project.status}
      onClick={() => onOpen(project)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(project); }
      }}
    >
      <div className="card-top">
        <div className="card-icon">{typeIcon[project.type] || <Icon.Folder />}</div>
        <span className="card-type">
          <Icon.Dot />
          {typeLabel[project.type] || project.type || 'Project'}
        </span>
      </div>

      <h3 className="card-title">{project.title}</h3>
      <p className="card-desc">{project.description}</p>

      {tech.length > 0 && (
        <div className="tech-stack">
          {visibleTech.map(t => <span key={t} className="tech-badge">{t}</span>)}
          {moreCount > 0 && <span className="tech-badge more-badge">+{moreCount}</span>}
        </div>
      )}

      <div className="card-footer">
        {project.gcpCost ? (
          <div className="card-cost">
            <span className="card-cost-label">GCP</span>
            <span className={`card-cost-value ${trendClass}`}>
              <TrendIcon />
              {fmtUSD(gcp.current)}
              <span className="card-cost-change">
                {Math.abs(trend) < 1 ? '~0%' : `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
              </span>
            </span>
          </div>
        ) : <div />}
        <div className="card-arrow"><Icon.Arrow /></div>
      </div>
    </article>
  );
}

/* ---------- Barra de filtros ---------- */
function FilterBar({ filter, setFilter, search, setSearch, counts }) {
  const filters = [
    { id: 'all',        label: 'Todos' },
    { id: 'web-app',    label: 'Web Apps' },
    { id: 'automation', label: 'Automatización' },
  ];

  return (
    <div className="filter-bar">
      {filters.map(f => (
        <button
          key={f.id}
          className={`filter-btn ${filter === f.id ? 'active' : ''}`}
          onClick={() => setFilter(f.id)}
        >
          {f.label}
          {counts[f.id] > 0 && <span className="count">{counts[f.id]}</span>}
        </button>
      ))}
      <div className="filter-search">
        <Icon.Search />
        <input
          type="text"
          placeholder="Buscar proyecto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

/* ---------- Componente principal ---------- */
export default function ProjectList({ projects = [], loading, error, variant = 'default' }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openProject, setOpenProject] = useState(null);

  const counts = useMemo(() => {
    const c = { all: projects.length, archived: 0 };
    projects.forEach(p => {
      c[p.type] = (c[p.type] || 0) + 1;
      if (p.status === 'archived') c.archived++;
    });
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (filter === 'archived' && p.status !== 'archived') return false;
      if (filter !== 'all' && filter !== 'archived' && p.type !== filter) return false;
      if (filter !== 'archived' && p.status === 'archived') return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.title || '').toLowerCase().includes(q) ||
               (p.description || '').toLowerCase().includes(q) ||
               (p.tech || []).some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [filter, search, projects]);

  if (loading) {
    return <div className="loader">Cargando proyectos...</div>;
  }
  if (error) {
    return <div className="loader error">Error al cargar: {error}</div>;
  }

  const gridClass = `project-grid stagger variant-${variant}`;

  return (
    <section id="proyectos">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">{filtered.length} de {projects.length}</div>
          <h2 className="section-title">Proyectos</h2>
        </div>
        <div className="section-count">
          <strong>{filtered.length}</strong> mostrando
        </div>
      </div>

      <FilterBar
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        counts={counts}
      />

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icon.Empty /></div>
          <div>No hay proyectos que coincidan con tu búsqueda.</div>
        </div>
      ) : (
        <div className={gridClass} key={`${filter}-${variant}`}>
          {filtered.map(p => (
            <ProjectCard key={p.id || p.title} project={p} onOpen={setOpenProject} />
          ))}
        </div>
      )}

      {openProject && (
        <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
      )}
    </section>
  );
}

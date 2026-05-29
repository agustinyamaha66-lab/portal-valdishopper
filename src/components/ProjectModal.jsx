// src/components/ProjectModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Icon, typeIcon } from './Icons.jsx';
import { renderMarkdown, fmtUSD, pct } from './markdown.js';
import GcpDonutChart from './GcpDonutChart.jsx';

export default function ProjectModal({ project, onClose }) {
  const [tab, setTab] = useState('overview');
  const [zoomedImg, setZoomedImg] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { if (zoomedImg) setZoomedImg(null); else onClose(); }
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, zoomedImg]);

  if (!project) return null;

  const gcp = project.gcpCost || { current: 0, previous: 0, breakdown: [] };
  const trend = pct(gcp.current, gcp.previous);
  const trendIsDown = trend < 0;
  const maxBar = gcp.breakdown.length
    ? Math.max(...gcp.breakdown.map(b => Math.max(b.current, b.previous)))
    : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Icon.Book /> },
    { id: 'tech',     label: 'Stack',    icon: <Icon.Code /> },
    { id: 'costs',    label: 'Costos',   icon: <Icon.Chart /> },
  ];

  const statusLabel = {
    active:   'En producción',
    paused:   'Pausado',
    archived: 'Archivado',
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="modal-title-block">
              <div className="modal-icon">{typeIcon[project.type] || <Icon.Folder />}</div>
              <div className="modal-title-text">
                <h2>{project.title}</h2>
                {project.tagline && <p className="modal-subtitle">{project.tagline}</p>}
              </div>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Cerrar">
              <Icon.Close />
            </button>
          </div>
          <div className="modal-meta-row">
            {project.status && (
              <span className={`meta-badge status-${project.status}`}>
                <Icon.Dot />
                {statusLabel[project.status] || project.status}
              </span>
            )}
            {project.updated && (
              <span className="meta-badge">
                <Icon.Calendar />
                Actualizado hace {project.updated}
              </span>
            )}
            {project.repo && (
              <a className="meta-badge" href={`https://${project.repo}`} target="_blank" rel="noopener">
                <Icon.Github />
                {project.repo.replace('github.com/', '')}
              </a>
            )}
            {project.live && (
              <a className="meta-badge" href={`https://${project.live}`} target="_blank" rel="noopener">
                <Icon.External />
                {project.live}
              </a>
            )}
          </div>
        </div>

        <div className="modal-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`modal-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'overview' && (
            <div className={project.screenshots?.length ? 'overview-split' : ''}>
              <div className="overview-main">
                {project.metrics && (
                  <div className="modal-section">
                    <div className="modal-section-title">Métricas clave</div>
                    <div className="stats-grid">
                      {project.metrics.users && (
                        <div className="stat-cell">
                          <div className="stat-label">Usuarios</div>
                          <div className="stat-value">{project.metrics.users}</div>
                        </div>
                      )}
                      {project.metrics.requests && (
                        <div className="stat-cell">
                          <div className="stat-label">Tráfico</div>
                          <div className="stat-value">{project.metrics.requests}</div>
                        </div>
                      )}
                      {project.metrics.uptime && (
                        <div className="stat-cell">
                          <div className="stat-label">Uptime</div>
                          <div className="stat-value">{project.metrics.uptime}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {project.readme && (
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(project.readme) }}
                  />
                )}
              </div>

              {project.screenshots?.length > 0 && (
                <aside className="overview-sidebar">
                  <div className="sidebar-label">Capturas</div>
                  {project.screenshots.map((src, i) => (
                    <img key={i} src={src} alt={`Vista ${i + 1}`} className="modal-screenshot" onClick={() => setZoomedImg(src)} />
                  ))}
                </aside>
              )}
            </div>
          )}

          {tab === 'tech' && (
            <>
              <div className="modal-section">
                <div className="modal-section-title">Stack tecnológico</div>
                <div className="modal-tech-grid">
                  {(project.tech || []).map(t => <span key={t} className="tech-badge">{t}</span>)}
                </div>
              </div>
              <div className="modal-section">
                <div className="modal-section-title">Links</div>
                <div className="modal-meta-row">
                  {project.repo && (
                    <a className="meta-badge" href={`https://${project.repo}`} target="_blank" rel="noopener">
                      <Icon.Github /> Repositorio
                    </a>
                  )}
                  {project.live && (
                    <a className="meta-badge" href={`https://${project.live}`} target="_blank" rel="noopener">
                      <Icon.External /> Producción
                    </a>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'costs' && project.gcpCost && (
            <div className="gcp-chart-block">
              <div className="gcp-chart-header">
                <div>
                  <div className="gcp-chart-period">Costo GCP · Mayo 2026</div>
                  <div className="gcp-chart-summary" style={{ marginTop: 6 }}>
                    <span className="gcp-chart-total">{fmtUSD(gcp.current)}</span>
                    {gcp.previous > 0 && (
                      <span className={`gcp-chart-trend ${trendIsDown ? 'down' : 'up'}`}>
                        {trendIsDown ? <Icon.TrendDown /> : <Icon.TrendUp />}
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {gcp.previous > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="gcp-chart-period">vs. mes anterior</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
                      {fmtUSD(gcp.previous)}
                    </div>
                  </div>
                )}
              </div>
              {gcp.breakdown.length > 0
                ? <GcpDonutChart breakdown={gcp.breakdown} />
                : null
              }
            </div>
          )}

          {tab === 'costs' && !project.gcpCost && (
            <div className="empty">
              <div className="empty-icon"><Icon.Chart /></div>
              <div>No hay data de costos GCP para este proyecto.</div>
            </div>
          )}
        </div>
      </div>

      {zoomedImg && (
        <div className="lightbox" onClick={() => setZoomedImg(null)}>
          <div className="lightbox-dialog" onClick={e => e.stopPropagation()}>
            <img src={zoomedImg} alt="Zoom" className="lightbox-img" />
            <button className="lightbox-close" onClick={() => setZoomedImg(null)} aria-label="Cerrar">
              <Icon.Close />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/App.jsx — Shell con TopNav + Hero + ProjectList
import React, { useState, useEffect } from 'react';
import ProjectList from './components/ProjectList.jsx';
import { Icon } from './components/Icons.jsx';
import './App.css';

const imageModules = import.meta.glob('./assets/*.{png,jpg,jpeg,webp,gif}', { eager: true });
function resolveScreenshots(names) {
  if (!names || !names.length) return [];
  return names.map(n => imageModules[`./assets/${n.trim()}`]?.default).filter(Boolean);
}

/* ---------- Links data ---------- */
const LINKS = [
  {
    label: 'Dashboard PowerBI',
    description: 'Reporte interactivo de métricas',
    kind: 'powerbi',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiYWFiZTg2MzAtZjUzMi00NDMzLWIzZjYtZjMyYzQ0YjFhMzMxIiwidCI6ImExYTBlYjdmLWI2OWMtNDM2My1hMjNkLTg3ZjZiY2U5YmIwYSJ9',
  },
  {
    label: 'App Valdishopper',
    description: 'Aplicación web publicada en GitHub Pages',
    kind: 'web',
    url: 'https://valdishoppercl.github.io/App-Valdishopper/',
  },
  {
    label: 'Google Script A',
    description: 'Script de automatización',
    kind: 'script',
    url: 'https://script.google.com/a/macros/valdishopper.com/s/AKfycbydbxuIbAEi5BCyIqRUuxQJeWLUkFMSEXa7ZbBRsaZetzChX1QFUU3QhpRM-V9M-yO4/exec',
  },
  {
    label: 'Google Script B',
    description: 'Script de automatización',
    kind: 'script',
    url: 'https://script.google.com/a/macros/valdishopper.com/s/AKfycbwAEG8drMNFskpGNlNDSLUp4ysGiIOiEgfmvE677_xel05NSe_RZvPMlIEUIUGWFj87/exec',
  },
  {
    label: 'Google Script C',
    description: 'Script de automatización',
    kind: 'script',
    url: 'https://script.google.com/a/macros/valdishopper.com/s/AKfycbw5SAlkUShuOGkd0qRtpnsPNpCqKKHiVRPLiwZzxr1cAG4yFdkVhUNqxdctttGcsbAgrg/exec',
  },
];

function LinkKindBadge({ kind }) {
  const map = {
    powerbi: { label: 'Power BI', color: '#f2c811', bg: 'rgba(242,200,17,0.12)' },
    script:  { label: 'Google Script', color: '#4285f4', bg: 'rgba(66,133,244,0.12)' },
    web:     { label: 'Web App', color: '#34a853', bg: 'rgba(52,168,83,0.12)' },
  };
  const { label, color, bg } = map[kind] || map.web;
  return (
    <span className="link-badge" style={{ color, background: bg }}>{label}</span>
  );
}

function LinkIcon({ kind }) {
  if (kind === 'powerbi') return <Icon.Chart />;
  if (kind === 'script')  return <Icon.Code />;
  return <Icon.Globe />;
}

/* ---------- TopNav sticky ---------- */
function TopNav() {
  return (
    <nav className="topnav">
      <div className="page topnav-inner">
        <div className="topnav-links">
          <a className="topnav-link" href="#proyectos">Proyectos</a>
          <a className="topnav-link" href="#links">Links</a>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <header className="hero fade-in">
      <h1 className="hero-title">
        Proyectos <span className="accent">consolidados</span>
      </h1>
      <p className="hero-sub">
        Proyectos Valdishopper
      </p>
      <div className="hero-links">
        <a className="hero-link primary-link" href="#proyectos">
          Ver proyectos <Icon.Arrow />
        </a>
      </div>
    </header>
  );
}

/* ---------- Helpers de mapeo (markdown → nuevo shape) ---------- */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  });
  return { data, content: match[2] };
}

function mapType(type) {
  if (!type) return 'web-app';
  const t = type.toLowerCase();
  if (t.includes('etl')) return 'etl';
  if (t.includes('design')) return 'design-system';
  if (t.includes('rpa') || t.includes('scraping') || t.includes('automation')) return 'automation';
  if (t.includes('arch') || t.includes('archiv')) return 'archive';
  return 'web-app';
}

function mapStatus(status) {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (s.includes('pausa') || s.includes('paused')) return 'paused';
  if (s.includes('archiv') || s.includes('archive')) return 'archived';
  return 'active';
}

function parseGcpCost(costStr, prevStr, namesArr, costsArr, changesArr) {
  if (!costStr) return null;
  const num = parseFloat(costStr.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num === 0) return null;
  const prev = prevStr ? parseFloat(prevStr.replace(/[^0-9.]/g, '')) : 0;
  let breakdown = [];
  if (namesArr?.length && costsArr?.length) {
    breakdown = namesArr.map((name, i) => {
      const current = parseFloat(costsArr[i]) || 0;
      const change  = changesArr ? (parseFloat(changesArr[i]) || 0) : 0;
      const previous = change !== 0 ? Math.round(current / (1 + change / 100)) : 0;
      return { name, current, previous, change };
    });
  }
  return { current: num, previous: isNaN(prev) ? 0 : prev, breakdown };
}

function extractDescription(data, content) {
  if (data.description) return data.description;
  // primer párrafo del contenido como fallback
  const match = content.replace(/^#[^\n]*\n/m, '').match(/\*\*[^*]+\*\*([^.!?\n]{10,})/);
  if (match) return match[0].replace(/\*\*/g, '').trim().slice(0, 140);
  const plain = content.replace(/#+[^\n]*/g, '').replace(/[*_`[\]]/g, '').trim();
  return plain.split('\n').find(l => l.trim().length > 20)?.trim().slice(0, 140) || '';
}

/* ---------- Links Section ---------- */
function LinksSection() {
  return (
    <section id="links" className="links-section">
      <h2 className="section-title">Links</h2>
      <p className="section-sub">Herramientas y recursos externos del equipo</p>
      <div className="links-grid">
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <div className="link-card-header">
              <span className="link-icon"><LinkIcon kind={link.kind} /></span>
              <LinkKindBadge kind={link.kind} />
            </div>
            <p className="link-card-label">{link.label}</p>
            <p className="link-card-desc">{link.description}</p>
            <span className="link-card-arrow"><Icon.External /></span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------- App principal ---------- */
export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const modules = import.meta.glob('./content/projects/*.md', { query: '?raw', import: 'default' });
    Promise.all(
      Object.keys(modules).map(async (path) => {
        const raw = await modules[path]();
        const { data, content } = parseFrontmatter(raw);
        return {
          id:          path.replace(/.*\//, '').replace(/\.md$/, ''),
          title:       data.title || 'Proyecto',
          type:        mapType(data.type),
          status:      mapStatus(data.status),
          description: extractDescription(data, content),
          tech:        data.technologies || [],
          gcpCost:     parseGcpCost(data.gcp_cost, data.gcp_cost_previous, data.gcp_svc_names, data.gcp_svc_costs, data.gcp_svc_changes),
          readme:      content,
          repo:        data.repo || null,
          live:        data.live || null,
          screenshots: resolveScreenshots(data.screenshots),
        };
      })
    )
      .then(data => { setProjects(data); setLoading(false); })
      .catch(e  => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <>
      <div className="header-band">
        <TopNav />
        <div className="page">
          <Hero />
        </div>
      </div>
      <main className="page">
        <ProjectList
          projects={projects}
          loading={loading}
          error={error}
          variant="default"
        />
        <LinksSection />
      </main>
    </>
  );
}

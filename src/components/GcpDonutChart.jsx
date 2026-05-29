import React from 'react';
import { fmtUSD } from './markdown.js';

const R = 72;
const C = 2 * Math.PI * R;

const SERVICE_COLORS = {
  'Cloud SQL':         '#d64294',
  'Redis':             '#ea4335',
  'Networking':        '#fbbc04',
  'Gemini API':        '#34a853',
  'Artifact Registry': '#ff6d00',
  'Cloud Scheduler':   '#0b1c49',
  'Otros':             '#94a3b8',
};
const FALLBACK = ['#d64294', '#c01877', '#0b1c49', '#34a853', '#ff6d00', '#1e3a82', '#94a3b8', '#06b6d4'];

export default function GcpDonutChart({ breakdown }) {
  const total = breakdown.reduce((s, b) => s + b.current, 0);
  if (!total) return null;

  let cumPct = 0;
  const segments = breakdown.map((b, i) => {
    const pct    = b.current / total;
    const dash   = pct * C;
    const offset = C / 4 - cumPct * C;
    cumPct += pct;
    return { ...b, pct, dash, offset, color: SERVICE_COLORS[b.name] || FALLBACK[i % FALLBACK.length] };
  });

  const totalK = (total / 1000).toFixed(0);

  return (
    <div className="donut-wrap">
      <div className="donut-svg-col">
        <svg viewBox="0 0 200 200" className="donut-svg" aria-hidden="true">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--bg-2)" strokeWidth="22" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="100" cy="100" r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="22"
              strokeDasharray={`${seg.dash} ${C}`}
              strokeDashoffset={seg.offset}
            />
          ))}
          <text x="100" y="94" textAnchor="middle"
            fill="var(--text-3)" fontSize="11"
            fontFamily="Inter, system-ui, sans-serif" fontWeight="500">
            Total
          </text>
          <text x="100" y="116" textAnchor="middle"
            fill="var(--text)" fontSize="19"
            fontFamily="JetBrains Mono, monospace" fontWeight="600">
            ${totalK}K
          </text>
        </svg>
      </div>

      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="donut-legend-row">
            <span className="donut-dot" style={{ background: seg.color }} />
            <span className="donut-lname">{seg.name}</span>
            <span className="donut-lpct">{(seg.pct * 100).toFixed(1)}%</span>
            <span className="donut-lval">{fmtUSD(seg.current)}</span>
            {seg.change !== 0 && (
              <span className={`donut-lchange ${seg.change < 0 ? 'down' : 'up'}`}>
                {seg.change < 0 ? '↓' : '↑'}{Math.abs(seg.change)}%
              </span>
            )}
          </div>
        ))}
        <div className="donut-legend-total">
          <span />
          <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Total cuenta GCP</span>
          <span />
          <span className="donut-lval" style={{ color: 'var(--text)' }}>{fmtUSD(total)}</span>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { IconDashboard } from '../components/Icons';

const collectionLabels = {
  programs: 'Programs',
  leads: 'Leads',
  events: 'Events',
  posts: 'CMS Posts',
  testimonials: 'Testimonials',
  settings: 'Settings',
  notifications: 'Notifications'
};

function identity(value) {
  if (!value) return '';
  if (typeof value === 'object') return value.name || value.email || value.title || value._id || '';
  return String(value);
}

function rowSummary(type, row) {
  const common = {
    id: row._id,
    title: row.title || row.name || row.key || '(untitled)',
    detail: row.subtitle || row.interestTitle || row.body || row.role || row.category || '',
    owner: identity(row.userId || row.instructorId || row.authorId),
    status: row.publicationStatus || row.status || (row.readAt ? 'read' : type === 'notifications' ? 'unread' : ''),
    source: row.sourceSystem || 'app',
    date: row.eventDate || row.publishedAt || row.createdAt || row.updatedAt
  };
  if (type === 'leads') common.owner = row.email || row.phone || identity(row.userId);
  return common;
}

export function MigrationContentView({ data = {}, search = '' }) {
  const [activeCollection, setActiveCollection] = useState('programs');
  const collections = data.collections || {};
  const counts = data.counts || {};
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (collections[activeCollection] || [])
      .map((row) => rowSummary(activeCollection, row))
      .filter((row) => !needle || Object.values(row).some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [activeCollection, collections, search]);

  return (
    <div>
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div className="section-title" style={{ marginBottom: '0.75rem' }}>
          <IconDashboard style={{ color: 'var(--accent-primary)' }} />
          <span>Migrated Content Operations</span>
        </div>
        <p style={{ color: '#64748B', marginBottom: '0.9rem' }}>
          Read-only visibility into the new MongoDB collections. Setting values are intentionally hidden.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(collectionLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`nav-item-btn ${activeCollection === key ? 'active' : ''}`}
              style={{ width: 'auto' }}
              onClick={() => setActiveCollection(key)}
            >
              {label} ({counts[key] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div className="section-title">
            <span>{collectionLabels[activeCollection]} ({rows.length})</span>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title / Key</th>
                <th>Details</th>
                <th>User / Owner</th>
                <th>Status</th>
                <th>Source</th>
                <th>Date</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>No records found.</td></tr>
              ) : rows.map((row) => (
                <tr key={String(row.id)}>
                  <td style={{ fontWeight: 700 }}>{row.title}</td>
                  <td>{row.detail || '—'}</td>
                  <td>{row.owner || '—'}</td>
                  <td><span className="skill-tag">{row.status || '—'}</span></td>
                  <td>{row.source}</td>
                  <td>{row.date ? new Date(row.date).toLocaleString('en-IN') : '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{String(row.id || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { IconWebinars, IconCross } from '../components/Icons';

export function WebinarsView({ search = '' }) {
  const [webinars, setWebinars] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [date, setDate] = useState('');

  const filtered = webinars.filter((w) =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.speaker.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e) => {
    e.preventDefault();
    setWebinars([{ id: `w-${Date.now()}`, title, speaker, date: date || 'Upcoming', attendees: 0 }, ...webinars]);
    setTitle('');
    setSpeaker('');
    setDate('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setWebinars(webinars.filter((w) => w.id !== id));
  };

  return (
    <div>
      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconWebinars style={{ color: 'var(--accent-amber)' }} />
              <span>Live Webinars & Masterclasses ({filtered.length})</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Schedule live mentor sessions and interactive workshops.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Schedule Webinar'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
            <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '1rem' }}>Schedule Masterclass</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Webinar Topic</label>
                <input type="text" className="form-input" placeholder="Topic title..." value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Speaker / Host</label>
                <input type="text" className="form-input" placeholder="Speaker name..." value={speaker} onChange={(e) => setSpeaker(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input type="text" className="form-input" placeholder="e.g. Next Mon, 8 PM" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Schedule Live Session
            </button>
          </form>
        )}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Session Title</th>
                <th>Speaker / Host</th>
                <th>Scheduled Time</th>
                <th>Registered Learners</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id}>
                  <td style={{ fontWeight: '600', color: 'white' }}>{w.title}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{w.speaker}</td>
                  <td>{w.date}</td>
                  <td style={{ color: '#34D399', fontWeight: '600' }}>👥 {w.attendees} Registered</td>
                  <td>
                    <button className="btn btn-reject" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleDelete(w.id)}>
                      <IconCross /> Cancel Session
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

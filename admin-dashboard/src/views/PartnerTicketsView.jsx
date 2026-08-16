import React, { useState } from 'react';
import { IconMentor, IconCross, IconCheck } from '../components/Icons';

export function PartnerTicketsView({ search = '' }) {
  const [tickets, setTickets] = useState([]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('In Progress');

  const filtered = tickets.filter((t) =>
    t.id?.toLowerCase().includes(search.toLowerCase()) ||
    t.partnerName?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setReplyText('');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === selectedTicket.id) {
          const updatedReplies = [...(t.replies || [])];
          if (replyText.trim()) {
            updatedReplies.push({
              author: 'Admin Support',
              text: replyText.trim(),
              date: new Date().toLocaleString()
            });
          }
          return {
            ...t,
            status: newStatus,
            replies: updatedReplies
          };
        }
        return t;
      })
    );

    alert(`Ticket #${selectedTicket.id} updated to status "${newStatus}". Response email sent to ${selectedTicket.email}!`);
    setSelectedTicket(null);
  };

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Open Help Tickets</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#DC2626', marginTop: '2px' }}>
            {filtered.filter(t => t.status === 'Open').length} Tickets
          </div>
          <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '2px' }}>Requires Admin Attention</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>In Progress Tickets</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            {filtered.filter(t => t.status === 'In Progress').length} Pending
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>Under Review</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #0A6836' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Resolved Tickets</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A6836', marginTop: '2px' }}>
            {filtered.filter(t => t.status === 'Resolved').length} Resolved
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>Closed Support Requests</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconMentor style={{ color: 'var(--accent-primary)' }} />
              <span>Partner Help & Support Tickets ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              Review help tickets raised by partner institutes, update status, and send email replies.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Partner Institute</th>
                <th>Subject & Category</th>
                <th>Priority</th>
                <th>Raised Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No support tickets found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' }}>
                        {t.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{t.partnerName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{t.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{t.subject}</div>
                      <div style={{ fontSize: '0.72rem', color: '#0284C7' }}>{t.category}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          color: t.priority === 'High' ? '#DC2626' : t.priority === 'Medium' ? '#D97706' : '#0A6836'
                        }}
                      >
                        {t.priority} Priority
                      </span>
                    </td>
                    <td>{t.date}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: t.status === 'Resolved' ? '#DCFCE7' : t.status === 'Open' ? '#FEE2E2' : '#FEF3C7',
                          color: t.status === 'Resolved' ? '#0A6836' : t.status === 'Open' ? '#DC2626' : '#D97706',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleOpenTicketModal(t)}
                      >
                        Reply & Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reply & Status Update Modal */}
      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <form onSubmit={handleSendReply} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Support Ticket #{selectedTicket.id}
              </h3>
              <button type="button" onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: '700', color: '#0F172A' }}>Partner: {selectedTicket.partnerName} ({selectedTicket.email})</div>
              <div style={{ fontSize: '0.8rem', color: '#0284C7', marginTop: '2px', fontWeight: '600' }}>Subject: {selectedTicket.subject}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', background: '#FFFFFF', padding: '0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                "{selectedTicket.message}"
              </div>
            </div>

            {/* Existing Replies List */}
            {selectedTicket.replies?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Previous Response History:</div>
                {selectedTicket.replies.map((r, i) => (
                  <div key={i} style={{ background: '#E8F5E9', padding: '0.65rem', borderRadius: '6px', marginBottom: '0.4rem', border: '1px solid #C8E6C9' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0A6836' }}>{r.author} • {r.date}</div>
                    <div style={{ fontSize: '0.78rem', color: '#0F172A', marginTop: '2px' }}>{r.text}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Update Ticket Status</label>
              <select className="form-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="Open">Open (Pending Admin Action)</option>
                <option value="In Progress">In Progress (Under Review)</option>
                <option value="Resolved">Resolved (Issue Fixed & Closed)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Response / Reply Message to Partner</label>
              <textarea
                className="form-input"
                rows="3"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type official reply to partner institute (Will be emailed directly)..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn" style={{ background: '#F1F5F9', color: '#475569' }} onClick={() => setSelectedTicket(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send Email Reply & Update Ticket Status
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

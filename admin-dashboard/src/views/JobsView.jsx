import React, { useState } from 'react';
import { IconJobs, IconCross } from '../components/Icons';

export function JobsView({ jobs, onCreateJob, onDeleteJob, search }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote');
  const [stipend, setStipend] = useState('₹45,000 / month');
  const [type, setType] = useState('Full-Time');
  const [description, setDescription] = useState('');

  const filtered = jobs.filter((j) =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateJob({ title, company, location, stipend, type, description });
    setTitle('');
    setCompany('');
    setDescription('');
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconJobs style={{ color: 'var(--accent-rose)' }} />
              <span>Jobs & Placement Opportunities ({filtered.length})</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Post internships, full-time jobs, and referral openings for students.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(!showAddModal)}>
            {showAddModal ? 'Cancel' : '+ Post New Job'}
          </button>
        </div>

        {showAddModal && (
          <form onSubmit={handleSubmit} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
            <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '1rem' }}>Post Job / Internship</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Role Title</label>
                <input type="text" className="form-input" placeholder="e.g. SDE-1 Frontend Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-input" placeholder="e.g. TechCorp Labs" value={company} onChange={(e) => setCompany(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="Remote / Bengaluru" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Stipend / Package</label>
                <input type="text" className="form-input" placeholder="₹50,000/mo or 12 LPA" value={stipend} onChange={(e) => setStipend(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea className="form-input" rows="3" placeholder="Requirements, skills, application instructions..." value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
            </div>
            <button type="submit" className="btn btn-primary">
              Post Job Opening
            </button>
          </form>
        )}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Stipend / CTC</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No job postings found.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id || job._id}>
                    <td style={{ fontWeight: '600', color: 'white' }}>{job.title}</td>
                    <td style={{ color: 'var(--accent-cyan)' }}>{job.company}</td>
                    <td>{job.location || 'Remote'}</td>
                    <td style={{ color: '#34D399', fontWeight: '600' }}>{job.stipend || 'Competitive'}</td>
                    <td><span className="role-pill mentor">{job.type || 'Full-Time'}</span></td>
                    <td>
                      <button className="btn btn-reject" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => onDeleteJob(job.id || job._id)}>
                        <IconCross /> Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

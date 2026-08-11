import React, { useState } from 'react';
import { IconCheck, IconCross, IconMentor } from '../components/Icons';

export function MentorApprovalsView({ mentors, onApprove, onReject, search }) {
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'approved' | 'all'

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.mentorCategory?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return !m.isApproved;
    if (filterTab === 'approved') return m.isApproved;
    return true;
  });

  const pendingCount = mentors.filter((m) => !m.isApproved).length;
  const approvedCount = mentors.filter((m) => m.isApproved).length;

  return (
    <div>
      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconMentor style={{ color: 'var(--accent-cyan)' }} />
              <span>Mentor Approval & Visibility Center</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Newly registered mentors stay hidden from public feeds until approved by an admin.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px' }}>
            <button
              className={`btn ${filterTab === 'pending' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setFilterTab('pending')}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              className={`btn ${filterTab === 'approved' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setFilterTab('approved')}
            >
              Approved ({approvedCount})
            </button>
            <button
              className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setFilterTab('all')}
            >
              All ({mentors.length})
            </button>
          </div>
        </div>

        {filteredMentors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.1rem', color: 'white', fontWeight: '600' }}>No mentors found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {filterTab === 'pending'
                ? 'There are no pending mentor profiles waiting for review.'
                : 'No mentor accounts match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="mentors-grid">
            {filteredMentors.map((mentor) => (
              <div key={mentor.id || mentor._id} className="mentor-card">
                <div className="mentor-header">
                  <img
                    src={mentor.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={mentor.name}
                    className="mentor-avatar"
                  />
                  <div className="mentor-meta">
                    <h3>{mentor.name}</h3>
                    <p>{mentor.email}</p>
                    <span className={`mentor-badge ${mentor.isApproved ? 'approved' : 'pending'}`}>
                      {mentor.isApproved ? 'Approved & Visible Publicly' : 'Pending Admin Approval'}
                    </span>
                  </div>
                </div>

                <div className="mentor-bio">
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Category:</strong> {mentor.mentorCategory || 'TCM Information Tech'}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Title:</strong> {mentor.title || 'Senior Mentor'}
                  </div>
                  <div>
                    <strong>Bio:</strong> {mentor.bio || 'Registered Educator on TCM platform.'}
                  </div>
                </div>

                {mentor.skills && mentor.skills.length > 0 && (
                  <div className="mentor-skills">
                    {mentor.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {typeof skill === 'string' ? skill : skill.name || 'Mentorship'}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mentor-actions">
                  {!mentor.isApproved ? (
                    <>
                      <button className="btn btn-approve" onClick={() => onApprove(mentor.id || mentor._id)}>
                        <IconCheck /> Approve Profile
                      </button>
                      <button className="btn btn-reject" onClick={() => onReject(mentor.id || mentor._id)}>
                        <IconCross /> Reject
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-reject" style={{ width: '100%' }} onClick={() => onReject(mentor.id || mentor._id)}>
                      <IconCross /> Revoke Approval (Hide Profile)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

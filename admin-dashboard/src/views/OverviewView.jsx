import React from 'react';
import {
  IconMentor,
  IconUsers,
  IconCourses,
  IconJobs,
  IconWebinars,
  IconCheck,
  IconCross
} from '../components/Icons';

export function OverviewView({ stats, pendingMentors, onApprove, onReject, onNavigate }) {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div className="stat-header">
            <span className="stat-title">Pending Mentors</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
              <IconMentor />
            </div>
          </div>
          <div className="stat-value">{stats.pendingMentorsCount || pendingMentors.length || 0}</div>
          <div className="stat-sub" style={{ color: '#FBBF24' }}>Requires Admin Verification</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Platform Users</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(91, 60, 245, 0.15)', color: '#A78BFA' }}>
              <IconUsers />
            </div>
          </div>
          <div className="stat-value">{stats.totalUsers || 0}</div>
          <div className="stat-sub">{stats.studentsCount || 0} Students registered</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Approved Mentors</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
              <IconMentor />
            </div>
          </div>
          <div className="stat-value">{stats.approvedMentorsCount || 0}</div>
          <div className="stat-sub" style={{ color: '#34D399' }}>Publicly visible on TCM</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Active Courses & Prep</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67E8F9' }}>
              <IconCourses />
            </div>
          </div>
          <div className="stat-value">{stats.coursesCount || 0}</div>
          <div className="stat-sub">Live & Self-Paced Courses</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Job & Internship Listings</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#FDA4AF' }}>
              <IconJobs />
            </div>
          </div>
          <div className="stat-value">{stats.jobsCount || 0}</div>
          <div className="stat-sub">Active Openings</div>
        </div>
      </div>

      {/* Quick Pending Mentors Review Block */}
      <div className="glass-panel">
        <div className="section-header">
          <div className="section-title">
            <IconMentor style={{ color: '#FBBF24' }} />
            <span>Mentor Approvals Pending ({pendingMentors.length})</span>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('approvals')}>
            View All Approvals →
          </button>
        </div>

        {pendingMentors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
            <h3 style={{ fontSize: '1.1rem', color: 'white', fontWeight: '600' }}>All Mentor Registrations Approved!</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>There are no pending mentor profiles waiting for admin approval right now.</p>
          </div>
        ) : (
          <div className="mentors-grid">
            {pendingMentors.slice(0, 3).map((mentor) => (
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
                    <span className="mentor-badge pending">Pending Approval</span>
                  </div>
                </div>

                <div className="mentor-bio">
                  <strong>Category:</strong> {mentor.mentorCategory || 'TCM Educator'} <br />
                  <strong>Experience:</strong> {mentor.yearsExperience || 'Senior Level'}
                </div>

                <div className="mentor-actions">
                  <button className="btn btn-approve" onClick={() => onApprove(mentor.id || mentor._id)}>
                    <IconCheck /> Approve Profile
                  </button>
                  <button className="btn btn-reject" onClick={() => onReject(mentor.id || mentor._id)}>
                    <IconCross /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

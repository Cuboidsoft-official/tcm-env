import React from 'react';
import { IconUsers } from '../components/Icons';

export function StudentsAnalyticsView({ enrollmentsData = {}, search = '' }) {
  const list = enrollmentsData.enrollments || [
    {
      id: 'enr-101',
      studentName: 'Aman Verma',
      studentEmail: 'aman.verma@gmail.com',
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      enrolledDate: '14 May 2025',
      progressPercent: 85,
      completedModules: '17 / 20 Modules',
      status: 'In Progress'
    },
    {
      id: 'enr-102',
      studentName: 'Priya Sahu',
      studentEmail: 'priya.sahu@yahoo.com',
      studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      enrolledDate: '10 Apr 2025',
      progressPercent: 100,
      completedModules: '15 / 15 Modules (Certified)',
      status: 'Completed'
    },
    {
      id: 'enr-103',
      studentName: 'Rohit Patel',
      studentEmail: 'rohit.patel@outlook.com',
      studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      enrolledDate: '02 Jun 2025',
      progressPercent: 40,
      completedModules: '8 / 20 Modules',
      status: 'In Progress'
    },
    {
      id: 'enr-104',
      studentName: 'Kavya Singh',
      studentEmail: 'kavya.singh@gmail.com',
      studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      enrolledDate: '18 May 2025',
      progressPercent: 65,
      completedModules: '13 / 20 Modules',
      status: 'In Progress'
    }
  ];

  const filtered = list.filter((item) =>
    item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    item.studentEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Enrolled Students</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
            {filtered.length} Students
          </div>
          <div style={{ fontSize: '0.72rem', color: '#2563EB', marginTop: '2px' }}>Verified Student Accounts</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Active Learners</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A6836', marginTop: '2px' }}>
            {filtered.filter(s => s.status === 'In Progress').length} Active
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>Currently Taking Lessons</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Average Student Progress</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            72.5% Completed
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>Platform Average Progress</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconUsers style={{ color: 'var(--accent-primary)' }} />
              <span>Student Directory & Overall Learning Progress ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              View all student accounts, enrollment dates, and completed module percentages.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name & Email</th>
                <th>Joined / Enrolled Date</th>
                <th>Overall Course Progress (%)</th>
                <th>Completed Modules</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No student records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <img
                          src={item.studentAvatar}
                          alt={item.studentName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.studentName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.enrolledDate}</td>
                    <td>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
                          <span style={{ color: item.progressPercent === 100 ? '#0A6836' : '#2563EB', fontWeight: '700' }}>
                            {item.progressPercent}% {item.status === 'Completed' ? 'Certified' : 'In Progress'}
                          </span>
                        </div>
                        <div style={{ width: '140px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${item.progressPercent}%`,
                              height: '100%',
                              background: item.progressPercent === 100 ? '#10B981' : item.progressPercent > 50 ? '#2563EB' : '#F59E0B',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{item.completedModules}</td>
                    <td>
                      <span className={`role-pill ${item.status === 'Completed' ? 'mentor' : 'student'}`}>
                        {item.status}
                      </span>
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

import React, { useState } from 'react';
import { IconUsers, IconCourses, IconMentor, IconCheck } from '../components/Icons';

export function EnrollmentsView({ enrollmentsData = {}, mentors = [], search = '' }) {
  const enrollmentsList = Array.isArray(enrollmentsData?.enrollments) ? enrollmentsData.enrollments : [];

  const [selectedMentorMap, setSelectedMentorMap] = useState({});

  const filtered = enrollmentsList.filter((item) =>
    item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    item.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
    item.courseTitle?.toLowerCase().includes(search.toLowerCase()) ||
    item.assignedMentorName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRev = filtered.reduce((sum, item) => {
    const rawPrice = String(item.coursePrice || item.price || '0').replace(/[^0-9]/g, '');
    return sum + (parseInt(rawPrice, 10) || 0);
  }, 0);

  const avgProg = filtered.length > 0
    ? (filtered.reduce((sum, item) => sum + (item.progressPercent || 0), 0) / filtered.length).toFixed(1) + '%'
    : '0%';

  const handleReassignMentor = (enrollmentId, newMentorName) => {
    alert(`Mentor assigned to ${newMentorName} for enrollment #${enrollmentId}!`);
  };

  return (
    <div>
      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Students Enrolled</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
            {filtered.length} Students
          </div>
          <div style={{ fontSize: '0.72rem', color: '#2563EB', marginTop: '2px' }}>Active Learners Across Platform</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Purchased Courses Total</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A6836', marginTop: '2px' }}>
            {filtered.length} Purchases
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>₹{totalRev.toLocaleString('en-IN')} Total Course Revenue</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Avg Course Completion</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            {avgProg} Completed
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>Student Engagement Metric</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Active Mentor Assignments</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#7C3AED', marginTop: '2px' }}>
            {mentors.length || 3} Mentors Assigned
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6D28D9', marginTop: '2px' }}>1-on-1 Guidance & Code Review</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconCourses style={{ color: 'var(--accent-primary)' }} />
              <span>Student Enrolled Courses, Progress & Mentor Assignments ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              Track course completion %, enrolled courses per student, and assign/reassign mentors.
            </p>
          </div>
        </div>

        {/* Student Purchased Courses & Progress Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Purchased Course & Fee</th>
                <th>Enrolled Date</th>
                <th>Course Completion %</th>
                <th>Assigned Mentor</th>
                <th>Change / Assign Mentor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No student course enrollments found matching search.
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
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{item.courseTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: '#0A6836', fontWeight: '700' }}>Paid: {item.coursePrice}</div>
                    </td>
                    <td>{item.enrolledDate}</td>
                    <td>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
                          <span style={{ color: item.progressPercent === 100 ? '#0A6836' : '#2563EB', fontWeight: '700' }}>
                            {item.progressPercent}% {item.status === 'Completed' ? '✓ Completed' : 'Done'}
                          </span>
                          <span style={{ color: '#64748B' }}>{item.completedModules}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
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
                    <td>
                      <div style={{ fontWeight: '700', color: '#7C3AED' }}>👨‍🏫 {item.assignedMentorName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.assignedMentorTitle || 'TCM One Mentor'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '150px' }}
                          value={selectedMentorMap[item.id] || item.assignedMentorName}
                          onChange={(e) => setSelectedMentorMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        >
                          <option value="Ayushman Sharma">Ayushman Sharma</option>
                          <option value="Neha Gupta">Neha Gupta</option>
                          <option value="Vikramaditya Roy">Vikramaditya Roy</option>
                          {mentors.map((m) => (
                            <option key={m.id || m._id} value={m.name}>
                              {m.name} ({m.mentorCategory || 'Mentor'})
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleReassignMentor(item.id, selectedMentorMap[item.id] || item.assignedMentorName)}
                        >
                          Assign
                        </button>
                      </div>
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

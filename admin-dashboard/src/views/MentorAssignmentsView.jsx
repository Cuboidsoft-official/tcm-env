import React, { useState } from 'react';
import { IconMentor } from '../components/Icons';

export function MentorAssignmentsView({ enrollmentsData = {}, mentors = [], search = '' }) {
  const [list, setList] = useState(enrollmentsData.enrollments || [
    {
      id: 'enr-101',
      studentName: 'Aman Verma',
      studentEmail: 'aman.verma@gmail.com',
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      courseTitle: 'Full Stack MERN Development Masterclass',
      assignedMentorName: 'Ayushman Sharma',
      assignedMentorTitle: 'Senior Full Stack Architect'
    },
    {
      id: 'enr-102',
      studentName: 'Priya Sahu',
      studentEmail: 'priya.sahu@yahoo.com',
      studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      courseTitle: 'Python & Machine Learning Zero to Hero',
      assignedMentorName: 'Neha Gupta',
      assignedMentorTitle: 'AI & ML Specialist'
    },
    {
      id: 'enr-103',
      studentName: 'Rohit Patel',
      studentEmail: 'rohit.patel@outlook.com',
      studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      courseTitle: 'React Native Mobile App Architecture',
      assignedMentorName: 'Ayushman Sharma',
      assignedMentorTitle: 'Senior Full Stack Architect'
    },
    {
      id: 'enr-104',
      studentName: 'Kavya Singh',
      studentEmail: 'kavya.singh@gmail.com',
      studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      courseTitle: 'Full Stack MERN Development Masterclass',
      assignedMentorName: 'Vikramaditya Roy',
      assignedMentorTitle: 'Cloud DevOps Architect'
    }
  ]);

  const [selectedMentorMap, setSelectedMentorMap] = useState({});

  const filtered = list.filter((item) =>
    item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    item.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
    item.courseTitle?.toLowerCase().includes(search.toLowerCase()) ||
    item.assignedMentorName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleReassignMentor = (enrollmentId, newMentorName) => {
    setList((prev) =>
      prev.map((e) => (e.id === enrollmentId ? { ...e, assignedMentorName: newMentorName } : e))
    );
    alert(`Mentor assigned to ${newMentorName} for student enrollment!`);
  };

  return (
    <div>
      {/* Overview Mentor Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Active Mentor Assignments</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#7C3AED', marginTop: '2px' }}>
            {filtered.length} Students Assigned
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6D28D9', marginTop: '2px' }}>Assigned for 1-on-1 Mentorship</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Available Mentors</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
            {mentors.length || 3} Approved Mentors
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1D4ED8', marginTop: '2px' }}>Ready for Student Allocation</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconMentor style={{ color: 'var(--accent-primary)' }} />
              <span>Mentor-to-Student Course Assignments ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              Assign or change the mentor guiding each student in their enrolled course.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Learner</th>
                <th>Enrolled Course</th>
                <th>Currently Assigned Mentor</th>
                <th>Change / Assign Mentor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No mentor assignment records found matching search.
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
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#7C3AED' }}>👨‍🏫 {item.assignedMentorName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.assignedMentorTitle || 'TCM Mentor'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '160px' }}
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

import React from 'react';
import { IconCourses } from '../components/Icons';

export function PurchasedCoursesView({ enrollmentsData = {}, search = '' }) {
  const list = enrollmentsData.enrollments || [
    {
      id: 'enr-101',
      studentName: 'Aman Verma',
      studentEmail: 'aman.verma@gmail.com',
      courseTitle: 'Full Stack MERN Development Masterclass',
      category: 'Full Stack Development',
      coursePrice: '₹4,999',
      enrolledDate: '14 May 2025',
      paymentStatus: 'Paid / Completed'
    },
    {
      id: 'enr-102',
      studentName: 'Priya Sahu',
      studentEmail: 'priya.sahu@yahoo.com',
      courseTitle: 'Python & Machine Learning Zero to Hero',
      category: 'AI & Data Science',
      coursePrice: '₹3,499',
      enrolledDate: '10 Apr 2025',
      paymentStatus: 'Paid / Completed'
    },
    {
      id: 'enr-103',
      studentName: 'Rohit Patel',
      studentEmail: 'rohit.patel@outlook.com',
      courseTitle: 'React Native Mobile App Architecture',
      category: 'Mobile App Development',
      coursePrice: '₹5,999',
      enrolledDate: '02 Jun 2025',
      paymentStatus: 'Paid / Completed'
    },
    {
      id: 'enr-104',
      studentName: 'Kavya Singh',
      studentEmail: 'kavya.singh@gmail.com',
      courseTitle: 'Full Stack MERN Development Masterclass',
      category: 'Full Stack Development',
      coursePrice: '₹4,999',
      enrolledDate: '18 May 2025',
      paymentStatus: 'Paid / Completed'
    }
  ];

  const filtered = list.filter((item) =>
    item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    item.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
    item.courseTitle?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Overview Revenue Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Course Purchases</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A6836', marginTop: '2px' }}>
            {filtered.length} Orders
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>Successful Course Sales</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Gross Revenue</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
            ₹19,496
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1D4ED8', marginTop: '2px' }}>Collected from Course Sales</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Average Course Price</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            ₹4,874
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>Average Order Value</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconCourses style={{ color: 'var(--accent-primary)' }} />
              <span>Purchased Courses & Transaction History ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              Track which student purchased which course, fee paid, and transaction date.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Buyer</th>
                <th>Purchased Course Title</th>
                <th>Course Category</th>
                <th>Amount Paid</th>
                <th>Purchase Date</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No course purchase records found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.studentName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.studentEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{item.courseTitle}</div>
                    </td>
                    <td>
                      <span className="skill-tag">{item.category || 'Tech'}</span>
                    </td>
                    <td>
                      <span style={{ color: '#0A6836', fontWeight: '700', fontSize: '0.85rem' }}>
                        {item.coursePrice}
                      </span>
                    </td>
                    <td>{item.enrolledDate}</td>
                    <td>
                      <span style={{ color: '#0A6836', fontSize: '0.75rem', fontWeight: '700', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>
                        ✓ {item.paymentStatus}
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

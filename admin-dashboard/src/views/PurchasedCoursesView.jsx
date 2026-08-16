import React from 'react';
import { IconCourses } from '../components/Icons';

export function PurchasedCoursesView({ enrollmentsData = {}, search = '' }) {
  // Pure dynamic list from backend enrollments/purchases (no dummy seed data)
  const list = Array.isArray(enrollmentsData?.enrollments) ? enrollmentsData.enrollments : [];

  const filtered = list.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(item.studentName || '').toLowerCase().includes(q) ||
      String(item.studentEmail || '').toLowerCase().includes(q) ||
      String(item.courseTitle || '').toLowerCase().includes(q) ||
      String(item.category || '').toLowerCase().includes(q)
    );
  });

  // Calculate dynamic revenue stats from real purchases
  const totalRevenueNum = filtered.reduce((sum, item) => {
    const rawPrice = String(item.coursePrice || item.price || '0').replace(/[^0-9]/g, '');
    return sum + (parseInt(rawPrice, 10) || 0);
  }, 0);

  const avgPriceNum = filtered.length > 0 ? Math.round(totalRevenueNum / filtered.length) : 0;

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
            ₹{totalRevenueNum.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1D4ED8', marginTop: '2px' }}>Collected from Real Course Sales</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Average Course Price</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            ₹{avgPriceNum.toLocaleString('en-IN')}
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
              Track real student course purchases, fees paid, and transaction dates.
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748B' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛒</div>
                    <div style={{ fontWeight: '700', color: '#334155', fontSize: '1rem' }}>No Course Purchases Yet</div>
                    <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                      All hardcoded dummy seeds have been reset. Real student course purchases will appear here live once students enroll.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.studentName || item.name || 'Student'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.studentEmail || item.email || ''}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{item.courseTitle || item.title}</div>
                    </td>
                    <td>
                      <span className="skill-tag">{item.category || 'Tech'}</span>
                    </td>
                    <td>
                      <span style={{ color: '#0A6836', fontWeight: '700', fontSize: '0.85rem' }}>
                        {item.coursePrice || item.price || '₹0'}
                      </span>
                    </td>
                    <td>{item.enrolledDate || item.date || 'Today'}</td>
                    <td>
                      <span style={{ color: '#0A6836', fontSize: '0.75rem', fontWeight: '700', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>
                        ✓ {item.paymentStatus || 'Paid / Completed'}
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

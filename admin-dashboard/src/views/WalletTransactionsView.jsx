import React, { useState } from 'react';
import { IconDashboard } from '../components/Icons';

export function WalletTransactionsView({ search = '' }) {
  const [transactions, setTransactions] = useState([]);

  const filtered = transactions.filter((t) =>
    t.id?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.toLowerCase().includes(search.toLowerCase()) ||
    t.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalVolumeNum = filtered.reduce((sum, item) => {
    const rawPrice = String(item.amount || '0').replace(/[^0-9]/g, '');
    return sum + (parseInt(rawPrice, 10) || 0);
  }, 0);

  const referralPaidNum = filtered.reduce((sum, item) => {
    const rawPrice = String(item.referralCashback || '0').replace(/[^0-9]/g, '');
    return sum + (parseInt(rawPrice, 10) || 0);
  }, 0);

  const partnerWithdrawalsNum = filtered.reduce((sum, item) => {
    if (String(item.type || '').toLowerCase().includes('partner') || String(item.type || '').toLowerCase().includes('lab')) {
      const rawPrice = String(item.amount || '0').replace(/[^0-9]/g, '');
      return sum + (parseInt(rawPrice, 10) || 0);
    }
    return sum;
  }, 0);

  return (
    <div>
      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #0A6836' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Transactions Volume</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
            ₹{totalVolumeNum.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0A6836', marginTop: '2px' }}>All Platform Payment Flow</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Referral Cashbacks Paid</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
            ₹{referralPaidNum.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1D4ED8', marginTop: '2px' }}>Student & Partner Rewards</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Partner Wallet Withdrawals</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            ₹{partnerWithdrawalsNum.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>Lab Revenue Payouts</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconDashboard style={{ color: 'var(--accent-primary)' }} />
              <span>Referrals, Wallet & Payment Transactions ({filtered.length})</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px' }}>
              Track real platform payment transactions, referral cashbacks, and payouts.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User / Recipient</th>
                <th>Transaction Type</th>
                <th>Referral Code</th>
                <th>Cashback / Reward</th>
                <th>Gross Amount</th>
                <th>Payment Gateway</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748B' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💳</div>
                    <div style={{ fontWeight: '700', color: '#334155', fontSize: '1rem' }}>No Wallet Transactions Yet</div>
                    <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                      Real wallet transactions, referral payouts, and payment flows will record here live.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="skill-tag">{item.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.user}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#2563EB', fontSize: '0.8rem' }}>{item.type}</span>
                    </td>
                    <td>{item.referralCode || 'N/A'}</td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: '700' }}>{item.referralCashback || '₹0'}</span>
                    </td>
                    <td>
                      <span style={{ color: '#0F172A', fontWeight: '700' }}>{item.amount}</span>
                    </td>
                    <td>{item.gateway || 'UPI / Card'}</td>
                    <td>{item.date}</td>
                    <td>
                      <span style={{
                        color: item.status === 'Success' ? '#0A6836' : '#D97706',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: item.status === 'Success' ? '#DCFCE7' : '#FEF3C7',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {item.status === 'Success' ? '✓ Success' : '⏳ Pending'}
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

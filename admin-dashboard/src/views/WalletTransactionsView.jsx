import React, { useState } from 'react';
import { IconDashboard } from '../components/Icons';

export function WalletTransactionsView({ search = '' }) {
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-90812',
      user: 'Aman Verma',
      email: 'aman.verma@gmail.com',
      type: 'Course Purchase',
      referralCode: 'TCM-AMAN10',
      referralCashback: '₹500',
      amount: '₹4,999',
      gateway: 'Razorpay UPI',
      date: '14 May 2025, 02:45 PM',
      status: 'Success'
    },
    {
      id: 'TXN-90813',
      user: 'Priya Sahu',
      email: 'priya.sahu@yahoo.com',
      type: 'Referral Bonus Payout',
      referralCode: 'TCM-PRIYA20',
      referralCashback: '₹350',
      amount: '₹350',
      gateway: 'Direct Wallet Transfer',
      date: '10 Apr 2025, 11:20 AM',
      status: 'Success'
    },
    {
      id: 'TXN-90814',
      user: 'Future Tech Institute',
      email: 'partner@futuretech.com',
      type: 'Lab Access Payout',
      referralCode: 'PARTNER-BILASPUR',
      referralCashback: '₹0',
      amount: '₹18,250',
      gateway: 'Bank NEFT Transfer',
      date: '02 Jun 2025, 04:15 PM',
      status: 'Success'
    },
    {
      id: 'TXN-90815',
      user: 'Rohit Patel',
      email: 'rohit.patel@outlook.com',
      type: 'Course Purchase',
      referralCode: 'N/A',
      referralCashback: '₹0',
      amount: '₹5,999',
      gateway: 'Razorpay Card',
      date: '05 Jun 2025, 06:30 PM',
      status: 'Pending'
    }
  ]);

  const filtered = transactions.filter((t) =>
    t.id?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.toLowerCase().includes(search.toLowerCase()) ||
    t.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #0A6836' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Total Transactions Volume</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
            ₹29,598
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0A6836', marginTop: '2px' }}>All Platform Payment Flow</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Referral Cashbacks Paid</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>
            ₹850
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1D4ED8', marginTop: '2px' }}>Student & Partner Rewards</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>Partner Wallet Withdrawals</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D97706', marginTop: '2px' }}>
            ₹18,250
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
              Manage student referral codes, cashback rewards, wallet balances, and payout transactions.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User / Partner</th>
                <th>Transaction Type</th>
                <th>Referral Code & Cashback</th>
                <th>Amount</th>
                <th>Gateway / Method</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    No transaction records found.
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.id}>
                    <td>
                      <span style={{ fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' }}>
                        {txn.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{txn.user}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{txn.email}</div>
                    </td>
                    <td>
                      <span className="skill-tag">{txn.type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{txn.referralCode}</div>
                      <div style={{ fontSize: '0.72rem', color: '#0A6836', fontWeight: '700' }}>Cashback: {txn.referralCashback}</div>
                    </td>
                    <td>
                      <span style={{ color: '#0A6836', fontWeight: '700', fontSize: '0.85rem' }}>
                        {txn.amount}
                      </span>
                    </td>
                    <td>{txn.gateway}</td>
                    <td>{txn.date}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: txn.status === 'Success' ? '#DCFCE7' : '#FEF3C7',
                          color: txn.status === 'Success' ? '#0A6836' : '#D97706',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        {txn.status}
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

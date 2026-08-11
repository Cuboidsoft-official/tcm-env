import React, { useState } from 'react';
import { IconUsers, IconCross, IconCheck } from '../components/Icons';

export function UsersView({ users, onUpdateUser, onDeleteUser, search }) {
  const [roleFilter, setRoleFilter] = useState(''); // '' | 'student' | 'mentor' | 'admin' | 'partner'
  const [editingUser, setEditingUser] = useState(null);

  // Edit form fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('student');
  const [editApproved, setEditApproved] = useState(true);
  const [editBadge, setEditBadge] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const handleStartEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'student');
    setEditApproved(user.isApproved !== false);
    setEditBadge(user.memberBadge || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser.id || editingUser._id, {
      name: editName,
      email: editEmail,
      role: editRole,
      isApproved: editApproved,
      memberBadge: editBadge
    });
    setEditingUser(null);
  };

  return (
    <div>
      <div className="glass-panel">
        <div className="section-header">
          <div>
            <div className="section-title">
              <IconUsers style={{ color: 'var(--accent-primary)' }} />
              <span>Registered Accounts Directory ({filteredUsers.length})</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Manage and edit all registered students, mentors, partners, and administrators.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px' }}>
            {['', 'student', 'mentor', 'partner', 'admin'].map((r) => (
              <button
                key={r}
                className={`btn ${roleFilter === r ? 'btn-primary' : ''}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                onClick={() => setRoleFilter(r)}
              >
                {r === '' ? 'All Users' : `${r}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <form onSubmit={handleSaveEdit} style={{ background: '#0F172A', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '1.75rem', width: '90%', maxWidth: '480px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                ✏️ Edit User Account ({editingUser.name})
              </h3>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Role</label>
                <select className="form-input" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  <option value="partner">Partner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Member Badge Title</label>
                <input type="text" className="form-input" value={editBadge} onChange={(e) => setEditBadge(e.target.value)} placeholder="e.g. Certified Mentor" />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Approval Status</label>
                <select className="form-input" value={editApproved ? 'true' : 'false'} onChange={(e) => setEditApproved(e.target.value === 'true')}>
                  <option value="true">Approved / Active</option>
                  <option value="false">Pending Approval</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Email</th>
                <th>Role</th>
                <th>Approval Status</th>
                <th>Member Badge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id || user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={user.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: 'white' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {user.id || user._id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-pill ${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className={`mentor-badge ${user.isApproved !== false ? 'approved' : 'pending'}`}>
                        {user.isApproved !== false ? 'Approved / Active' : 'Pending Review'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.memberBadge || 'TCM Member'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#3B82F6', color: 'white' }}
                          onClick={() => handleStartEdit(user)}
                        >
                          ✏️ Edit
                        </button>

                        {user.role !== 'admin' && (
                          <button
                            className="btn btn-reject"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => onDeleteUser(user.id || user._id)}
                            title="Delete User Account"
                          >
                            <IconCross /> Remove
                          </button>
                        )}
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

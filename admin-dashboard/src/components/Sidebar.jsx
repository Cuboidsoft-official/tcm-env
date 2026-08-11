import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IconDashboard,
  IconMentor,
  IconUsers,
  IconCourses,
  IconJobs,
  IconWebinars,
  IconLogout
} from './Icons';

export function Sidebar({ currentTab, setCurrentTab, pendingCount = 0 }) {
  const { adminUser, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: IconDashboard },
    { id: 'students', label: 'Students Analytics', icon: IconUsers },
    { id: 'purchases', label: 'Purchased Courses', icon: IconCourses },
    { id: 'mentor-assignments', label: 'Mentor Assignments', icon: IconMentor },
    { id: 'wallet', label: 'Referrals & Wallet', icon: IconDashboard },
    { id: 'tickets', label: 'P-Support Tickets', icon: IconMentor },
    { id: 'approvals', label: 'Mentor Approvals', icon: IconMentor, badge: pendingCount },
    { id: 'partners', label: 'Partner Accounts', icon: IconUsers },
    { id: 'users', label: 'Users Directory', icon: IconUsers },
    { id: 'courses', label: 'Courses & Prep', icon: IconCourses },
    { id: 'jobs', label: 'Jobs & Placement', icon: IconJobs },
    { id: 'webinars', label: 'Webinars & Live', icon: IconWebinars }
  ];

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-icon">TCM</div>
        <div>
          <div className="brand-title">Admin Console</div>
          <span className="brand-badge">PRO PORTAL</span>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <li key={item.id}>
              <button
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.id)}
              >
                <div className="nav-left">
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </div>
                {Boolean(item.badge) && item.badge > 0 && (
                  <span className="pending-counter">{item.badge}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {adminUser && (
        <div className="user-footer">
          <div className="user-info">
            <img
              src={adminUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={adminUser.name}
              className="user-avatar"
            />
            <div className="user-details">
              <h4>{adminUser.name || 'Administrator'}</h4>
              <p>{adminUser.email}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={logout} title="Logout">
            <IconLogout />
          </button>
        </div>
      )}
    </aside>
  );
}

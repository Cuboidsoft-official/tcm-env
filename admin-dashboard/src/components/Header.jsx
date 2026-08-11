import React from 'react';
import { IconSearch } from './Icons';

export function Header({ title, search, setSearch }) {
  return (
    <header className="top-header">
      <div className="header-title">
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <div className="search-box">
          <IconSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search mentors, users, courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}

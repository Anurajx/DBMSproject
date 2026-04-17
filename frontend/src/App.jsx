import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, Users, ArrowRightLeft, Loader2, BookOpen } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Books from './pages/Books';
import Members from './pages/Members';
import Transactions from './pages/Transactions';

const Sidebar = () => {
  const navItems = [
    { name: 'Books Catalog', path: '/', icon: <Book size={20} /> },
    { name: 'Members', path: '/members', icon: <Users size={20} /> },
    { name: 'Issues & Returns', path: '/transactions', icon: <ArrowRightLeft size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BookOpen size={32} className="logo-icon" />
        <h2>Nexus</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Toaster position="top-right" />
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Books />} />
            <Route path="/members" element={<Members />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

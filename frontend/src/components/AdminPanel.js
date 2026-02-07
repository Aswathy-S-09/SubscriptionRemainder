import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import SubscriptionManagement from './SubscriptionManagement';
import apiService from '../services/api';
import './AdminPanel.css';

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    apiService.removeToken();
    localStorage.removeItem('isAdmin');
    onLogout();
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Subscribely Admin Panel</h1>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <button
          className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button
          className={`nav-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          📋 Subscription Management
        </button>
      </nav>

      <main className="admin-main">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'subscriptions' && <SubscriptionManagement />}
      </main>
    </div>
  );
};

export default AdminPanel;


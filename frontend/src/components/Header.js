import React from 'react';
import { Calendar, Plus, List, User, LogOut } from 'lucide-react';

const Header = ({ activeTab, onTabChange, user, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>📺 Subscription Reminder</h1>
            <p>Never miss a renewal date again</p>
          </div>
          
          <nav className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onTabChange('dashboard')}
            >
              <Calendar size={20} />
              <span>Dashboard</span>
            </button>
            
            <button
              className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => onTabChange('add')}
            >
              <Plus size={20} />
              <span>Add New</span>
            </button>
            
            <button
              className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => onTabChange('list')}
            >
              <List size={20} />
              <span>All Subscriptions</span>
            </button>
          </nav>

          {/* User Info and Logout */}
          <div className="user-section">
            <div className="user-info">
              <User size={20} />
              <span className="user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.name || 'User'
                }
              </span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
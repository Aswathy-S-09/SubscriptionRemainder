import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load statistics');
      }
    } catch (error) {
      setError(error.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard statistics...</div>;
  }

  if (error) {
    return <div className="admin-error">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="admin-error">No data available</div>;
  }

  // Prepare chart data
  const dailyData = stats.trends.daily || [];
  const weeklyData = stats.trends.weekly || [];
  const monthlyData = stats.trends.monthly || [];

  // Find max value for scaling
  const maxDaily = Math.max(...dailyData.map(d => d.count), 1);
  const maxWeekly = Math.max(...weeklyData.map(d => d.count), 1);
  const maxMonthly = Math.max(...monthlyData.map(d => d.count), 1);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Subscriptions</h3>
            <p className="stat-value">{stats.activeSubscriptions}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>Expired Subscriptions</h3>
            <p className="stat-value">{stats.expiredSubscriptions}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>Renewal Reminders</h3>
            <p className="stat-value">{stats.renewalReminders}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <h3>Email Alerts</h3>
            <p className="stat-value">{stats.emailAlerts}</p>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h2>Daily Subscription Trends (Last 30 Days)</h2>
          <div className="chart-container">
            {dailyData.length > 0 ? (
              <div className="bar-chart">
                {dailyData.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.count / maxDaily) * 100}%` }}
                      title={`${item._id}: ${item.count} subscriptions`}
                    ></div>
                    <span className="bar-label">{item._id.split('-')[2]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No data available for the last 30 days</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h2>Weekly Subscription Trends (Last 12 Weeks)</h2>
          <div className="chart-container">
            {weeklyData.length > 0 ? (
              <div className="bar-chart">
                {weeklyData.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.count / maxWeekly) * 100}%` }}
                      title={`Week ${item._id}: ${item.count} subscriptions`}
                    ></div>
                    <span className="bar-label">W{item._id.split('-W')[1]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No data available for the last 12 weeks</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h2>Monthly Subscription Trends (Last 12 Months)</h2>
          <div className="chart-container">
            {monthlyData.length > 0 ? (
              <div className="bar-chart">
                {monthlyData.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.count / maxMonthly) * 100}%` }}
                      title={`${item._id}: ${item.count} subscriptions`}
                    ></div>
                    <span className="bar-label">{item._id.split('-')[1]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No data available for the last 12 months</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


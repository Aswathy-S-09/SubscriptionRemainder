import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './Auth.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await apiService.healthCheck();
      if (response.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Backend connection check failed:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.adminLogin(formData);
      if (response.success) {
        onLoginSuccess(response.admin);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      let errorMessage = error.message || 'Login failed. Please try again.';
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Unable to connect')) {
        errorMessage = 'Cannot connect to backend server. Please ensure:\n1. Backend server is running on port 5000\n2. MongoDB is connected\n3. Check browser console for details';
      } else if (error.message && error.message.includes('401')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message && error.message.includes('403')) {
        errorMessage = 'Access denied. Admin privileges required.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Login</h2>
        <p className="auth-subtitle">Access the admin dashboard</p>
        
        {/* Connection Status Indicator */}
        {connectionStatus === 'checking' && (
          <div style={{ 
            padding: '10px', 
            background: '#fef3c7', 
            borderRadius: '6px', 
            marginBottom: '15px',
            fontSize: '0.9rem'
          }}>
            🔍 Checking backend connection...
          </div>
        )}
        {connectionStatus === 'connected' && (
          <div style={{ 
            padding: '10px', 
            background: '#d1fae5', 
            borderRadius: '6px', 
            marginBottom: '15px',
            fontSize: '0.9rem',
            color: '#065f46'
          }}>
            ✅ Backend connected
          </div>
        )}
        {connectionStatus === 'error' && (
          <div style={{ 
            padding: '10px', 
            background: '#fee2e2', 
            borderRadius: '6px', 
            marginBottom: '15px',
            fontSize: '0.9rem',
            color: '#991b1b'
          }}>
            ⚠️ Cannot connect to backend. Please ensure the server is running on port 5000.
            <button 
              onClick={checkConnection}
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {error && (
          <div className="error-message" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="subscriblyinfo@gmail.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;


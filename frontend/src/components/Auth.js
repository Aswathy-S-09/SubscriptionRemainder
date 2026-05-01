import React, { useState, useEffect } from 'react';
import Login from './Login';
import Signup from './Signup';
import apiService from '../services/api';
import './Auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [backendConnected, setBackendConnected] = useState(null);
  const [databaseConnected, setDatabaseConnected] = useState(null);

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await apiService.healthCheck();
      setBackendConnected(response.success);
      setDatabaseConnected(response.database?.connected ?? true);
      return response.success;
    } catch (error) {
      setBackendConnected(false);
      setDatabaseConnected(false);
      return false;
    }
  };

  const handleLogin = async (loginData) => {
    // Check backend connection first
    if (backendConnected === false) {
      const confirmed = window.confirm(
        'Cannot connect to backend server.\n\n' +
        'Please ensure:\n' +
        '1. Backend server is running on port 5000\n' +
        '2. MongoDB is connected\n' +
        '3. Check terminal for errors\n\n' +
        'Would you like to retry the connection?'
      );
      if (confirmed) {
        const isConnected = await checkBackendConnection();
        if (!isConnected) {
          return;
        }
      } else {
        return;
      }
    }


    console.log('Login attempt:', loginData);

    // Check if admin credentials
    const isAdminCredentials = loginData.email.toLowerCase() === 'subscriblyinfo@gmail.com';

    try {
      if (isAdminCredentials) {
        // Try admin login only
        try {
          const response = await apiService.adminLogin({
            email: loginData.email,
            password: loginData.password
          });

          if (response.success) {
            if (onAuthSuccess) {
              onAuthSuccess({
                type: 'admin',
                admin: response.admin
              });
            }
            return;
          } else {
            alert(response.message || 'Admin login failed');
            return;
          }
        } catch (adminError) {
          console.error('Admin login error:', adminError);

          // Provide more helpful error messages
          let errorMsg = 'Admin login failed. ';
          if (adminError.message && adminError.message.includes('Unable to connect')) {
            errorMsg += 'Backend server is not running. Please start the backend server on port 5000.';
          } else if (adminError.message && adminError.message.includes('401')) {
            errorMsg += 'Invalid email or password.';
          } else {
            errorMsg += adminError.message || 'Please check your credentials.';
          }

          alert(errorMsg);
          return;
        }
      }

      // Regular user login
      const response = await apiService.login({
        email: loginData.email,
        password: loginData.password
      });

      if (response.success) {
        if (onAuthSuccess) {
          onAuthSuccess({
            type: 'login',
            user: {
              ...response.user,
              name: response.user.firstName && response.user.lastName
                ? `${response.user.firstName} ${response.user.lastName}`
                : response.user.name || response.user.email
            }
          });
        }
      } else {
        alert(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Provide more helpful error messages
      let errorMsg = 'An error occurred during login. ';
      if (error.message && error.message.includes('Unable to connect')) {
        errorMsg = 'Cannot connect to backend server.\n\n' +
          'Please ensure the backend server is running:\n' +
          '1. Open a terminal\n' +
          '2. Navigate to: subscribley/fullstack/backend\n' +
          '3. Run: npm start\n' +
          '4. Wait for "Server running on port 5000" message';
      } else {
        errorMsg += error.message || 'Please try again.';
      }

      alert(errorMsg);
    }
  };

  const handleSignup = async (signupData) => {

    console.log('Signup attempt:', signupData);

    try {
      const response = await apiService.register({
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        password: signupData.password
      });

      if (response.success) {
        if (onAuthSuccess) {
          onAuthSuccess({
            type: 'signup',
            user: {
              ...response.user,
              name: response.user.firstName && response.user.lastName
                ? `${response.user.firstName} ${response.user.lastName}`
                : response.user.name || response.user.email
            }
          });
        }
      } else {
        alert(response.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message || 'An error occurred during signup. Please try again.');
    }
  };

  const handleGoogleCredential = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse || {};
      if (!credential) {
        alert('Google sign-in failed.');
        return;
      }

      // Decode JWT credential (header.payload.signature)
      let payload;
      try {
        const parts = credential.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      } catch (decodeError) {
        console.error('Error decoding Google credential:', decodeError);
        alert('Could not process Google login data. Please try again.');
        return;
      }

      const response = await apiService.googleAuth({
        email: payload.email,
        googleId: payload.sub,
        firstName: payload.given_name || payload.name?.split(' ')[0] || '',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || ''
      });

      if (response.success) {
        if (onAuthSuccess) {
          onAuthSuccess({
            type: 'login',
            user: {
              ...response.user,
              name: response.user.firstName && response.user.lastName
                ? `${response.user.firstName} ${response.user.lastName}`
                : response.user.name || response.user.email
            }
          });
        }
      } else {
        alert(response.message || 'Google sign-in failed');
      }
    } catch (err) {
      console.error('Google credential handling error:', err);
      alert('An error occurred with Google sign-in. Please try again.');
    }
  };

  const switchToSignup = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div className="auth-container">
      {/* Backend Connection Status */}
      {backendConnected === false && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fee2e2',
          color: '#991b1b',
          padding: window.innerWidth <= 480 ? '12px 15px' : '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: window.innerWidth <= 480 ? '95%' : window.innerWidth <= 768 ? '90%' : '500px',
          width: window.innerWidth <= 768 ? '95%' : 'auto',
          textAlign: 'center',
          margin: window.innerWidth <= 768 ? '0 10px' : '0'
        }}>
          <strong style={{ fontSize: window.innerWidth <= 480 ? '0.9rem' : '1rem', display: 'block', marginBottom: '8px' }}>
            ⚠️ Backend Server Not Connected
          </strong>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.9rem',
            lineHeight: '1.4'
          }}>
            Please start the backend server to continue.
            <button
              onClick={checkBackendConnection}
              style={{
                marginLeft: window.innerWidth <= 480 ? '8px' : '10px',
                marginTop: window.innerWidth <= 480 ? '8px' : '0',
                padding: window.innerWidth <= 480 ? '6px 12px' : '4px 12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.85rem',
                display: window.innerWidth <= 480 ? 'block' : 'inline-block',
                width: window.innerWidth <= 480 ? '100%' : 'auto'
              }}
            >
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Database Connection Status */}
      {backendConnected === true && databaseConnected === false && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fef3c7',
          color: '#92400e',
          padding: window.innerWidth <= 480 ? '12px 15px' : '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: window.innerWidth <= 480 ? '95%' : window.innerWidth <= 768 ? '90%' : '500px',
          width: window.innerWidth <= 768 ? '95%' : 'auto',
          textAlign: 'center',
          margin: window.innerWidth <= 768 ? '0 10px' : '0'
        }}>
          <strong style={{ fontSize: window.innerWidth <= 480 ? '0.9rem' : '1rem', display: 'block', marginBottom: '8px' }}>
            ⚠️ Database Not Connected
          </strong>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.9rem',
            lineHeight: '1.4'
          }}>
            Backend is running but MongoDB is not connected. Please start MongoDB.
            <button
              onClick={checkBackendConnection}
              style={{
                marginLeft: window.innerWidth <= 480 ? '8px' : '10px',
                marginTop: window.innerWidth <= 480 ? '8px' : '0',
                padding: window.innerWidth <= 480 ? '6px 12px' : '4px 12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.85rem',
                display: window.innerWidth <= 480 ? 'block' : 'inline-block',
                width: window.innerWidth <= 480 ? '100%' : 'auto'
              }}
            >
              Retry
            </button>
          </p>
        </div>
      )}

      <div className={`auth-card ${isLogin ? 'login' : 'signup'}`}>
        {isLogin ? (
          <Login
            onSwitchToSignup={switchToSignup}
            onLogin={handleLogin}
            onGoogleCredential={handleGoogleCredential}
          />
        ) : (
          <Signup
            onSwitchToLogin={switchToLogin}
            onSignup={handleSignup}
            onGoogleCredential={handleGoogleCredential}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;



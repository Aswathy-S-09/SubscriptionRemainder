import React, { useEffect, useRef, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import './Auth.css';

const Login = ({ onSwitchToSignup, onLogin, onGoogleCredential }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [clientIdMissing, setClientIdMissing] = useState(false);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes('your_google')) {
      setClientIdMissing(true);
    }
    const renderGoogle = () => {
      if (!window.google || !clientId || !googleBtnRef.current) {
        setGoogleLoading(false);
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onGoogleCredential,
          auto_select: false,
          ux_mode: 'popup'
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular'
        });
        setGoogleLoading(false);
      } catch (err) {
        console.error('Failed to init Google button:', err);
        setGoogleLoading(false);
      }
    };

    if (window.google) {
      renderGoogle();
    } else {
      const onLoad = () => renderGoogle();
      window.addEventListener('load', onLoad);
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', renderGoogle, { once: true });
      }
      return () => {
        window.removeEventListener('load', onLoad);
        if (script) script.removeEventListener('load', renderGoogle);
      };
    }
  }, [onGoogleCredential]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (onLogin) {
        onLogin(formData);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to manage your subscriptions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
            <button type="button" className="forgot-password">
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Social Login */}
        <div className="social-login">
          {clientIdMissing ? (
            <button
              type="button"
              className="btn btn-social btn-google"
              onClick={() => {
                alert(
                  'Google Authentication setup Required.\n\n' +
                  'Please add a valid REACT_APP_GOOGLE_CLIENT_ID to your frontend .env file.\n' +
                  'See GOOGLE_AUTH_SETUP.md for instructions.'
                );
              }}
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              Continue with Google
            </button>
          ) : (
            <>
              {googleLoading && (
                <button type="button" className="btn btn-social btn-google" disabled>
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
                  Loading Google...
                </button>
              )}
              <div ref={googleBtnRef} style={{ display: googleLoading ? 'none' : 'inline-block' }} />
            </>
          )}
        </div>

        {/* Switch to Signup */}
        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="switch-link"
              onClick={onSwitchToSignup}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddSubscription from './components/AddSubscription';
import SubscriptionList from './components/SubscriptionList';
import Auth from './components/Auth';
import Landing from './components/Landing';
import AdminPanel from './components/AdminPanel';
import apiService from './services/api';
import './App.css';
import Chatbot from './components/Chatbot';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Check if user is admin on mount
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Load subscriptions from backend on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscriptions();
    }
  }, [isAuthenticated, user]);

  const loadSubscriptions = async () => {
    try {
      const response = await apiService.getSubscriptions();
      if (response.success) {
        setSubscriptions(response.data);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      // Don't show alert for authentication errors when not logged in
      if (error.message !== 'Access denied. No token provided.') {
        alert('Failed to load subscriptions: ' + error.message);
      }
    }
  };

  const addSubscription = async (subscription) => {
    try {
      const response = await apiService.createSubscription(subscription);
      if (response.success) {
        setSubscriptions([...subscriptions, response.data]);
        alert('Subscription added successfully!');
      } else {
        alert(response.message || 'Failed to add subscription');
      }
    } catch (error) {
      console.error('Failed to add subscription:', error);
      alert(error.message || 'Failed to add subscription');
    }
  };

  const deleteSubscription = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        const response = await apiService.deleteSubscription(id);
        if (response.success) {
          setSubscriptions(subscriptions.filter(sub => sub._id !== id));
          alert('Subscription deleted successfully!');
        } else {
          alert(response.message || 'Failed to delete subscription');
        }
      } catch (error) {
        console.error('Failed to delete subscription:', error);
        alert(error.message || 'Failed to delete subscription');
      }
    }
  };

  const updateSubscription = async (id, updatedSubscription) => {
    try {
      const response = await apiService.updateSubscription(id, updatedSubscription);
      if (response.success) {
    setSubscriptions(subscriptions.map(sub => 
          sub._id === id ? response.data : sub
        ));
        alert('Subscription updated successfully!');
      } else {
        alert(response.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert(error.message || 'Failed to update subscription');
    }
  };

  const handleAuthSuccess = (authResult) => {
    // Check if this is an admin login
    if (authResult.type === 'admin' && authResult.admin) {
      setAdmin(authResult.admin);
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      console.log('Admin authentication successful:', authResult);
      return;
    }
    
    // Regular user login
    setUser(authResult.user);
    setIsAuthenticated(true);
    console.log('Authentication successful:', authResult);
  };

  const handleLogout = async () => {
    try {
      if (isAdmin) {
        apiService.removeToken();
        localStorage.removeItem('isAdmin');
        setIsAdmin(false);
        setAdmin(null);
      } else {
        await apiService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setSubscriptions([]);
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAdminLogout = () => {
    apiService.removeToken();
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    setAdmin(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard subscriptions={subscriptions} />;
      case 'add':
        return <AddSubscription onAdd={addSubscription} />;
      case 'list':
        return (
          <SubscriptionList 
            subscriptions={subscriptions} 
            onDelete={deleteSubscription}
            onUpdate={updateSubscription}
          />
        );
      default:
        return <Dashboard subscriptions={subscriptions} />;
    }
  };

  // Show admin panel if admin is logged in
  if (isAdmin) {
    return <AdminPanel onLogout={handleAdminLogout} />;
  }

  // Show landing (About + Services + Auth) if not logged in
  if (!isAuthenticated && !isAdmin) {
    return <Landing onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="App">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="container">
          {renderContent()}
        </div>
      </main>
      <Chatbot />
    </div>
  );
}

export default App; 
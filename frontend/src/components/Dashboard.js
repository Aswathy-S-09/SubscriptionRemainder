import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import apiService from '../services/api';

const Dashboard = ({ subscriptions }) => {
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];

  const getSubscriptionStatus = (subscription) => {
    const daysUntilRenewal = differenceInDays(new Date(subscription.renewalDate), new Date());
    
    if (daysUntilRenewal < 0) {
      return { status: 'expired', label: 'Expired', days: Math.abs(daysUntilRenewal) };
    } else if (daysUntilRenewal <= 7) {
      return { status: 'expiring-soon', label: 'Expiring Soon', days: daysUntilRenewal };
    } else {
      return { status: 'active', label: 'Active', days: daysUntilRenewal };
    }
  };

  const getTotalMonthlyCost = () => {
    return safeSubscriptions.reduce((total, sub) => total + parseFloat(sub.price), 0);
  };

  const getExpiringSoon = () => {
    return safeSubscriptions.filter(sub => {
      const daysUntilRenewal = differenceInDays(new Date(sub.renewalDate), new Date());
      return daysUntilRenewal <= 7 && daysUntilRenewal >= 0;
    });
  };

  const getExpired = () => {
    return safeSubscriptions.filter(sub => {
      const daysUntilRenewal = differenceInDays(new Date(sub.renewalDate), new Date());
      return daysUntilRenewal < 0;
    });
  };

  const getExpiringSoonCount = () => getExpiringSoon().length;
  const getExpiredCount = () => getExpired().length;

  const emailAlerts = async () => {
    const expired = getExpired();
    const expiring = getExpiringSoon();

    if (expired.length === 0 && expiring.length === 0) {
      alert('No important alerts to email.');
      return;
    }

    const lines = [];
    if (expired.length > 0) {
      lines.push('Expired subscriptions:');
      expired.forEach(sub => {
        lines.push(`- ${sub.serviceName} (expired on ${format(new Date(sub.renewalDate), 'MMM dd, yyyy')})`);
      });
      lines.push('');
    }
    if (expiring.length > 0) {
      lines.push('Subscriptions expiring soon:');
      expiring.forEach(sub => {
        const days = differenceInDays(new Date(sub.renewalDate), new Date());
        lines.push(`- ${sub.serviceName} (${days} day(s) left, renew by ${format(new Date(sub.renewalDate), 'MMM dd, yyyy')})`);
      });
    }

    const subject = 'Important Subscription Alerts';
    const message = `Hello,\n\nHere are your important subscription alerts:\n\n${lines.join('\n')}\n\n— Subscribely`;

    try {
      const res = await apiService.sendAlertEmail({ subject, message });
      if (res.success) {
        alert('Alert email sent to your registered email.');
      } else {
        alert(res.message || 'Failed to send alert email.');
      }
    } catch (err) {
      console.error('Failed to send alert email:', err);
      alert(err.message || 'Failed to send alert email.');
    }
  };

  if (safeSubscriptions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📺</div>
        <h2>No subscriptions yet</h2>
        <p>Add your first streaming service subscription to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center mb-4">Subscription Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-3 mb-4">
        <div className="card text-center">
          <h3>Total Subscriptions</h3>
          <div className="days-remaining">{safeSubscriptions.length}</div>
          <p>Active services</p>
        </div>
        
        <div className="card text-center">
          <h3>Monthly Cost</h3>
          <div className="price-tag">₹{getTotalMonthlyCost().toFixed(2)}</div>
          <p>Total per month</p>
        </div>
        
        <div className="card text-center">
          <h3>Expiring Soon</h3>
          <div className="days-remaining expiring-soon">{getExpiringSoonCount()}</div>
          <p>Within 7 days</p>
        </div>
      </div>

      {/* Alerts */}
      {(getExpiredCount() > 0 || getExpiringSoonCount() > 0) && (
        <div className="card mb-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>⚠️ Important Alerts</h3>
            <button className="btn btn-primary" onClick={emailAlerts}>Email me alerts</button>
          </div>
          {getExpiredCount() > 0 && (
            <div className="alert alert-danger">
              <AlertTriangle size={20} />
              <span>{getExpiredCount()} subscription(s) have expired</span>
            </div>
          )}
          {getExpiringSoonCount() > 0 && (
            <div className="alert alert-warning">
              <Clock size={20} />
              <span>{getExpiringSoonCount()} subscription(s) expiring soon</span>
            </div>
          )}
        </div>
      )}

      {/* Subscription Cards */}
      <div className="grid grid-2">
        {safeSubscriptions.map(subscription => {
          const status = getSubscriptionStatus(subscription);
          const daysUntilRenewal = differenceInDays(new Date(subscription.renewalDate), new Date());
          
          return (
            <div 
              key={subscription._id || subscription.id} 
              className={`card subscription-card ${status.status}`}
              style={{ '--service-color': subscription.serviceColor }}
            >
              <div className="subscription-header">
                <img 
                  src={subscription.serviceLogo} 
                  alt={subscription.serviceName}
                  className="service-logo"
                />
                <div className="subscription-info">
                  <h3>{subscription.serviceName}</h3>
                  <p className="subscription-plan">{subscription.plan}</p>
                </div>
                <span className={`status-badge ${status.status}`}>
                  {status.label}
                </span>
              </div>
              
              <div className="subscription-details">
                <div className="detail-row">
                  <span>Price:</span>
                  <span className="price-tag">₹{subscription.price}/month</span>
                </div>
                
                <div className="detail-row">
                  <span>Renewal Date:</span>
                  <span>{format(new Date(subscription.renewalDate), 'MMM dd, yyyy')}</span>
                </div>
                
                <div className="detail-row">
                  <span>Days Remaining:</span>
                  <span className={`days-remaining ${status.status}`}>
                    {daysUntilRenewal < 0 ? `${Math.abs(daysUntilRenewal)} days overdue` : `${daysUntilRenewal} days`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard; 
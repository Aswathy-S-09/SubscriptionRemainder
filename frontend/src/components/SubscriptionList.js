import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

const SubscriptionList = ({ subscriptions, onDelete, onUpdate }) => {
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPrices, setShowPrices] = useState(true);

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

  const handleEdit = (subscription) => {
    setEditingId(subscription.id);
    setEditForm({
      serviceName: subscription.serviceName,
      plan: subscription.plan,
      price: subscription.price,
      renewalDate: subscription.renewalDate
    });
  };

  const handleSave = () => {
    if (editForm.serviceName && editForm.price && editForm.renewalDate) {
      onUpdate(editingId, {
        ...safeSubscriptions.find(sub => sub.id === editingId),
        ...editForm
      });
      setEditingId(null);
      setEditForm({});
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id) => {
    onDelete(id);
  };

  if (safeSubscriptions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📺</div>
        <h2>No subscriptions found</h2>
        <p>Add your first streaming service subscription to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="list-header">
        <h1 className="text-center mb-4">All Subscriptions</h1>
        
        <div className="list-controls">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPrices(!showPrices)}
          >
            {showPrices ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showPrices ? 'Hide' : 'Show'} Prices</span>
          </button>
        </div>
      </div>

      <div className="subscriptions-table">
        {safeSubscriptions.map(subscription => {
          const status = getSubscriptionStatus(subscription);
          const daysUntilRenewal = differenceInDays(new Date(subscription.renewalDate), new Date());
          
          if (editingId === subscription._id) {
            return (
              <div key={subscription._id} className="card subscription-card editing">
                <div className="edit-form">
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Service Name</label>
                      <input
                        type="text"
                        value={editForm.serviceName}
                        onChange={(e) => setEditForm({...editForm, serviceName: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Plan</label>
                      <input
                        type="text"
                        value={editForm.plan}
                        onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Price (₹)</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                        className="form-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Renewal Date</label>
                      <input
                        type="date"
                        value={editForm.renewalDate}
                        onChange={(e) => setEditForm({...editForm, renewalDate: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="edit-actions">
                    <button className="btn btn-primary" onClick={handleSave}>
                      Save
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={subscription._id} 
              className={`card subscription-card ${status.status}`}
              style={{ '--service-color': subscription.serviceColor }}
            >
              <div className="subscription-row">
                <div className="subscription-info">
                  <img 
                    src={subscription.serviceLogo} 
                    alt={subscription.serviceName}
                    className="service-logo"
                  />
                  <div className="info-details">
                    <h3>{subscription.serviceName}</h3>
                    <p className="subscription-plan">{subscription.plan}</p>
                    <span className={`status-badge ${status.status}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                
                <div className="subscription-details">
                  {showPrices && (
                    <div className="price-info">
                      <span className="price-tag">₹{subscription.price}/month</span>
                    </div>
                  )}
                  
                  <div className="date-info">
                    <div className="renewal-date">
                      <strong>Renewal:</strong> {format(new Date(subscription.renewalDate), 'MMM dd, yyyy')}
                    </div>
                    <div className={`days-remaining ${status.status}`}>
                      {daysUntilRenewal < 0 ? `${Math.abs(daysUntilRenewal)} days overdue` : `${daysUntilRenewal} days remaining`}
                    </div>
                  </div>
                </div>
                
                <div className="subscription-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(subscription)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  {subscription.serviceUrl && (
                    <a
                      className="btn btn-primary"
                      href={subscription.serviceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${subscription.serviceName}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDelete(subscription._id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionList; 
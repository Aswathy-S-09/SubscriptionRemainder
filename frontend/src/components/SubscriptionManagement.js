import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './SubscriptionManagement.css';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    serviceName: '',
    plan: '',
    planDuration: 1,
    price: 0,
    totalAmount: 0,
    renewalDate: '',
    serviceLogo: '',
    serviceColor: '#667eea',
    serviceUrl: '',
    status: 'active'
  });

  useEffect(() => {
    loadSubscriptions();
    loadPlans();
    loadUsers();
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        ...(statusFilter && { status: statusFilter }),
        sortBy,
        sortOrder
      };
      
      const response = await apiService.getAdminSubscriptions(params);
      if (response.success) {
        setSubscriptions(response.data.subscriptions);
        setTotalPages(response.data.pagination.pages);
      } else {
        setError(response.message || 'Failed to load subscriptions');
      }
    } catch (error) {
      setError(error.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await apiService.getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getAdminUsers({ limit: 1000 });
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      userId: '',
      serviceName: '',
      plan: '',
      planDuration: 1,
      price: 0,
      totalAmount: 0,
      renewalDate: '',
      serviceLogo: '',
      serviceColor: '#667eea',
      serviceUrl: '',
      status: 'active'
    });
    setShowAddModal(true);
  };

  const handleEdit = (subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      userId: subscription.user._id || subscription.user,
      serviceName: subscription.serviceName,
      plan: subscription.plan,
      planDuration: subscription.planDuration,
      price: subscription.price,
      totalAmount: subscription.totalAmount,
      renewalDate: new Date(subscription.renewalDate).toISOString().split('T')[0],
      serviceLogo: subscription.serviceLogo || '',
      serviceColor: subscription.serviceColor || '#667eea',
      serviceUrl: subscription.serviceUrl || '',
      status: subscription.status
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      const response = await apiService.deleteAdminSubscription(id);
      if (response.success) {
        alert('Subscription deleted successfully');
        loadSubscriptions();
        loadPlans();
      } else {
        alert(response.message || 'Failed to delete subscription');
      }
    } catch (error) {
      alert(error.message || 'Failed to delete subscription');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const subscriptionData = {
        ...formData,
        planDuration: parseInt(formData.planDuration),
        price: parseFloat(formData.price),
        totalAmount: parseFloat(formData.totalAmount)
      };

      let response;
      if (showEditModal) {
        response = await apiService.updateAdminSubscription(selectedSubscription._id, subscriptionData);
      } else {
        response = await apiService.createAdminSubscription(subscriptionData);
      }

      if (response.success) {
        alert(`Subscription ${showEditModal ? 'updated' : 'created'} successfully`);
        setShowAddModal(false);
        setShowEditModal(false);
        loadSubscriptions();
        loadPlans();
      } else {
        alert(response.message || `Failed to ${showEditModal ? 'update' : 'create'} subscription`);
      }
    } catch (error) {
      alert(error.message || `Failed to ${showEditModal ? 'update' : 'create'} subscription`);
    }
  };

  if (loading && subscriptions.length === 0) {
    return <div className="admin-loading">Loading subscriptions...</div>;
  }

  return (
    <div className="subscription-management">
      <div className="header-section">
        <h1>Subscription Management</h1>
        <button className="btn-add" onClick={handleAdd}>+ Add Subscription</button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by service name or plan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt">Sort by: Date Created</option>
            <option value="serviceName">Sort by: Service Name</option>
            <option value="renewalDate">Sort by: Renewal Date</option>
            <option value="price">Sort by: Price</option>
          </select>

          <button
            onClick={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              setPage(1);
            }}
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="subscriptions-table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Plan</th>
              <th>User</th>
              <th>Price</th>
              <th>Renewal Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.serviceName}</td>
                <td>{sub.plan}</td>
                <td>
                  {sub.user?.firstName} {sub.user?.lastName}
                  <br />
                  <small>{sub.user?.email}</small>
                </td>
                <td>₹{sub.price}/mo</td>
                <td>{new Date(sub.renewalDate).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${sub.status}`}>
                    {sub.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEdit(sub)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(sub._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {subscriptions.length === 0 && !loading && (
        <div className="no-data">No subscriptions found</div>
      )}

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      <div className="plans-section">
        <h2>Subscription Plans Overview</h2>
        <div className="plans-grid">
          {plans.map((plan, index) => (
            <div key={index} className="plan-card">
              <h3>{plan.serviceName}</h3>
              <p className="plan-name">{plan.plan}</p>
              <div className="plan-stats">
                <div className="stat-item">
                  <span className="stat-label">Subscribers:</span>
                  <span className="stat-value">{plan.subscriberCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Users:</span>
                  <span className="stat-value">{plan.userCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Price:</span>
                  <span className="stat-value">₹{plan.avgPrice.toFixed(2)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Revenue:</span>
                  <span className="stat-value">₹{plan.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{showEditModal ? 'Edit' : 'Add'} Subscription</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>User *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  disabled={showEditModal}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Plan *</label>
                <input
                  type="text"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Plan Duration (months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.planDuration}
                    onChange={(e) => setFormData({ ...formData, planDuration: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Price (₹/month) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Total Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Renewal Date *</label>
                <input
                  type="date"
                  value={formData.renewalDate}
                  onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Service Logo URL</label>
                <input
                  type="url"
                  value={formData.serviceLogo}
                  onChange={(e) => setFormData({ ...formData, serviceLogo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Service Color</label>
                <input
                  type="color"
                  value={formData.serviceColor}
                  onChange={(e) => setFormData({ ...formData, serviceColor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Service URL</label>
                <input
                  type="url"
                  value={formData.serviceUrl}
                  onChange={(e) => setFormData({ ...formData, serviceUrl: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {showEditModal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;


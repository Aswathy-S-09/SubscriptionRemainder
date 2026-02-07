import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ subject: '', message: '' });

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm, sortBy, sortOrder, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        ...(filterStatus && { status: filterStatus })
      };
      
      const response = await apiService.getAdminUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (error) {
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const response = await apiService.updateUserStatus(userId, !currentStatus);
      if (response.success) {
        loadUsers();
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        alert(response.message || 'Failed to update user status');
      }
    } catch (error) {
      alert(error.message || 'Failed to update user status');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.subject || !notificationData.message) {
      alert('Please fill in both subject and message');
      return;
    }

    try {
      const response = await apiService.sendUserNotification(
        selectedUser._id,
        notificationData.subject,
        notificationData.message
      );
      if (response.success) {
        alert('Notification sent successfully');
        setShowNotificationModal(false);
        setNotificationData({ subject: '', message: '' });
        setSelectedUser(null);
      } else {
        alert(response.message || 'Failed to send notification');
      }
    } catch (error) {
      alert(error.message || 'Failed to send notification');
    }
  };

  const openNotificationModal = (user) => {
    setSelectedUser(user);
    setShowNotificationModal(true);
  };

  if (loading && users.length === 0) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <h1>User Management</h1>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt">Sort by: Registration Date</option>
            <option value="firstName">Sort by: First Name</option>
            <option value="lastName">Sort by: Last Name</option>
            <option value="email">Sort by: Email</option>
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

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subscriptions</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.subscriptionCount || 0}</td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-toggle"
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn-notify"
                      onClick={() => openNotificationModal(user)}
                    >
                      Send Email
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="no-data">No users found</div>
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

      {showNotificationModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Send Notification to {selectedUser.firstName} {selectedUser.lastName}</h2>
            <p className="modal-email">Email: {selectedUser.email}</p>
            
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={notificationData.subject}
                onChange={(e) => setNotificationData({ ...notificationData, subject: e.target.value })}
                placeholder="Enter email subject"
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                placeholder="Enter email message"
                rows="6"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowNotificationModal(false)}>
                Cancel
              </button>
              <button className="btn-send" onClick={handleSendNotification}>
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;


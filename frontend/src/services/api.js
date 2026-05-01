const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getFallbackBaseUrls() {
    const normalizedBase = this.baseURL.replace(/\/+$/, '');
    const fallbackBases = [normalizedBase];

    if (/\/api$/i.test(normalizedBase)) {
      fallbackBases.push(normalizedBase.replace(/\/api$/i, ''));
    } else {
      fallbackBases.push(`${normalizedBase}/api`);
    }

    fallbackBases.push('http://localhost:5000/api');
    fallbackBases.push('http://127.0.0.1:5000/api');

    return [...new Set(fallbackBases)];
  }

  async healthCheckRequest(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token from localStorage
  removeToken() {
    localStorage.removeItem('token');
  }

  // Get headers with auth token
  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    const baseUrls = this.getFallbackBaseUrls();
    let lastError;

    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}${endpoint}`;

      try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        if (this.baseURL !== baseUrl) {
          this.baseURL = baseUrl;
        }

        return data;
      } catch (error) {
        lastError = error;

        // For HTTP errors (valid backend response), don't keep retrying other base URLs.
        if (!(error.name === 'TypeError' && error.message.includes('fetch'))) {
          console.error('API request failed:', error);
          throw error;
        }
      }
    }

    console.error('API request failed:', lastError);
    if (lastError?.name === 'TypeError' && lastError.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }

    throw lastError;
  }

  // Auth endpoints
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async googleAuth(googleData) {
    const response = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData)
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST'
    });
    
    this.removeToken();
    return response;
  }

  // Subscription endpoints
  async getSubscriptions() {
    return this.request('/subscriptions');
  }

  async createSubscription(subscriptionData) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  }

  async updateSubscription(id, subscriptionData) {
    return this.request(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData)
    });
  }

  async deleteSubscription(id) {
    return this.request(`/subscriptions/${id}`, {
      method: 'DELETE'
    });
  }

  async getSubscriptionStats() {
    return this.request('/subscriptions/stats');
  }

  // Alerts
  async sendAlertEmail(payload) {
    return this.request('/alerts/email', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (primaryError) {
      const normalizedBase = this.baseURL.replace(/\/+$/, '');
      const fallbackUrls = [];

      if (!/\/api$/i.test(normalizedBase)) {
        fallbackUrls.push(`${normalizedBase}/api/health`);
      }

      if (/\/api$/i.test(normalizedBase)) {
        fallbackUrls.push(`${normalizedBase.replace(/\/api$/i, '')}/api/health`);
      }

      fallbackUrls.push('http://localhost:5000/api/health');

      const uniqueFallbackUrls = [...new Set(fallbackUrls)];

      for (const url of uniqueFallbackUrls) {
        try {
          return await this.healthCheckRequest(url);
        } catch (fallbackError) {
          // try next fallback URL
        }
      }

      throw primaryError;
    }
  }

  // Admin endpoints
  async adminLogin(credentials) {
    const response = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
      localStorage.setItem('isAdmin', 'true');
    }
    
    return response;
  }

  async getAdminDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getAdminUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async updateUserStatus(userId, isActive) {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  }

  async sendUserNotification(userId, subject, message) {
    return this.request(`/admin/users/${userId}/notify`, {
      method: 'POST',
      body: JSON.stringify({ subject, message })
    });
  }

  async getAdminSubscriptions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/subscriptions${queryString ? `?${queryString}` : ''}`);
  }

  async createAdminSubscription(subscriptionData) {
    return this.request('/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  }

  async updateAdminSubscription(id, subscriptionData) {
    return this.request(`/admin/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData)
    });
  }

  async deleteAdminSubscription(id) {
    return this.request(`/admin/subscriptions/${id}`, {
      method: 'DELETE'
    });
  }

  async getSubscriptionPlans() {
    return this.request('/admin/subscriptions/plans');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

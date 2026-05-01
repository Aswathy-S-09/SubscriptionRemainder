import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Save } from 'lucide-react';

const AddSubscription = ({ onAdd }) => {
  const getFallbackLogo = (serviceName, bgColor = '#667eea') => {
    const initials = serviceName
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <rect width='96' height='96' rx='18' fill='${bgColor}'/>
      <text x='50%' y='56%' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='Arial, sans-serif' font-size='30' font-weight='700'>${initials}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const [formData, setFormData] = useState({
    serviceName: '',
    plan: '',
    planDuration: 1,
    price: '',
    totalAmount: '',
    renewalDate: '',
    serviceLogo: '',
    serviceColor: '#667eea',
    serviceUrl: ''
  });

  const [selectedService, setSelectedService] = useState(null);

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  // Debug: Log selected service changes
  useEffect(() => {
    console.log('Selected service changed:', selectedService);
  }, [selectedService]);

  const streamingServices = [
    {
      name: 'Netflix',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
      color: '#E50914',
      url: 'https://www.netflix.com/',
      plans: [
        { name: 'Basic', price: 199, duration: 1 },
        { name: 'Standard', price: 499, duration: 1 },
        { name: 'Premium', price: 649, duration: 1 }
      ]
    },
    {
      name: 'Amazon Prime Video',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Amazon_Prime_Logo.svg',
      color: '#00A8E1',
      url: 'https://www.primevideo.com/',
      plans: [
        { name: 'Basic', price: 199, duration: 1 },
        { name: 'Standard', price: 299, duration: 1 },
        { name: 'Premium', price: 399, duration: 1 }
      ]
    },
    {
      name: 'Jio Hotstar',
      logo: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/jiohotstar-logo.png',
      color: '#1F80E0',
      url: 'https://www.hotstar.com/',
      plans: [
        { name: 'Basic', price: 149, duration: 1 },
        { name: 'Standard', price: 299, duration: 1 },
        { name: 'Premium', price: 399, duration: 1 }
      ]
    },
    {
      name: 'Zee5',
      logo: 'https://www.zee5.com/images/ZEE5_logo.svg',
      color: '#FF6B35',
      url: 'https://www.zee5.com/',
      plans: [
        { name: 'Mobile (SD, 1 device)', price: 99, duration: 1 },
        { name: 'Premium (HD, 2 devices)', price: 149, duration: 1 },
        { name: 'Premium 4K (4 devices)', price: 299, duration: 1 },
        { name: 'Annual Premium', price: 1199, duration: 12 }
      ]
    },
    {
      name: 'SunNXT',
      logo: 'https://static.vecteezy.com/system/resources/thumbnails/051/336/401/small_2x/sun-nxt-transparent-icon-free-png.png',
      color: '#FF6B35',
      url: 'https://www.sunnxt.com/',
      plans: [
        { name: 'Mobile (SD, 1 device)', price: 59, duration: 1 },
        { name: 'Standard (HD, 2 devices)', price: 99, duration: 1 },
        { name: 'Premium (4 devices)', price: 149, duration: 1 },
        { name: 'Annual Premium', price: 999, duration: 12 }
      ]
    }
  ];

  const calculateRenewalDate = (duration) => {
    const today = new Date();
    const renewalDate = new Date(today);
    renewalDate.setMonth(today.getMonth() + duration);
    return renewalDate.toISOString().split('T')[0];
  };

  const handleServiceSelect = (service) => {
    console.log('Service selected:', service);
    setSelectedService(service);
    const firstPlan = service.plans[0];
    console.log('First plan:', firstPlan);
    
    const newFormData = {
      serviceName: service.name,
      serviceLogo: service.logo,
      serviceColor: service.color,
      serviceUrl: service.url || '',
      plan: firstPlan.name,
      price: firstPlan.price,
      planDuration: 1, // Default to 1 month
      totalAmount: firstPlan.price * 1, // Calculate for 1 month initially
      renewalDate: calculateRenewalDate(1)
    };
    
    console.log('New form data:', newFormData);
    setFormData(prev => ({
      ...prev,
      ...newFormData
    }));
  };

  const handlePlanChange = (planName) => {
    console.log('Plan changed to:', planName);
    
    if (!selectedService || !planName) return;
    
    const selectedPlan = selectedService.plans.find(p => p.name === planName);
    console.log('Selected plan:', selectedPlan);
    
    if (selectedPlan) {
      const updatedFormData = {
        plan: selectedPlan.name,
        price: selectedPlan.price,
        planDuration: formData.planDuration, // Keep current duration
        totalAmount: selectedPlan.price * formData.planDuration, // Calculate with current duration
        renewalDate: calculateRenewalDate(formData.planDuration)
      };
      
      console.log('Updated form data:', updatedFormData);
      setFormData(prev => ({
        ...prev,
        ...updatedFormData
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'planDuration') {
      const duration = parseInt(value) || 1;
      const totalAmount = formData.price * duration;
      const renewalDate = calculateRenewalDate(duration);
      
      setFormData(prev => ({
        ...prev,
        [name]: duration,
        totalAmount: totalAmount,
        renewalDate: renewalDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.serviceName || !formData.plan || !formData.price || !formData.renewalDate) {
      alert('Please fill in all required fields');
      return;
    }

    onAdd(formData);
    
    // Reset form
    setFormData({
      serviceName: '',
      plan: '',
      planDuration: 1,
      price: '',
      totalAmount: '',
      renewalDate: '',
      serviceLogo: '',
      serviceColor: '#667eea',
      serviceUrl: ''
    });
    setSelectedService(null);
    
    alert('Subscription added successfully!');
  };

  return (
    <div className="form-container">
      <h1 className="text-center mb-4">Add New Subscription</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Service Selection */}
          <div className="form-group">
            <label className="form-label">Choose Streaming Service *</label>
            <div className="service-options">
              {streamingServices.map(service => (
                <div
                  key={service.name}
                  className={`service-option ${selectedService?.name === service.name ? 'selected' : ''}`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <img
                    src={service.logo}
                    alt={service.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackLogo(service.name, service.color);
                    }}
                  />
                  <span>{service.name}</span>
                </div>
              ))}
            </div>
            {selectedService && (
              <div className="selected-service-info">
                <span className="selected-text">✓ {selectedService.name} selected</span>
              </div>
            )}
          </div>

          {/* Service Name */}
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Netflix, Amazon Prime"
              required
            />
          </div>

          {/* Plan Selection */}
          <div className="form-group">
            <label className="form-label">Plan</label>
            <select
              key={selectedService?.name || 'no-service'}
              name="plan"
              value={formData.plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="form-input"
              disabled={!selectedService}
            >
              <option value="">Select a service first</option>
              {selectedService?.plans.map(plan => (
                <option key={plan.name} value={plan.name}>
                  {plan.name} - ₹{plan.price}/month
                </option>
              ))}
            </select>
            {selectedService && (
              <div className="debug-info">
                <small>Available plans: {selectedService.plans.map(p => p.name).join(', ')}</small>
                <br />
                <small>Current plan: {formData.plan || 'None'}</small>
                <br />
                <small>Current price: ₹{formData.price || '0'}</small>
              </div>
            )}
          </div>

          {/* Plan Duration */}
          <div className="form-group">
            <label className="form-label">Plan Duration (Months)</label>
            <div className="input-with-icon">
              <Calendar size={20} />
              <input
                type="number"
                name="planDuration"
                value={formData.planDuration}
                onChange={handleInputChange}
                className="form-input"
                placeholder="1"
                min="1"
                max="24"
                required
              />
              <span className="duration-unit">months</span>
            </div>
            <small className="duration-help">Enter the number of months for your subscription plan</small>
          </div>

          {/* Price Display */}
          <div className="form-group">
            <label className="form-label">Price per Month (₹)</label>
            <div className="price-display">
              <span className="price-amount">₹{formData.price}</span>
              <small className="price-note">Monthly subscription rate</small>
            </div>
          </div>

          {/* Total Amount */}
          <div className="form-group">
            <label className="form-label">Total Amount to Pay (₹)</label>
            <div className="total-amount-display">
              <span className="total-amount">₹{formData.totalAmount}</span>
              <small className="total-note">
                {formData.planDuration} month{formData.planDuration > 1 ? 's' : ''} × ₹{formData.price} = ₹{formData.totalAmount}
              </small>
            </div>
          </div>

          {/* Renewal Date */}
          <div className="form-group">
            <label className="form-label">Renewal Date *</label>
            <div className="input-with-icon">
              <Calendar size={20} />
              <input
                type="date"
                name="renewalDate"
                value={formData.renewalDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>


          {/* Submit Button */}
          <div className="form-group">
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={20} />
              <span>Add Subscription</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscription; 
import React, { useState } from 'react';
import { MapPin, Phone, Mail as MailIcon, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Auth from './Auth';
import './Landing.css';

const Landing = ({ onAuthSuccess }) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
    setContactError('');
    setContactSuccess('');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !/\S+@\S+\.\S+/.test(contactForm.email) || !contactForm.message.trim()) {
      setContactError('Please fill in all fields with a valid email.');
      return;
    }
    setContactSuccess('Thanks! We will get back to you soon.');
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container nav">
          <div className="brand">Subscribely</div>
          <nav className="nav-links">
            <a className="nav-link" href="#about">About</a>
            <a className="nav-link" href="#services">Services</a>
            <a className="nav-link" href="#contact">Contact</a>
            <a className="nav-link cta" href="#auth">Login / Sign up</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="hero-title">Track and optimize all your subscriptions in one place</h1>
            <p className="hero-subtitle">
              Stay on top of renewals, reduce waste, and save money with smart insights.
              Subscribely makes subscription management simple for individuals and teams.
            </p>
            <div>
              <a href="#auth" className="primary-btn">Get Started</a>
            </div>
          </div>
          <div id="auth">
            <Auth onAuthSuccess={onAuthSuccess} />
          </div>
        </div>
      </section>

      <section id="about" className="section muted">
        <div className="container">
          <h2 className="section-title">About Us</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: '#334155' }}>
            We built Subscribely to eliminate the hassle of scattered subscriptions. Our mission is to
            provide a clear view of your recurring costs, timely reminders for renewals, and insights to help
            you decide what to keep or cancel. Your data stays on your device in this demo, and we never ask
            for more than we need to get you started quickly.
          </p>
        </div>
      </section>

      <section id="services" className="section">
        <div className="container">
          <h2 className="section-title">Services We Provide</h2>
          <div className="cards">
            <div className="card">
              <h3>Subscription Tracking</h3>
              <p>Add, edit, and monitor all your subscriptions in one dashboard.</p>
            </div>
            <div className="card">
              <h3>Renewal Reminders</h3>
              <p>Never miss a billing date with configurable alerts and reminders.</p>
            </div>
            <div className="card">
              <h3>Spending Insights</h3>
              <p>Visualize your monthly and annual spend to optimize costs.</p>
            </div>
            <div className="card">
              <h3>Team Support</h3>
              <p>Collaborate by sharing subscription lists across your team.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section muted">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Contact Us</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <h3 style={{ marginTop: 0, fontSize: 22 }}>Get In Touch</h3>
              <ul className="contact-list">
                <li className="contact-item">
                  <span className="contact-icon"><MapPin size={20} /></span>
                  <span>123 Nethaji street , Chennai - 600004</span>
                </li>
                <li className="contact-item">
                  <span className="contact-icon"><Phone size={20} /></span>
                  <span>+91 9489155116</span>
                </li>
                <li className="contact-item">
                  <span className="contact-icon"><MailIcon size={20} /></span>
                  <span>info@subscribely.com</span>
                </li>
              </ul>
              <div className="social-row">
                <a href="/" aria-label="Facebook" className="social-icon"><Facebook size={18} /></a>
                <a href="/" aria-label="Twitter" className="social-icon"><Twitter size={18} /></a>
                <a href="/" aria-label="Instagram" className="social-icon"><Instagram size={18} /></a>
                <a href="/" aria-label="LinkedIn" className="social-icon"><Linkedin size={18} /></a>
              </div>
            </div>
            <div className="contact-card">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <input className="form-input" name="name" value={contactForm.name} onChange={handleContactChange} placeholder="Your Name" />
                </div>
                <div className="form-row">
                  <input className="form-input" name="email" type="email" value={contactForm.email} onChange={handleContactChange} placeholder="Your Email" />
                </div>
                <div className="form-row">
                  <input className="form-input" name="subject" value={contactForm.subject || ''} onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Subject" />
                </div>
                <div className="form-row">
                  <textarea className="form-textarea" name="message" value={contactForm.message} onChange={handleContactChange} placeholder="Your Message" />
                </div>
                {contactError && <div className="form-error">{contactError}</div>}
                {contactSuccess && <div className="form-success">{contactSuccess}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button type="submit" className="submit-btn large">Send Message</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer dark">
        <div className="container footer-grid">
          <div className="footer-col">
            <h3 className="footer-title">About Subscribely</h3>
            <p className="footer-text">
              Subscribely is a simple subscription manager that helps you track renewals,
              avoid surprise charges, and understand your recurring spend. Built for
              individuals and teams who want clarity and control.
            </p>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><a href="#top">Home</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

        </div>
        <div className="footer-bottom">
          <div className="container">© {new Date().getFullYear()} Subscribely. All Rights Reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;



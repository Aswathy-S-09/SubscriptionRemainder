const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const EmailLog = require('../models/EmailLog');

class EmailScheduler {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const hasSmtpCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasSmtpCreds) {
      const smtpTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates
          minVersion: 'TLSv1.2'
        }
      });

      this.transporter = smtpTransporter;

      // Verify transporter
      smtpTransporter.verify((error, success) => {
        if (error) {
          console.error('SMTP verification failed:', error.message);
          console.warn('📭 Email scheduler will fall back to local logging until SMTP is reachable.');
          this.transporter = null;
        } else {
          console.log('✅ Email Scheduler SMTP transporter is ready');
          this.transporter = smtpTransporter;
        }
      });
    } else {
      console.log('⚠️ SMTP not configured for email scheduler. Emails will be logged locally.');
      this.transporter = null;
    }
  }

  // Calculate days until expiration
  getDaysUntilExpiration(expirationDate) {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get urgency level based on days until expiration
  getUrgencyLevel(daysUntilExpiration) {
    if (daysUntilExpiration <= 0) return 'expired';
    if (daysUntilExpiration <= 1) return 'critical';
    if (daysUntilExpiration <= 3) return 'urgent';
    if (daysUntilExpiration <= 7) return 'warning';
    return 'normal';
  }

  // Generate email content based on urgency
  generateEmailContent(user, subscriptions, urgencyLevel) {
    const urgencyConfig = {
      expired: {
        subject: '🚨 URGENT: Your Subscriptions Have Expired!',
        color: '#dc2626',
        icon: '🚨',
        title: 'Expired Subscriptions'
      },
      critical: {
        subject: '⚠️ CRITICAL: Subscriptions Expiring Today!',
        color: '#dc2626',
        icon: '⚠️',
        title: 'Critical - Expiring Today'
      },
      urgent: {
        subject: '⚡ URGENT: Subscriptions Expiring Soon!',
        color: '#ea580c',
        icon: '⚡',
        title: 'Urgent - Expiring in 1-3 Days'
      },
      warning: {
        subject: '📅 Reminder: Subscriptions Expiring This Week',
        color: '#d97706',
        icon: '📅',
        title: 'Warning - Expiring in 4-7 Days'
      }
    };

    const config = urgencyConfig[urgencyLevel] || urgencyConfig.warning;

    const subscriptionList = subscriptions.map(sub => {
      const daysLeft = this.getDaysUntilExpiration(sub.renewalDate);
      const status = daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

      return `
        <div style="background-color: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${config.color};">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">${sub.serviceName}</h4>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Plan:</strong> ${sub.plan} - ₹${sub.price}/month
          </p>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Renewal Date:</strong> ${new Date(sub.renewalDate).toLocaleDateString()}
          </p>
          <p style="margin: 4px 0; color: ${config.color}; font-weight: bold;">
            <strong>Status:</strong> ${status}
          </p>
          ${sub.serviceUrl ? `<p style="margin: 4px 0;"><a href="${sub.serviceUrl}" style="color: #4f46e5; text-decoration: none;">🔗 Open Service</a></p>` : ''}
        </div>
      `;
    }).join('');

    return {
      subject: config.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, ${config.color}, #4f46e5); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">${config.icon} ${config.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Subscribely Alert System</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.firstName},</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${urgencyLevel === 'expired'
          ? 'Your subscriptions have expired and need immediate attention!'
          : urgencyLevel === 'critical'
            ? 'Your subscriptions are expiring today! Please renew them immediately.'
            : urgencyLevel === 'urgent'
              ? 'Your subscriptions are expiring very soon. Don\'t miss out!'
              : 'This is a friendly reminder about your upcoming subscription renewals.'
        }
            </p>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">${config.title}</h3>
              ${subscriptionList}
            </div>

            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0c4a6e; margin-top: 0;">💡 Quick Actions</h3>
              <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
                <li>Log in to your Subscribely dashboard to manage subscriptions</li>
                <li>Update payment methods if needed</li>
                <li>Cancel subscriptions you no longer need</li>
                <li>Set up auto-renewal for services you want to keep</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background-color: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Manage My Subscriptions
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              This is an automated reminder from Subscribely. You can manage your notification preferences in your account settings.
            </p>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Best regards,<br>The Subscribely Team
            </p>
          </div>
        </div>
      `
    };
  }

  // Send email to user
  async sendExpirationEmail(user, subscriptions, urgencyLevel) {
    if (!this.transporter) {
      console.log('Email transporter not available, logging email instead');
      const EmailLogger = require('../email-logger');
      EmailLogger.sendRenewalReminder(user, subscriptions, urgencyLevel);
      return;
    }

    let emailContent;
    try {
      emailContent = this.generateEmailContent(user, subscriptions, urgencyLevel);

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 ${urgencyLevel.toUpperCase()} email sent to ${user.email} for ${subscriptions.length} subscription(s)`);

      // Log the email
      await EmailLog.create({
        user: user._id,
        emailType: 'renewal_reminder',
        urgencyLevel,
        subject: emailContent.subject,
        recipientEmail: user.email,
        subscriptionCount: subscriptions.length,
        status: 'sent'
      });
    } catch (error) {
      console.error(`Failed to send ${urgencyLevel} email to ${user.email}:`, error);

      // Log failed email
      try {
        await EmailLog.create({
          user: user._id,
          emailType: 'renewal_reminder',
          urgencyLevel,
          subject: emailContent?.subject || 'Renewal Reminder',
          recipientEmail: user.email,
          subscriptionCount: subscriptions.length,
          status: 'failed',
          errorMessage: error.message
        });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
    }
  }

  // Check and send emails for expiring subscriptions
  async checkAndSendExpirationEmails() {
    if (!this.transporter) {
      console.log('Email transporter not available, skipping daily check');
      return;
    }

    try {
      console.log('🔍 Starting daily subscription expiration check...');

      // Get all active users with active subscriptions
      const users = await User.find({ isActive: true }).populate({
        path: 'subscriptions',
        match: { isActive: true }
      });

      for (const user of users) {
        if (!user.subscriptions || user.subscriptions.length === 0) {
          continue;
        }

        // Group subscriptions by urgency level
        const subscriptionsByUrgency = {
          expired: [],
          critical: [],
          urgent: [],
          warning: []
        };

        // Categorize subscriptions
        for (const subscription of user.subscriptions) {
          const daysUntilExpiration = this.getDaysUntilExpiration(subscription.renewalDate);
          const urgencyLevel = this.getUrgencyLevel(daysUntilExpiration);

          if (urgencyLevel !== 'normal') {
            subscriptionsByUrgency[urgencyLevel].push(subscription);
          }
        }

        // Send emails for each urgency level (highest priority first)
        const urgencyOrder = ['expired', 'critical', 'urgent', 'warning'];

        for (const urgencyLevel of urgencyOrder) {
          if (subscriptionsByUrgency[urgencyLevel].length > 0) {
            await this.sendExpirationEmail(user, subscriptionsByUrgency[urgencyLevel], urgencyLevel);
            // Add a small delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      console.log('✅ Daily subscription expiration check completed');
    } catch (error) {
      console.error('Error during daily subscription check:', error);
    }
  }

  // Start the daily scheduler
  startDailyScheduler() {
    // Run every day at 10:00 AM
    cron.schedule('0 10 * * *', () => {
      console.log('🕙 Running daily subscription expiration check...');
      this.checkAndSendExpirationEmails();
    });

    console.log('📅 Daily email scheduler started - will run at 10:00 AM every day');
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('🔧 Manual trigger: Running subscription expiration check...');
    await this.checkAndSendExpirationEmails();
  }
}

module.exports = new EmailScheduler();

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const EmailLog = require('../models/EmailLog');
const adminAuth = require('../middleware/adminAuth');
const EmailLogger = require('../email-logger');

const router = express.Router();

// Generate JWT token for admin
const generateAdminToken = (adminId) => {
  return jwt.sign(
    { adminId, isAdmin: true },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Email transporter setup
const hasSmtpCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const createJsonTransporter = () => nodemailer.createTransport({ jsonTransport: true });

let transporter = createJsonTransporter();
let smtpReady = false;

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
    },
    connectionTimeout: 10000,
  });

  transporter = smtpTransporter;

  smtpTransporter.verify((error) => {
    if (error) {
      console.warn('Admin email transporter not ready:', error.message);
      console.warn('Falling back to local logging mode for admin notifications.');
      transporter = createJsonTransporter();
      smtpReady = false;
    } else {
      console.log('Admin email transporter is ready to send messages');
      smtpReady = true;
    }
  });
} else {
  console.log('Admin email transporter in dry-run mode (no SMTP credentials set).');
}

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin and include password for comparison
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id);

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({});

    // Active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      isActive: true,
      status: 'active'
    });

    // Expired subscriptions
    const expiredSubscriptions = await Subscription.countDocuments({
      status: 'expired'
    });

    // Renewal reminders sent (from EmailLog)
    const renewalReminders = await EmailLog.countDocuments({
      emailType: 'renewal_reminder'
    });

    // Total email alerts triggered
    const emailAlerts = await EmailLog.countDocuments({});

    // Subscription trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const subscriptionsLast30Days = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Weekly trends (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const weeklyTrends = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-W%V', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Monthly trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrends = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        expiredSubscriptions,
        renewalReminders,
        emailAlerts,
        trends: {
          daily: subscriptionsLast30Days,
          weekly: weeklyTrends,
          monthly: monthlyTrends
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination, search, sort, and filter
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const filterStatus = req.query.status; // 'active' or 'inactive'

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (filterStatus) {
      query.isActive = filterStatus === 'active';
    }

    // Get users with subscription count
    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get subscription counts for each user
    const userIds = users.map(u => u._id);
    const subscriptionCounts = await Subscription.aggregate([
      {
        $match: {
          user: { $in: userIds },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    subscriptionCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    users.forEach(user => {
      user.subscriptionCount = countMap[user._id.toString()] || 0;
    });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate or deactivate a user
// @access  Private (Admin)
router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

// @route   POST /api/admin/users/:id/notify
// @desc    Send notification/email to a specific user
// @access  Private (Admin)
router.post('/users/:id/notify', [
  adminAuth,
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { subject, message } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!hasSmtpCreds || !smtpReady) {
      EmailLogger.logEmail(
        'Admin Notification (Fallback)',
        user.email,
        subject,
        message
      );

      await EmailLog.create({
        user: user._id,
        emailType: 'custom',
        subject,
        recipientEmail: user.email,
        status: 'logged'
      });

      return res.status(202).json({
        success: true,
        message: 'SMTP server unavailable. Notification logged locally instead.'
      });
    }

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: user.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">${subject}</h2>
          <p>Hi ${user.firstName},</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p>Best regards,<br>The Subscribely Team</p>
        </div>
      `
    });

    // Log the email
    await EmailLog.create({
      user: user._id,
      emailType: 'custom',
      subject,
      recipientEmail: user.email,
      status: 'sent'
    });

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending notification'
    });
  }
});

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions with filters
// @access  Private (Admin)
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'expired', 'cancelled'
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { plan: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subscriptions'
    });
  }
});

// @route   POST /api/admin/subscriptions
// @desc    Create a new subscription plan (admin can create for any user)
// @access  Private (Admin)
router.post('/subscriptions', [
  adminAuth,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('serviceName').trim().notEmpty().withMessage('Service name is required'),
  body('plan').trim().notEmpty().withMessage('Plan is required'),
  body('planDuration').isInt({ min: 1, max: 24 }).withMessage('Plan duration must be between 1 and 24 months'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('renewalDate').isISO8601().withMessage('Valid renewal date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, ...subscriptionData } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const subscription = new Subscription({
      ...subscriptionData,
      user: userId
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: await Subscription.findById(subscription._id).populate('user', 'firstName lastName email')
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating subscription'
    });
  }
});

// @route   PUT /api/admin/subscriptions/:id
// @desc    Update a subscription
// @access  Private (Admin)
router.put('/subscriptions/:id', [
  adminAuth,
  body('serviceName').optional().trim().notEmpty().withMessage('Service name cannot be empty'),
  body('plan').optional().trim().notEmpty().withMessage('Plan cannot be empty'),
  body('planDuration').optional().isInt({ min: 1, max: 24 }).withMessage('Plan duration must be between 1 and 24 months'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('renewalDate').optional().isISO8601().withMessage('Valid renewal date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        subscription[key] = req.body[key];
      }
    });

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: await Subscription.findById(subscription._id).populate('user', 'firstName lastName email')
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subscription'
    });
  }
});

// @route   DELETE /api/admin/subscriptions/:id
// @desc    Delete a subscription
// @access  Private (Admin)
router.delete('/subscriptions/:id', adminAuth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Hard delete for admin
    await Subscription.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting subscription'
    });
  }
});

// @route   GET /api/admin/subscriptions/plans
// @desc    Get subscription plans grouped by service name and plan
// @access  Private (Admin)
router.get('/subscriptions/plans', adminAuth, async (req, res) => {
  try {
    const plans = await Subscription.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: {
            serviceName: '$serviceName',
            plan: '$plan'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          avgPrice: { $avg: '$price' },
          users: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          serviceName: '$_id.serviceName',
          plan: '$_id.plan',
          subscriberCount: '$count',
          totalRevenue: '$totalRevenue',
          avgPrice: '$avgPrice',
          userCount: { $size: '$users' }
        }
      },
      {
        $sort: { subscriberCount: -1 }
      }
    ]);

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting subscription plans'
    });
  }
});

module.exports = router;


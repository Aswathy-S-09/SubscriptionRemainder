const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Email transporter setup
const hasSmtpCreds = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
console.log('SMTP Config:', {
  hasCreds: hasSmtpCreds,
  user: process.env.SMTP_USER,
  passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
});

const EmailLogger = require('../email-logger');

const createJsonTransporter = () => nodemailer.createTransport({ jsonTransport: true });

let transporter = createJsonTransporter();
let smtpReady = false;

if (hasSmtpCreds) {
  const smtpTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Gmail address
      pass: process.env.SMTP_PASS, // App password
    },
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000,
  });

  transporter = smtpTransporter;

  // Verify transporter
  smtpTransporter.verify((error, success) => {
    if (error) {
      console.error('SMTP verification failed:', error.message);
      console.warn('Falling back to local email logging for welcome emails until SMTP is reachable.');
      transporter = createJsonTransporter();
      smtpReady = false;
    } else {
      console.log('✅ SMTP transporter is ready to send emails');
      smtpReady = true;
    }
  });
}



// Send welcome email
const sendWelcomeEmail = async (user, isLogin = false) => {
  if (!hasSmtpCreds || !smtpReady) {
    console.log('SMTP not configured, logging welcome email instead');
    EmailLogger.sendWelcomeEmail(user, isLogin);
    return;
  }

  try {
    const subject = isLogin ? 'Welcome back to Subscribely! 👋' : 'Welcome to Subscribely! 🎉';
    const greeting = isLogin ? 'Welcome back' : 'Welcome';
    const actionText = isLogin ? 'Continue managing' : 'Start by adding';

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">${greeting} to Subscribely!</h2>
          <p>Hi ${user.firstName},</p>
          <p>${isLogin ? 'Great to see you back! We hope you\'re enjoying managing your subscriptions with Subscribely.' : 'Thank you for joining Subscribely! We\'re excited to help you manage your subscriptions and never miss a renewal date again.'}</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">What you can do:</h3>
            <ul style="color: #374151;">
              <li>Add your streaming service subscriptions</li>
              <li>Track renewal dates and costs</li>
              <li>Get alerts before subscriptions expire</li>
              <li>View spending insights and analytics</li>
            </ul>
          </div>
          
          <p>${actionText} your subscriptions to get the most out of Subscribely!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${isLogin ? 'Continue to Dashboard' : 'Get Started'}</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
          
          <p>Best regards,<br>The Subscribely Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`${isLogin ? 'Welcome back' : 'Welcome'} email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      provider: 'local'
    });

    await user.save();

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user, false).catch(err =>
      console.error('Welcome email failed:', err)
    );

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
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

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send welcome back email (async, don't wait)
    sendWelcomeEmail({
      ...user.toObject(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }, true).catch(err =>
      console.error('Welcome back email failed:', err)
    );

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('googleId').notEmpty().withMessage('Google ID is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
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

    const { email, googleId, firstName, lastName } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    // Provide fallbacks for first/last name if empty (common issue with some Google profiles)
    const finalFirstName = (firstName || email.split('@')[0]).trim() || 'Google';
    const finalLastName = (lastName || 'User').trim();

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.firstName = finalFirstName;
        user.lastName = finalLastName;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        firstName: finalFirstName,
        lastName: finalLastName,
        email,
        googleId,
        provider: 'google',
        password: `google_${googleId}_${Math.random().toString(36).slice(-8)}` // Unusable random password
      });
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user data'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

module.exports = router;

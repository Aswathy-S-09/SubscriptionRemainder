const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

const router = express.Router();

const EmailLogger = require('../email-logger');

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
      console.warn('Email transporter not ready:', error.message);
      console.warn('Falling back to local logging mode for alert emails until SMTP is reachable.');
      transporter = createJsonTransporter();
      smtpReady = false;
    } else {
      console.log('Email transporter is ready to send messages');
      smtpReady = true;
    }
  });
} else {
  console.log('Email transporter in dry-run mode (no SMTP credentials set).');
}

// @route   POST /api/alerts/email
// @desc    Send important alerts to user's email
// @access  Private
router.post('/email', [
  auth,
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const toEmail = req.user.email;
    const { subject, message } = req.body;

    if (!hasSmtpCreds || !smtpReady) {
      EmailLogger.logEmail('Alert Email (Fallback)', toEmail, subject, message);
      return res.status(202).json({
        success: true,
        message: 'SMTP server unavailable. Alert logged locally instead.'
      });
    }

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: toEmail,
      subject,
      text: message,
    });

    res.json({ success: true, message: 'Alert email sent successfully' });
  } catch (error) {
    console.error('Send alert email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send alert email' });
  }
});

module.exports = router;

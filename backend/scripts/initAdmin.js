require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/database');

const initAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Create or update admin user
    const admin = await Admin.findOne({ email: 'subscriblyinfo@gmail.com' });
    
    if (admin) {
      admin.password = 'achu0910';
      await admin.save();
      console.log('✅ Admin user updated successfully');
    } else {
      const newAdmin = new Admin({
        email: 'subscriblyinfo@gmail.com',
        password: 'achu0910',
        role: 'admin',
        isActive: true
      });
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    }
    
    console.log('Email: subscriblyinfo@gmail.com');
    console.log('Password: achu0910');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
};

initAdmin();


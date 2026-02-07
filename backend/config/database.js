const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subscribely', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.error('⚠️ Server will continue running, but database operations will fail.');
    console.error('Please ensure MongoDB is running and the connection string is correct.');
  }
};

module.exports = connectDB;

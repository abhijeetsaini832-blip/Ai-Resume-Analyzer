const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = connectDB;

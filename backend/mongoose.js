const mongoose = require('mongoose');
const url="mongodb+srv://satputeshubham424_db_user:Shubham2004@cluster0.myrqkkp.mongodb.net/"

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

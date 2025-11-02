const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB csatlakozva');
  } catch (error) {
    console.error('MongoDB kapcsolódási hiba:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

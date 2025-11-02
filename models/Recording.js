const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Cím megadása kötelező'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Dátum megadása kötelező']
  },
  filePath: {
    type: String,
    required: [true, 'Fájl elérési út kötelező']
  },
  fileSize: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // másodpercekben
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recording', recordingSchema);

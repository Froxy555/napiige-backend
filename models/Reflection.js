const mongoose = require('mongoose');

const reflectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true // Formátum: YYYY-MM-DD
  },
  message: {
    type: String,
    required: [true, 'Üzenet megadása kötelező'],
    trim: true,
    maxlength: [1000, 'Az üzenet maximum 1000 karakter hosszú lehet']
  },
  scriptureReference: {
    type: String,
    default: '' // Pl: "Újszövetség: János 3,16"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index a gyorsabb lekérdezésekhez
reflectionSchema.index({ date: 1, createdAt: -1 });

module.exports = mongoose.model('Reflection', reflectionSchema);

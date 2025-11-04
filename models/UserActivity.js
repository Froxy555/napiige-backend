const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Olvasási sorozat
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastReadDate: {
    type: Date,
    default: null
  },
  // Statisztikák
  totalReadings: {
    type: Number,
    default: 0
  },
  totalReflections: {
    type: Number,
    default: 0
  },
  totalGroupMessages: {
    type: Number,
    default: 0
  },
  // Jelvények
  achievements: [{
    type: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Olvasási történet (streak számításhoz)
  readingHistory: [{
    date: {
      type: String, // YYYY-MM-DD formátum
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index a gyorsabb lekérdezéshez
userActivitySchema.index({ user: 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);

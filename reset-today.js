require('dotenv').config();
const mongoose = require('mongoose');
const UserActivity = require('./models/UserActivity');

async function resetToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB kapcsolat OK');

    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🗑️ Mai nap (${today}) törlése az összes felhasználónál...\n`);

    // 1. Töröljük a mai napot a readingHistory-ból
    await UserActivity.updateMany(
      {},
      {
        $pull: {
          readingHistory: { date: today }
        }
      }
    );

    // 2. Nullázzuk a totalReadings számlálót
    const result = await UserActivity.updateMany(
      {},
      {
        $set: {
          totalReadings: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      }
    );

    console.log(`✅ ${result.modifiedCount} felhasználó activity TELJESEN resetelve`);
    console.log(`🔄 totalReadings: 0, readingHistory: üres`);
    console.log(`\n💡 Most újra betöltheted az oldalt és számolja a verseket!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hiba:', error);
    process.exit(1);
  }
}

resetToday();

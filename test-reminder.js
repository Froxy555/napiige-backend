require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Reflection = require('./models/Reflection');
const { sendEmail, emailTemplates } = require('./config/email');

async function testReminder() {
  try {
    // Kapcsolódás az adatbázishoz
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB kapcsolat OK');

    // Mai nap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lekérdezzük az összes felhasználót
    const users = await User.find({ 
      email: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`\n📧 ${users.length} felhasználó találva:\n`);

    for (const user of users) {
      console.log(`👤 ${user.name} (${user.email})`);
      
      // Ellenőrizzük, írt-e ma reflexiót
      const todayReflection = await Reflection.findOne({
        userId: user._id,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (todayReflection) {
        console.log(`   ✅ Már írt ma reflexiót - Nem küldünk emailt\n`);
      } else {
        console.log(`   ❌ Még NEM írt ma reflexiót - Email küldése...`);
        
        const formattedDate = today.toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const result = await sendEmail({
          to: user.email,
          subject: '✍️ TESZT Emlékeztető: Még nem írtál reflexiót ma',
          html: emailTemplates.dailyReflectionReminder(user.name, formattedDate)
        });

        if (result.success) {
          console.log(`   ✅ Email sikeresen elküldve! MessageID: ${result.messageId}\n`);
        } else {
          console.log(`   ❌ Email hiba: ${result.error}\n`);
        }
      }
    }

    console.log('\n✅ Teszt befejezve!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Hiba:', error);
    process.exit(1);
  }
}

testReminder();

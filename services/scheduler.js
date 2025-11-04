const cron = require('node-cron');
const User = require('../models/User');
const Reflection = require('../models/Reflection');
const { sendEmail, emailTemplates } = require('../config/email');

// Véletlenszerű időpont 21:00-22:00 között
let todayScheduled = false;
let todayTargetMinute = null;

// Napi emlékeztető - Ellenőrzés minden percben
const dailyReflectionReminder = cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Éjfélkor reseteljük
  if (currentHour === 0 && currentMinute === 0) {
    todayScheduled = false;
    todayTargetMinute = null;
    console.log('🌙 Éjfél - Reset, holnap új véletlenszerű idő');
  }
  
  // Ha már futott ma, return
  if (todayScheduled) {
    return;
  }
  
  // 21:00-kor generálunk egy véletlenszerű percet
  if (currentHour === 21 && todayTargetMinute === null) {
    todayTargetMinute = Math.floor(Math.random() * 60);
    console.log(`🎲 Mai emlékeztető időpontja: 21:${todayTargetMinute.toString().padStart(2, '0')}`);
  }
  
  // Ha elértük a cél időpontot, futtatjuk
  if (currentHour === 21 && currentMinute === todayTargetMinute && !todayScheduled) {
    console.log(`🔔 Emlékeztető futtatása: 21:${currentMinute.toString().padStart(2, '0')}`);
    todayScheduled = true;
    console.log('🕘 Napi reflexió emlékeztető futtatása...', new Date().toLocaleString('hu-HU'));
    
    try {
    // Mai nap kezdete és vége
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Keressük meg az összes felhasználót, akiknek van email címe
    const users = await User.find({ 
      email: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`📧 ${users.length} felhasználó ellenőrzése...`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Ellenőrizzük, írt-e ma reflexiót
      const todayReflection = await Reflection.findOne({
        userId: user._id,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      // Ha nem írt reflexiót, küldjünk emailt
      if (!todayReflection) {
        const formattedDate = today.toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const result = await sendEmail({
          to: user.email,
          subject: '✍️ Emlékeztető: Még nem írtál reflexiót ma',
          html: emailTemplates.dailyReflectionReminder(user.name, formattedDate)
        });

        if (result.success) {
          sentCount++;
          console.log(`✅ Email elküldve: ${user.name} (${user.email})`);
        } else {
          console.error(`❌ Email hiba: ${user.name} - ${result.error}`);
        }
      } else {
        skippedCount++;
        console.log(`⏭️ ${user.name} már írt ma reflexiót`);
      }
    }

    console.log(`\n📊 Összegzés:
      - Elküldött emailek: ${sentCount}
      - Kihagyott (már írt): ${skippedCount}
      - Összes felhasználó: ${users.length}
    `);

    } catch (error) {
      console.error('❌ Hiba a napi emlékeztetőnél:', error);
    }
  }
}, {
  timezone: "Europe/Budapest"
});

// Heti összefoglaló - Vasárnap este 8-kor (opcionális)
const weeklyDigest = cron.schedule('0 20 * * 0', async () => {
  console.log('📊 Heti összefoglaló futtatása...', new Date().toLocaleString('hu-HU'));
  // TODO: Implement weekly digest
}, {
  scheduled: false, // Kikapcsolva alapból
  timezone: "Europe/Budapest"
});

// Indítsd el a schedulereket
const startScheduler = () => {
  console.log('⏰ Scheduler indítása...');
  console.log('✅ Napi reflexió emlékeztető beállítva: Véletlenszerű időpont 21:00-22:00 között');
  
  dailyReflectionReminder.start();
  // weeklyDigest.start(); // Ha be szeretnéd kapcsolni a heti összefoglalót
};

// Állítsd le a schedulereket
const stopScheduler = () => {
  console.log('⏸️ Scheduler leállítása...');
  dailyReflectionReminder.stop();
  weeklyDigest.stop();
};

// Manuális email küldés teszteléshez
const sendTestReminder = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      return { success: false, message: 'Felhasználó vagy email nem található' };
    }

    const today = new Date().toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const result = await sendEmail({
      to: user.email,
      subject: '✍️ Teszt emlékeztető',
      html: emailTemplates.dailyReflectionReminder(user.name, today)
    });

    return result;
  } catch (error) {
    console.error('Teszt email hiba:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  sendTestReminder
};

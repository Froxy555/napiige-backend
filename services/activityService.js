const UserActivity = require('../models/UserActivity');
const { checkAndUnlockAchievements } = require('./achievementService');

/**
 * Regisztrál egy olvasást és frissíti a streak-et
 * @param {String} userId - User ID
 * @param {String} date - Dátum YYYY-MM-DD formátumban
 * @param {String} newTestamentRef - Újszövetség hivatkozás (pl. "János 3:16-18")
 * @param {String} oldTestamentRef - Ószövetség hivatkozás (pl. "Zsoltárok 23:1-6")
 * @returns {Object} - Frissített activity és új jelvények
 */
async function recordReading(userId, date, newTestamentRef = '', oldTestamentRef = '', newTestamentText = '', oldTestamentText = '') {
  let activity = await UserActivity.findOne({ user: userId });

  // Ha még nincs activity rekord, létrehozunk egyet
  if (!activity) {
    activity = await UserActivity.create({
      user: userId,
      totalReadings: 0,
      currentStreak: 0,
      longestStreak: 0,
      readingHistory: []
    });
  }

  // Ellenőrizzük, hogy már volt-e olvasás ezen a napon
  const existingReadingIndex = activity.readingHistory.findIndex(h => h.date === date);
  const alreadyRead = existingReadingIndex !== -1;

  // Versek számolása - először szövegből, ha nincs akkor hivatkozásból
  const newTestamentVerses = newTestamentText ? countVersesFromText(newTestamentText) : countVerses(newTestamentRef);
  const oldTestamentVerses = oldTestamentText ? countVersesFromText(oldTestamentText) : countVerses(oldTestamentRef);
  const totalVersesToday = newTestamentVerses + oldTestamentVerses;
  
  console.log(`📚 Versek számolása: Újszövetség (${newTestamentRef}): ${newTestamentVerses} vers, Ószövetség (${oldTestamentRef}): ${oldTestamentVerses} vers, Összesen: ${totalVersesToday} vers`);

  if (alreadyRead) {
    // Ha már volt olvasás ma, NEM számoljuk újra (naponta csak EGYSZER)
    console.log(`✅ Már számoltuk a mai napot - nem frissítjük`);
    
    return {
      activity,
      newAchievements: [],
      alreadyRecorded: true
    };
  }

  // Új olvasás hozzáadása
  activity.readingHistory.push({ 
    date, 
    timestamp: new Date(),
    verses: totalVersesToday
  });
  activity.totalReadings = (activity.totalReadings || 0) + totalVersesToday;

  // Streak számítás
  const yesterday = getYesterdayDate(date);
  const hadReadingYesterday = activity.readingHistory.some(h => h.date === yesterday);

  if (hadReadingYesterday || activity.currentStreak === 0) {
    // Folytatódik a streak vagy új kezdődik
    activity.currentStreak += 1;
  } else {
    // Megszakadt a streak, újrakezdődik
    activity.currentStreak = 1;
  }

  // Longest streak frissítése ha szükséges
  if (activity.currentStreak > activity.longestStreak) {
    activity.longestStreak = activity.currentStreak;
  }

  await activity.save();

  // Jelvények ellenőrzése
  const newAchievements = await checkAndUnlockAchievements(userId);

  return {
    activity,
    newAchievements,
    alreadyRecorded: false
  };
}

/**
 * Regisztrál egy reflexiót
 * @param {String} userId - User ID
 */
async function recordReflection(userId) {
  let activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    activity = await UserActivity.create({
      user: userId,
      totalReflections: 1
    });
  } else {
    activity.totalReflections += 1;
    await activity.save();
  }

  // Jelvények ellenőrzése
  const newAchievements = await checkAndUnlockAchievements(userId);

  return { activity, newAchievements };
}

/**
 * Regisztrál egy csoport üzenetet
 * @param {String} userId - User ID
 */
async function recordGroupMessage(userId) {
  let activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    activity = await UserActivity.create({
      user: userId,
      totalGroupMessages: 1
    });
  } else {
    activity.totalGroupMessages += 1;
    await activity.save();
  }

  // Jelvények ellenőrzése
  const newAchievements = await checkAndUnlockAchievements(userId);

  return { activity, newAchievements };
}

/**
 * Visszaadja egy user statisztikáit
 * @param {String} userId - User ID
 */
async function getUserStats(userId) {
  const activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalReadings: 0,
      totalReflections: 0,
      totalGroupMessages: 0,
      achievements: []
    };
  }

  return {
    currentStreak: activity.currentStreak,
    longestStreak: activity.longestStreak,
    totalReadings: activity.totalReadings,
    totalReflections: activity.totalReflections,
    totalGroupMessages: activity.totalGroupMessages,
    achievements: activity.achievements,
    lastReadDate: activity.lastReadDate
  };
}

/**
 * Számolja hány vers van egy szövegben a verszámok alapján
 * @param {String} text - Biblia szöveg verszámokkal (pl. "1Valami... 2Másik... 3Harmadik...")
 * @returns {Number} - Versek száma
 */
function countVersesFromText(text) {
  if (!text) return 0;
  
  try {
    // Keressük minden számot ami vers lehet (1-150 között)
    const verseNumbers = [];
    const matches = text.match(/\b(\d{1,3})\b/g);
    
    if (matches) {
      for (const match of matches) {
        const num = parseInt(match);
        if (num >= 1 && num <= 150) { // Max 150 vers egy fejezetben
          verseNumbers.push(num);
        }
      }
    }
    
    if (verseNumbers.length === 0) return 1;
    
    // A legnagyobb verszám = hány vers van
    const maxVerse = Math.max(...verseNumbers);
    const minVerse = Math.min(...verseNumbers);
    
    // Ha nem 1-től kezdődik, akkor tartomány: max - min + 1
    return maxVerse - minVerse + 1;
    
  } catch (error) {
    console.error('Hiba a szöveg alapú vers számolásban:', error);
    return 1;
  }
}

/**
 * Számolja hány verset tartalmaz egy hivatkozás (pl. "János 3:16-18" -> 3 vers)
 * @param {String} reference - Igeszakasz hivatkozás (pl. "János 3:16-18")
 * @returns {Number} - Versek száma
 */
function countVerses(reference) {
  if (!reference) return 0;
  
  // Formátumok:
  // 1. "ApCsel 12,20–25" - vessző a fejezet és vers között, kötőjel a versek között
  // 2. "János 3:16-18" - kettőspont formátum
  // 3. "Ézs 18" - csak fejezet, nincs vers (becsült 25 vers)
  
  try {
    // Normálizálás: cseréljük a hosszú kötőjelet (–) rövidre (-)
    const normalized = reference.replace(/–/g, '-');
    
    // Vesszővel vagy pontosvesszővel elválasztott részek
    const parts = normalized.split(/;/);
    let totalVerses = 0;
    
    for (let part of parts) {
      part = part.trim();
      
      // 1. Tartomány vesszővel: "12,20-25" vagy "12:20-25"
      const commaRangeMatch = part.match(/\b(\d+)[,:](\d+)-(\d+)/);
      if (commaRangeMatch) {
        const start = parseInt(commaRangeMatch[2]);
        const end = parseInt(commaRangeMatch[3]);
        totalVerses += (end - start + 1);
        continue;
      }
      
      // 2. Fejezetek közötti tartomány: "3:16-4:2"
      const chapterRangeMatch = part.match(/(\d+)[,:](\d+)-(\d+)[,:](\d+)/);
      if (chapterRangeMatch) {
        const startChapter = parseInt(chapterRangeMatch[1]);
        const startVerse = parseInt(chapterRangeMatch[2]);
        const endChapter = parseInt(chapterRangeMatch[3]);
        const endVerse = parseInt(chapterRangeMatch[4]);
        
        if (startChapter === endChapter) {
          totalVerses += (endVerse - startVerse + 1);
        } else {
          // Több fejezet - becsült számítás (~25 vers/fejezet)
          totalVerses += (25 - startVerse) + (endVerse) + ((endChapter - startChapter - 1) * 25);
        }
        continue;
      }
      
      // 3. Egyetlen vers: "12,20" vagy "3:16"
      const singleVerseMatch = part.match(/\b(\d+)[,:](\d+)/);
      if (singleVerseMatch) {
        totalVerses += 1;
        continue;
      }
      
      // 4. Csak fejezet: "Ézs 18" - feltételezzük ~10 verset (átlag fejezet)
      const chapterOnlyMatch = part.match(/\b(\d+)$/);
      if (chapterOnlyMatch) {
        totalVerses += 10; // Becsült átlagos fejezet hossz
        continue;
      }
    }
    
    return totalVerses > 0 ? totalVerses : 1; // Legalább 1
  } catch (error) {
    console.error('Hiba a versek számolásában:', error, 'Reference:', reference);
    return 10; // Alapértelmezett: becsült 10 vers
  }
}

/**
 * Helper: visszaadja a tegnapi dátumot YYYY-MM-DD formátumban
 */
function getYesterdayDate(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

module.exports = {
  recordReading,
  recordReflection,
  recordGroupMessage,
  getUserStats
};

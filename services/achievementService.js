const UserActivity = require('../models/UserActivity');

// Jelvények definíciója
const ACHIEVEMENTS = {
  FIRST_READING: {
    id: 'FIRST_READING',
    name: 'Első olvasás',
    description: 'Elolvastad az első napi igét',
    icon: '📖',
    condition: (activity) => activity.totalReadings >= 1
  },
  FIRST_REFLECTION: {
    id: 'FIRST_REFLECTION',
    name: 'Első reflexió',
    description: 'Megosztottad az első gondolatodat',
    icon: '✍️',
    condition: (activity) => activity.totalReflections >= 1
  },
  STREAK_3: {
    id: 'STREAK_3',
    name: '3 napos sorozat',
    description: '3 egymást követő nap olvasás',
    icon: '🔥',
    condition: (activity) => activity.currentStreak >= 3
  },
  STREAK_7: {
    id: 'STREAK_7',
    name: '1 hét kitartás',
    description: '7 egymást követő nap olvasás',
    icon: '🔥🔥',
    condition: (activity) => activity.currentStreak >= 7
  },
  STREAK_30: {
    id: 'STREAK_30',
    name: '1 hónap erő',
    description: '30 egymást követő nap olvasás',
    icon: '⭐',
    condition: (activity) => activity.currentStreak >= 30
  },
  STREAK_100: {
    id: 'STREAK_100',
    name: '100 napos bajnok',
    description: '100 egymást követő nap olvasás',
    icon: '👑',
    condition: (activity) => activity.currentStreak >= 100
  },
  READINGS_10: {
    id: 'READINGS_10',
    name: '10 ige',
    description: 'Összesen 10 ige elolvasva',
    icon: '📚',
    condition: (activity) => activity.totalReadings >= 10
  },
  READINGS_50: {
    id: 'READINGS_50',
    name: '50 ige',
    description: 'Összesen 50 ige elolvasva',
    icon: '📚📚',
    condition: (activity) => activity.totalReadings >= 50
  },
  READINGS_100: {
    id: 'READINGS_100',
    name: '100 ige',
    description: 'Összesen 100 ige elolvasva',
    icon: '🎓',
    condition: (activity) => activity.totalReadings >= 100
  },
  REFLECTIONS_10: {
    id: 'REFLECTIONS_10',
    name: '10 reflexió',
    description: '10 gondolat megosztva',
    icon: '💭',
    condition: (activity) => activity.totalReflections >= 10
  },
  REFLECTIONS_50: {
    id: 'REFLECTIONS_50',
    name: '50 reflexió',
    description: '50 gondolat megosztva',
    icon: '💬',
    condition: (activity) => activity.totalReflections >= 50
  },
  COMMUNITY_ACTIVE: {
    id: 'COMMUNITY_ACTIVE',
    name: 'Közösségi tag',
    description: '25 csoport üzenet küldve',
    icon: '👥',
    condition: (activity) => activity.totalGroupMessages >= 25
  }
};

/**
 * Ellenőrzi és feloldja az új jelvényeket egy user számára
 * @param {String} userId - User ID
 * @returns {Array} - Új jelvények listája
 */
async function checkAndUnlockAchievements(userId) {
  const activity = await UserActivity.findOne({ user: userId });
  
  if (!activity) {
    return [];
  }

  const unlockedAchievements = activity.achievements.map(a => a.type);
  const newAchievements = [];

  // Végigmegyünk minden jelvényen
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    // Ha még nincs feloldva és teljesül a feltétel
    if (!unlockedAchievements.includes(achievement.id) && achievement.condition(activity)) {
      activity.achievements.push({
        type: achievement.id,
        unlockedAt: new Date()
      });
      newAchievements.push({
        ...achievement,
        unlockedAt: new Date()
      });
    }
  }

  if (newAchievements.length > 0) {
    await activity.save();
  }

  return newAchievements;
}

/**
 * Visszaadja az összes elérhető jelvényt a user számára
 * @param {String} userId - User ID
 * @returns {Object} - Unlocked és locked jelvények
 */
async function getUserAchievements(userId) {
  const activity = await UserActivity.findOne({ user: userId });
  
  if (!activity) {
    return {
      unlocked: [],
      locked: Object.values(ACHIEVEMENTS)
    };
  }

  const unlockedIds = activity.achievements.map(a => a.type);
  
  const unlocked = activity.achievements.map(a => {
    const achievementDef = ACHIEVEMENTS[a.type];
    return {
      ...achievementDef,
      unlockedAt: a.unlockedAt
    };
  });

  const locked = Object.values(ACHIEVEMENTS).filter(
    a => !unlockedIds.includes(a.id)
  );

  return { unlocked, locked };
}

module.exports = {
  ACHIEVEMENTS,
  checkAndUnlockAchievements,
  getUserAchievements
};

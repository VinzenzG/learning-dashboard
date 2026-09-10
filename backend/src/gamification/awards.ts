import {
  getUserStats, updateUserStats, unlockBadge,
  getTotalReviewCount, getFeynmanCount, getAllBadges,
  type Badge,
} from '../db/queries/gamification';
import { getDb } from '../db/client';

export interface AwardResult {
  xpDelta: number;
  newLevel: number | null;
  newBadges: Badge[];
  streakUpdate: { current: number; longest: number };
}

function computeLevel(totalXp: number): number {
  let level = 1;
  while (totalXp >= 50 * level * (level + 1)) level++;
  return level;
}

export function processReviewAward(opts: {
  quality: number;
  prevStatus: string;
  newStatus: string;
  sessionCards?: number;
  sessionCorrect?: number;
  avgTimeMs?: number;
}): AwardResult {
  const { quality, prevStatus, newStatus } = opts;
  const db = getDb();
  const stats = getUserStats();
  const newBadges: Badge[] = [];

  // XP
  let xpDelta = 5; // any review
  if (quality >= 3) xpDelta += 10;
  if (prevStatus !== 'mastered' && newStatus === 'mastered') xpDelta += 25;
  if (prevStatus === 'learning' && newStatus === 'review') xpDelta += 15;

  // Streak
  const today = new Date().toISOString().slice(0, 10);
  let { current_streak_days: streak, longest_streak_days: longest } = stats;
  if (stats.last_activity_date !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stats.last_activity_date === yesterday) {
      streak += 1;
    } else if (stats.last_activity_date !== today) {
      streak = 1;
    }
    if (streak > longest) longest = streak;
  }

  const newTotalXp = stats.total_xp + xpDelta;
  const oldLevel = stats.level;
  const newLevelNum = computeLevel(newTotalXp);

  updateUserStats({
    total_xp: newTotalXp,
    level: newLevelNum,
    current_streak_days: streak,
    longest_streak_days: longest,
    last_activity_date: today,
  });

  // Badge checks
  const totalReviews = getTotalReviewCount();
  const feynmanCount = getFeynmanCount();
  const allBadges = getAllBadges();
  const unlocked = new Set(allBadges.filter(b => b.unlocked_at).map(b => b.slug));

  const tryUnlock = (slug: string) => {
    if (!unlocked.has(slug)) {
      const b = unlockBadge(slug);
      if (b) newBadges.push(b);
    }
  };

  if (totalReviews === 1) tryUnlock('first_review');
  if (totalReviews >= 100) tryUnlock('hundred_reviews');
  if (streak >= 3) tryUnlock('day_3_streak');
  if (streak >= 7) tryUnlock('week_warrior');
  if (streak >= 30) tryUnlock('month_master');
  if (newStatus === 'mastered') {
    // Check if all cards in any unit are mastered
    const row = db.prepare(`
      SELECT u.id FROM learning_units u
      WHERE u.status = 'ready'
        AND NOT EXISTS (
          SELECT 1 FROM questions q
          JOIN srs_cards c ON c.question_id = q.id
          WHERE q.unit_id = u.id AND c.status != 'mastered'
        )
        AND EXISTS (SELECT 1 FROM questions q2 WHERE q2.unit_id = u.id)
    `).get();
    if (row) tryUnlock('unit_master');
  }
  if (feynmanCount >= 5) tryUnlock('feynman_fan');
  if (newLevelNum >= 10) tryUnlock('overachiever');

  // Session-level badges passed in optionally
  if (opts.sessionCards && opts.sessionCards >= 10 && opts.sessionCorrect === opts.sessionCards) {
    tryUnlock('perfectionist');
  }
  if (opts.sessionCards && opts.sessionCards >= 10 && opts.avgTimeMs && opts.avgTimeMs < 5000) {
    tryUnlock('speed_demon');
  }

  // Comeback badge: if user was away 3+ days
  if (stats.last_activity_date) {
    const last = new Date(stats.last_activity_date);
    const diffDays = Math.floor((Date.now() - last.getTime()) / 86400000);
    if (diffDays >= 3 && !unlocked.has('comeback_kid')) {
      tryUnlock('comeback_kid');
    }
  }

  return {
    xpDelta,
    newLevel: newLevelNum !== oldLevel ? newLevelNum : null,
    newBadges,
    streakUpdate: { current: streak, longest },
  };
}

export function processFirstUnit(): Badge[] {
  const badge = unlockBadge('first_unit');
  return badge ? [badge] : [];
}

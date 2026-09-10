export interface Sm2Input {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  quality: number; // 0-5
}

export interface Sm2Output {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: Date;
  status: 'new' | 'learning' | 'review' | 'mastered';
  was_lapse: boolean;
}

export function sm2(input: Sm2Input): Sm2Output {
  let { repetitions, interval_days, ease_factor, quality } = input;

  const was_lapse = quality < 3;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const status: Sm2Output['status'] =
    interval_days >= 21 ? 'mastered' :
    interval_days >= 6  ? 'review'   :
    repetitions > 0     ? 'learning' : 'new';

  const next_review_at = new Date();
  next_review_at.setDate(next_review_at.getDate() + Math.max(1, Math.round(interval_days)));

  return { repetitions, interval_days, ease_factor, next_review_at, status, was_lapse };
}

// Maps frontend button labels to SM-2 quality scores
export const QUALITY_MAP = {
  again: 1,
  hard: 2,
  good: 4,
  easy: 5,
} as const;

export function computeXp(quality: number, prevStatus: string, newStatus: string): number {
  let xp = 0;
  if (quality >= 3) xp += 10; // correct answer
  if (prevStatus !== 'mastered' && newStatus === 'mastered') xp += 25;
  else if (prevStatus === 'new' && newStatus === 'learning') xp += 5;
  return xp;
}

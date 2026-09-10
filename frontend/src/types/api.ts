export interface LearningUnit {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  module_name: string | null;
  markdown_path: string | null;
  slide_count: number;
  extracted_text: string | null;
  status: 'pending' | 'processing' | 'ready' | 'warning' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  total_cards: number;
  new_cards: number;
  learning_cards: number;
  review_cards: number;
  mastered_cards: number;
  due_cards: number;
}

export interface ExamQuestion {
  id: number;
  question_text: string;
  question_type: 'mc' | 'truefalse' | 'fillin' | 'shortanswer';
  options: string | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
}

export interface ExamModule {
  module_name: string;
  unit_count: number;
  question_count: number;
}

export interface Question {
  id: number;
  unit_id: number;
  question_text: string;
  question_type: 'mc' | 'truefalse' | 'fillin' | 'shortanswer' | 'feynman';
  options: string | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
  source_hint: string | null;
  created_at: string;
  card_id?: number;
  card_status?: string;
  interval_days?: number;
  ease_factor?: number;
  repetitions?: number;
  next_review_at?: string;
}

export interface SrsCard {
  id: number;
  question_id: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  // joined question fields
  question_text: string;
  question_type: string;
  options: string | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
  source_hint: string | null;
  unit_id: number;
  unit_title: string;
}

export interface UserStats {
  id: number;
  total_xp: number;
  level: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface Badge {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
}

export interface Session {
  id: number;
  unit_id: number | null;
  unit_title?: string;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  cards_studied: number;
  correct_count: number;
  xp_earned: number;
}

export interface AwardResult {
  xpDelta: number;
  newLevel: number | null;
  newBadges: Badge[];
  streakUpdate: { current: number; longest: number };
}

export interface FeynmanEvaluation {
  score: number;
  feedback: string;
  correct_points: string[];
  missing_points: string[];
}

export interface AnalyticsAccuracy {
  date: string;
  accuracy: number;
  total_reviews: number;
}

export interface WeakSpot {
  topic_tag: string;
  accuracy: number;
  total_reviews: number;
}

export interface ForgettingPoint {
  dayOffset: number;
  retentionPct: number;
}

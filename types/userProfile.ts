export interface UserGoals {
  bench_press_target?: number;
  squat_target?: number;
  deadlift_target?: number;
  body_weight_target?: number;
  target_date?: string;
}

export interface UserCurrentStats {
  bench_press_max?: number;
  squat_max?: number; // Fixed typo: was squat_pmax
  deadlift_max?: number;
  current_weight?: number;
  last_updated?: string;
}

export interface UserPreferences {
  dashboard_conversation_id?: string;
  preferred_units?: "metric" | "imperial";
  dashboard_timeframe?: "1_week" | "2_weeks" | "1_month";
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  is_imperial: boolean;
  goal?: string;
  training_history?: any;
  age_group?: number;

  // New field
  instagram_username?: string;

  // Structured fields
  goals?: UserGoals;
  current_stats?: UserCurrentStats;
  preferences?: UserPreferences;
}

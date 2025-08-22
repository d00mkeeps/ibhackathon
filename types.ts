import { ChatConfigName } from "./types/chat";

export interface ProgramExercise {
  id: string;
  name?: string;
  description?: string;
  setData?: SetData[];
  orderInWorkout?: number;
  sets?: number;
  reps?: number;
  duration?: string;
}

export interface ProgramWorkout {
  id: string;
  name: string;
  description: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  workouts: Workout[];
}

export interface ProgramDetailSlideProps {
  program: Program;
  selectedWorkout: Workout | null;
  onWorkoutChange: (workout: Workout | null) => void;
}

export interface HeaderProps {
  title: string;
  onClose: () => void;
}

export interface WorkoutDisplayProps {
  workout: Workout | null;
  workouts: Workout[];
  onWorkoutChange: (workout: Workout) => void;
}

export interface ExerciseCardProps {
  exercise: ProgramExercise;
}

export interface ProgramNoteSlideProps {
  program: Program;
}

export type RootStackParamList = {
  ConversationList: undefined;
  Conversation: { conversationId: string };
};
export type ConversationListProps = {
  onConversationPress: (id: string) => void;
};

export interface ConversationUIProps {
  title: string;
  subtitle: string;
  messages: any[];
  draftMessage?: string;
  onSendMessage: (message: string) => void;
  onDraftMessageChange?: (draft: string) => void;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  user_id?: number;
  orderInWorkout?: number;
  exercises: WorkoutExercise[];
}
export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  workouts: Workout[];
}

export interface ProfileGroupProps {
  profile: UserProfile;
}

export interface ProgramCardProps {
  program: Program;
  onPress?: (programId: string) => void;
}

export interface ProgramListProps {
  programs: Program[];
  onProgramPress?: (programId: string) => void;
}

export interface ProgramsScreenProps {
  navigation: any;
}

export interface WorkoutSelectProps {
  workouts: string[];
  selectedWorkout: string;
  onSelectWorkout: (workout: string) => void;
}

export interface ProgramDetailsModalProps {
  program: Program;
  isVisible: boolean;
  onClose: () => void;
}

export interface UseConversationProps {
  initialConversation: Conversation;
}
export interface Message {
  id: string;
  conversation_id: string;
  conversation_sequence: number;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  expectsGraph?: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  config_name: ChatConfigName; // Add this
  created_at: Date;
  updated_at: Date;
  status: "active" | "archived" | "deleted";
  message_count: number;
}
export interface UserProfile {
  preferences: any;
  goals: any;
  current_stats: any;
  age: number | null;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  is_imperial: boolean;
  auth_user_uuid: string | null;
  training_history: any | null;
  instagram_username: string | null;
  avatar_image_id: string | null;
}

export interface WorkoutExercise {
  id: string;
  name?: string;
  description?: string;
  workout_id: string;
  exercise_id: number;
  exercise_name: string;
  set_data: SetData[];
  order_in_workout: number;
  createdAt?: any;
}

export interface SetData {
  reps?: number;
  weight?: number;
  duration?: string;
}

export interface ExerciseListProps {
  workout: Workout;
}

export interface WorkoutHeaderProps {
  workouts: Workout[];
  selectedWorkout: Workout | null;
  onSelectWorkout: (workout: Workout) => void;
}

export { ChatConfigName };

export type ExerciseType = 
  | 'splits' | 'samenvoegen' | 'optellen' | 'aftrekken'
  | 'vermenigvuldigen' | 'delen' | 'rij' | 'meerkeuze'
  | 'meten' | 'breuken' | 'mixed';

export type GradeLevel = 'group-3' | 'group-4' | 'group-5' | 'group-6' | 'group-7' | 'group-8';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ValidationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export interface ExerciseVariation {
  id: string;
  exercise_id: string;
  problem: string;
  correct_answer: string;
  explanation: string | null;
  hints: string[];
  workSteps: string[];
  // Extra velden voor rijtypen:
  sequence?: (number | null)[];  // voor telrij
  options?: string[];             // voor meerkeuze
  correct_option_index?: number;  // voor meerkeuze
}

export interface Exercise {
  id: string;
  title: string;
  description: string | null;
  exercise_type: ExerciseType;
  grade_level: GradeLevel;
  difficulty: Difficulty;
  topic: string | null;
  original_problem: string | null;
  estimated_time: number;
  source_file: string | null;
  validation_status: ValidationStatus;
  editor_notes: string | null;
  question_type: string | null;
  variations: ExerciseVariation[];
  created_at: string;
}

export interface GenerateVariationsRequest {
  exerciseId: string;
  count: number;
  difficulty: 'easier' | 'same' | 'harder';
  maxNumber: 10 | 100 | 1000 | 10000;
  context?: 'getallen' | 'geld' | 'meten' | 'dieren';
}
